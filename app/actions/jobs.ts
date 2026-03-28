"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

  // Revalidate the dashboard path
  revalidatePath("/")

  return { success: true, link: uniqueToken, job: data }
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
      interviews (id)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs:", error)
    return { error: "Failed to fetch jobs" }
  }

  // Map to include interview count
  const mappedJobs = jobs.map(job => ({
    ...job,
    interviewsCount: (job.interviews as { id: string }[] | undefined)?.length || 0
  }))

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
