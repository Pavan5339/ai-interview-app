"use server"

import { createClient } from "@/lib/supabase/server"

export async function getJobByLinkAction(link: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("shareable_link", link)
    .single()

  if (error || !data) {
    console.error("Error fetching job by link:", error)
    return { error: "Job not found or link is invalid" }
  }

  return { job: data }
}

export async function createInterviewAction(formData: FormData) {
  const candidateName = formData.get("candidateName") as string
  const candidateEmail = formData.get("candidateEmail") as string
  const jobId = formData.get("jobId") as string

  if (!candidateName || !candidateEmail || !jobId) {
    return { error: "Missing required fields" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interviews")
    .insert([
      {
        job_id: jobId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: "PENDING"
      }
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating interview:", error)
    return { error: "Failed to start interview" }
  }

  return { success: true, interview: data }
}

export async function completeInterviewAction(interviewId: string, evaluation: any) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("interviews")
    .update({
      status: "COMPLETED",
      evaluation_summary: evaluation
    })
    .eq("id", interviewId)

  if (error) {
    console.error("Error saving evaluation:", error)
    return { error: "Failed to persist interview results" }
  }

  return { success: true }
}

export async function getInterviewsByJobIdAction(jobId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching interviews:", error)
    return { error: "Failed to fetch interviews" }
  }

  return { interviews: data }
}

export async function getInterviewByIdAction(interviewId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", interviewId)
    .single()

  if (error || !data) {
    console.error("Error fetching interview:", error)
    return { error: "Failed to fetch interview details" }
  }

  return { interview: data }
}
