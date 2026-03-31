"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { handleResumeAnalysis } from "./interviews"

export type Job = {
  id: string;
  title: string;
  description: string;
  shareable_link: string;
  created_at: string;
}

export async function createJobAction(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title")?.toString()
  const description = formData.get("description")?.toString()
  const duration = formData.get("duration")?.toString()
  const typesRaw = formData.get("types")?.toString()
  
  let types = ["technical"]
  if (typesRaw) {
    try {
      types = JSON.parse(typesRaw)
    } catch (e) {
      console.error(e)
    }
  }

  if (!title || !description) {
    return { error: "Title and description are required" }
  }

  // Generate a random unique alphanumeric string for the link
  const uniqueToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized Session" }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title,
      description,
      duration: duration ? parseInt(duration, 10) : 15,
      types,
      shareable_link: uniqueToken,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating job:", error)
    return { error: "Failed to create Job" }
  }

  // Handle Optional Initial Candidates
  const countStr = formData.get("candidatesCount")?.toString();
  const candidatesCount = countStr ? parseInt(countStr, 10) : 0;
  const previewsRaw = formData.get("candidatePreviews")?.toString();
  let candidatePreviews: any[] = [];
  if (previewsRaw) {
    try {
      candidatePreviews = JSON.parse(previewsRaw);
    } catch (e) {
      console.error("Error parsing candidate previews:", e);
    }
  }

  let insertedCandidates: any[] = [];

  if (candidatesCount > 0) {
    const interviewPromises = [];
    for (let i = 0; i < candidatesCount; i++) {
        const candidateName = formData.get(`candidateName_${i}`)?.toString()
        const candidateEmail = formData.get(`candidateEmail_${i}`)?.toString()
        const resumeFile = formData.get(`resume_${i}`) as File | null

        if (candidateName && candidateEmail) {
            // Process each candidate concurrently
            interviewPromises.push((async () => {
                const preview = candidatePreviews.find((p: any) => p.email === candidateEmail);
                const resumeData = await handleResumeAnalysis(
                    supabase, 
                    data.id, 
                    title, 
                    description, 
                    resumeFile,
                    preview?.hasAnalysis ? {
                        resumeScore: preview.resumeScore,
                        resumeSummary: preview.resumeSummary,
                        customQuestions: preview.customQuestions,
                        resumeText: preview.resumeText
                    } : undefined
                )
                const { data: inserted } = await supabase.from("interviews").insert({
                    job_id: data.id,
                    candidate_name: candidateName,
                    candidate_email: candidateEmail,
                    status: "PENDING",
                    ...resumeData
                }).select().single()
                return inserted;
            })());
        }
    }
    const results = await Promise.all(interviewPromises);
    insertedCandidates = results.filter(Boolean);
  } else {
    // Fallback for older API calls just in case
    const candidateName = formData.get("candidateName")?.toString()
    const candidateEmail = formData.get("candidateEmail")?.toString()
    const resumeFile = formData.get("resume") as File | null

    if (candidateName && candidateEmail) {
      const resumeData = await handleResumeAnalysis(supabase, data.id, title, description, resumeFile)
      const { data: inserted } = await supabase.from("interviews").insert({
        job_id: data.id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: "PENDING",
        ...resumeData
      }).select().single()
      if (inserted) insertedCandidates.push(inserted);
    }
  }

  // Revalidate the dashboard path
  revalidatePath("/")

  return { success: true, link: uniqueToken, job: data, candidates: insertedCandidates }
}

export async function getJobsAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized Session", jobs: [] }

  // Fetch jobs and their interview counts
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      shareable_link,
      created_at,
      interviews (id, status, evaluation_summary)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs:", error)
    return { error: "Failed to fetch jobs" }
  }

  // Map to include interview count, completed count, and avg score
  const mappedJobs = jobs.map(job => {
    const allInterviews = (job.interviews as any[] | undefined) || []
    const completedInterviews = allInterviews.filter((i: any) => i.status === 'COMPLETED')
    const techScores = completedInterviews
      .map((i: any) => i.evaluation_summary?.technicalScore)
      .filter((s: any) => typeof s === 'number')
    const avgTechnicalScore = techScores.length > 0
      ? Math.round((techScores.reduce((a: number, b: number) => a + b, 0) / techScores.length) * 10) / 10
      : null
    return {
      ...job,
      interviewsCount: allInterviews.length,
      completedCount: completedInterviews.length,
      avgTechnicalScore
    }
  })

  return { jobs: mappedJobs }
}

export async function getJobByIdAction(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { error: "Job not found" }
  }

  return { job: data }
}
export async function getDashboardDataAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized Session" }

  // 1. Fetch total counts
  const { count: jobsCount, error: jobsError } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { data: interviews, error: interviewsError } = await supabase
    .from("interviews")
    .select(`
      id,
      status,
      created_at,
      candidate_name,
      resume_score,
      evaluation_summary,
      jobs!inner(title, user_id)
    `)
    .eq("jobs.user_id", user.id)
    .order("created_at", { ascending: false })

  if (jobsError || interviewsError) {
    console.error("Dashboard Data Fetch Error:", jobsError || interviewsError)
    return { error: "Failed to fetch dashboard data" }
  }

  const totalInterviews = interviews.length
  const completedInterviews = interviews.filter(i => i.status === "COMPLETED").length
  const pendingInterviews = interviews.filter(i => i.status === "PENDING").length
  const completionRate = totalInterviews > 0 ? Math.round((completedInterviews / totalInterviews) * 100) : 0

  const scoredInterviews = interviews.filter(i => typeof i.resume_score === "number")
  const avgResumeScore = scoredInterviews.length > 0
    ? Math.round((scoredInterviews.reduce((acc, curr) => acc + (curr.resume_score as number), 0) / scoredInterviews.length) * 10) / 10
    : null

  // Process data for charts
  const verdictCounts = { "Strong Hire": 0, "Hire": 0, "No Hire": 0 }
  const timelineMap: Record<string, number> = {}

  // Initialize last 7 days for timeline
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    timelineMap[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0
  }

  interviews.forEach(i => {
    // Verdicts Pie Chart (Only for completed)
    if (i.status === "COMPLETED" && i.evaluation_summary?.finalVerdict) {
       const v = i.evaluation_summary.finalVerdict
       if (v === "Strong Hire") verdictCounts["Strong Hire"]++
       else if (v === "Hire") verdictCounts["Hire"]++
       else if (v === "No Hire") verdictCounts["No Hire"]++
    }

    // Timeline Bar Chart (Based on creation date)
    const d = new Date(i.created_at)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (timelineMap[dateStr] !== undefined) {
      timelineMap[dateStr]++
    }
  })

  const verdictStats = [
    { name: "Strong Hire", value: verdictCounts["Strong Hire"], color: "#22c55e" },
    { name: "Hire", value: verdictCounts["Hire"], color: "#3b82f6" },
    { name: "No Hire", value: verdictCounts["No Hire"], color: "#ef4444" }
  ].filter(v => v.value > 0) // Only show slices with actual data

  const activityTimeline = Object.entries(timelineMap).map(([date, count]) => ({
    date,
    interviews: count
  }))

  // Format recent activity
  const recentActivity = interviews.slice(0, 5).map(i => ({
    id: i.id,
    candidateName: i.candidate_name,
    jobTitle: (i.jobs as any).title,
    status: i.status,
    createdAt: i.created_at
  }))

  return {
    stats: {
      totalJobs: jobsCount || 0,
      totalInterviews,
      completedInterviews,
      pendingInterviews,
      completionRate,
      avgResumeScore,
      verdictStats,
      activityTimeline
    },
    recentActivity
  }
}

export async function deleteJobAction(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized Session" }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("user_id", user.id) // Ensure only the owner can delete

  if (error) {
    console.error("Error deleting job:", error)
    return { error: "Failed to delete Job" }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
