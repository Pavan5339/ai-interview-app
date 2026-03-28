"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, Code, Copy, Loader2, Mail, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generatePreviewQuestionsAction } from "@/app/actions/ai"
import { createJobAction } from "@/app/actions/jobs"
import { toast } from "sonner"

const interviewTypes = [
  { id: "technical", label: "Technical" },
  { id: "behavioral", label: "Behavioral" },
  { id: "experience", label: "Experience" },
  { id: "problem-solving", label: "Problem Solving" },
  { id: "leadership", label: "Leadership" },
]

export function CreateInterviewForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["technical"])
  
  // Step management
  const [step, setStep] = useState<"form" | "generating" | "review" | "success">("form")
  const [jobData, setJobData] = useState<FormData | null>(null)
  const [generatedLink, setGeneratedLink] = useState("")
  const [previewQuestions, setPreviewQuestions] = useState<{question: string, type: string}[]>([])

  const toggleType = (id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // Handle Initial Form Submit
  function handleGenerate(formData: FormData) {
    formData.append("types", JSON.stringify(selectedTypes))
    setJobData(formData)
    setStep("generating")
    
    startTransition(async () => {
      const title = formData.get("title")?.toString() || ""
      const description = formData.get("description")?.toString() || ""
      
      const res = await generatePreviewQuestionsAction({ title, description, types: selectedTypes })
      if (res.success && res.questions) {
        setPreviewQuestions(res.questions)
      } else {
        toast.error("Failed to generate preview questions.")
        setPreviewQuestions([
          { question: `Tell me about your experience as a ${title}.`, type: "Background" },
          { question: "How do you handle complex technical problems?", type: "General" }
        ])
      }
      setStep("review")
    })
  }

  // Handle Final Submission
  async function handleFinish() {
    if (!jobData) return
    startTransition(async () => {
      const result = await createJobAction(jobData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Interview created successfully!")
        setGeneratedLink(`${window.location.origin}/interview/${result.link}`)
        setStep("success")
      }
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success("Link copied to clipboard!")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b pb-6">
        {step === "form" ? (
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
        ) : step === "success" ? (
          <div className="w-9" /> // spacer to keep title centered implicitly
        ) : (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setStep("form")}>
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <h1 className="text-2xl font-semibold text-foreground">Create New Interview</h1>
      </div>

      {step !== "success" && (
        <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: step === "form" ? "33%" : step === "generating" ? "66%" : "100%" }}
          />
        </div>
      )}

      {step === "form" && (
        <form action={handleGenerate} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">Job Position</Label>
            <Input 
              id="title" 
              name="title" 
              defaultValue={jobData?.get("title")?.toString() || ""}
              placeholder="e.g. Senior Frontend Developer" 
              className="h-12"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">Job Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={jobData?.get("description")?.toString() || ""}
              placeholder="Enter detailed job description..." 
              className="min-h-[150px] resize-y"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-medium">Interview Duration</Label>
            <Select name="duration" defaultValue={jobData?.get("duration")?.toString() || "15"}>
              <SelectTrigger className="h-12 w-full max-w-md">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Interview Types</Label>
            <div className="flex flex-wrap gap-3">
              {interviewTypes.map((type) => {
                const isActive = selectedTypes.includes(type.id)
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`cursor-pointer flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                      isActive 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {type.id === "technical" && <Code className={`size-4 ${isActive ? 'text-primary' : ''}`} />}
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-8">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" type="button">
                Cancel
              </Button>
            </Link>
            <Button size="lg" type="submit" className="px-8 bg-blue-500 hover:bg-blue-600">
              Generate Questions →
            </Button>
          </div>
        </form>
      )}

      {step === "generating" && (
        <Card className="flex flex-col items-center justify-center p-12 text-center shadow-sm animate-in fade-in duration-500">
          <Loader2 className="size-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Generating Interview Questions</h2>
          <p className="mt-2 text-muted-foreground">
            Our AI is crafting personalized questions based on your job position...
          </p>
        </Card>
      )}

      {step === "review" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h2 className="text-lg font-semibold text-foreground">Generated Interview Questions:</h2>
          
          <div className="space-y-4">
            {previewQuestions.map((q, idx) => (
              <Card key={idx} className="p-5 overflow-hidden">
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {q.question}
                  </p>
                  <p className="text-sm text-primary">
                    Type: {q.type}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              size="lg" 
              onClick={handleFinish} 
              disabled={isPending}
              className="px-8 bg-blue-500 hover:bg-blue-600"
            >
              {isPending ? "Creating Link..." : "Create Interview Link & Finish"}
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4 pt-4 pb-2">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-8 text-green-600 dark:text-green-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Your AI Interview is Ready!</h2>
              <p className="text-muted-foreground">Share this link with your candidates to start the interview process</p>
            </div>
          </div>

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Interview Link</Label>
              <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Valid for 30 days
              </div>
            </div>
            
            <div className="flex w-full items-center gap-3">
              <div className="flex-1 rounded-md border bg-muted/50 px-4 py-3 text-sm text-foreground overflow-x-auto whitespace-nowrap">
                {generatedLink}
              </div>
              <Button onClick={handleCopyLink} className="shrink-0 gap-2 bg-blue-600 hover:bg-blue-700">
                <Copy className="size-4" />
                Copy Link
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>{jobData?.get("duration")?.toString() || "15"} Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="size-4" /> 
                <span>5 Questions</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <Label className="text-base font-semibold">Share via</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" className="w-full gap-2 h-12">
                <Mail className="size-4" />
                Email
              </Button>
              <Button variant="outline" className="w-full gap-2 h-12">
                <MessageSquare className="size-4" />
                Slack
              </Button>
              <Button variant="outline" className="w-full gap-2 h-12">
                <MessageSquare className="size-4" />
                WhatsApp
              </Button>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-[200px] gap-2">
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button size="lg" onClick={() => {
              setStep("form");
              setJobData(null);
            }} className="w-[200px] gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4" />
              Create New Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
