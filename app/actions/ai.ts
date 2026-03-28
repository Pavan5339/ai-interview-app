"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

export type ChatMessage = { role: "user" | "assistant" | "system", content: string }
export type JobContext = { title: string, description: string, duration?: number, types?: string[] }

export async function generateNextQuestion(jobContext: JobContext, chatHistory: ChatMessage[]) {
  const isInitial = chatHistory.length === 0;
  
  const systemPrompt = `
You are an expert technical AI recruiter named AIcruiter.
Role: ${jobContext.title}
Context: ${jobContext.description}
Focus areas: ${(jobContext.types || []).join(", ") || "General Technical"}.
Duration: ${jobContext.duration || 15} minutes.

Instructions:
1. Conduct a professional, natural interview.
2. Ask ONLY **one** single, focused question at a time. No multi-part walls of text.
3. If this is the start of the chat, introduce yourself warmly in 1 short sentence, and then ask the first question.
4. If you are responding to the candidate, briefly acknowledge their answer, then ask the next relevant question.
5. If you feel the interview has reached a natural conclusion or enough core questions have been asked (approx 4-6), return isFinished = true and write a concluding remark thanking them for their time instead of a question.
  `

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        question: z.string().describe("Your spoken response to the candidate, either introducing yourself, assessing them, or asking the next question."),
        isFinished: z.boolean().describe("True if you have asked enough questions and are concluding the interview. False otherwise."),
      }),
      system: systemPrompt,
      messages: isInitial ? [{ role: "user", content: "Hello, I am ready to start the interview." }] : chatHistory,
    })

    return { success: true, response: object }
  } catch (error) {
    console.error("Gemini Generation Error:", error)
    return { error: "Failed to generate AI response." }
  }
}

export async function generateInterviewEvaluation(jobContext: JobContext, chatHistory: ChatMessage[]) {
  const systemPrompt = `
You are an expert technical evaluator. Review the following interview transcript for the role of ${jobContext.title}.
Analyze the candidate's responses carefully and provide a structured JSON evaluation.
  `

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        technicalScore: z.number().min(1).max(10),
        communicationScore: z.number().min(1).max(10),
        strengths: z.array(z.string()).describe("List of key strengths demonstrated"),
        weaknesses: z.array(z.string()).describe("List of areas for improvement"),
        summary: z.string().describe("A highly detailed, comprehensive 3-4 paragraph summary of their entire performance, technical depth, communication style, and overall fit for the role. This must be an extensive and in-depth review."),
        finalVerdict: z.enum(["Strong Hire", "Hire", "No Hire"])
      }),
      system: systemPrompt,
      messages: chatHistory,
    })

    return { success: true, evaluation: object }
  } catch (error: any) {
    console.error("Gemini Evaluation Error:", error)
    return { success: false, error: error.message || "Failed to generate evaluation." }
  }
}

export async function generatePreviewQuestionsAction(jobContext: JobContext) {
  const systemPrompt = `
You are an expert technical recruiter named AIcruiter.
Role: ${jobContext.title}
Job Description: ${jobContext.description}
Focus Areas: ${(jobContext.types || []).join(", ")}.

Generate exactly 5 highly relevant interview questions specifically tailored to evaluate the required skills for this position.
Each question should be practical and test the candidate's actual competency in the focus areas. DO NOT write generic React questions unless the role explicitly requires React.
  `

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        questions: z.array(z.object({
          question: z.string().describe("The interview question text"),
          type: z.string().describe("The category or focus area of the question (e.g., Technical, Behavioral, Problem Solving)")
        })).length(5)
      }),
      system: systemPrompt,
      prompt: "Generate 5 specific questions based heavily on the job description.",
    })

    return { success: true, questions: object.questions }
  } catch (error: any) {
    console.error("Gemini Preview Generation Error:", error)
    // Fallback UI to prevent blocking the recruiter if Gemini is down
    return { 
      success: true, 
      questions: [
        { question: `Tell me about your previous experience working as a ${jobContext.title}.`, type: "Background" },
        { question: "Can you describe a challenging project you lead related to the required skills?", type: "Experience" },
        { question: "How do you ensure quality and handle difficult technical blockers?", type: "Problem Solving" }
      ]
    }
  }
}
