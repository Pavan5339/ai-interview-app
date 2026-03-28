import { notFound } from "next/navigation"
import { getJobByLinkAction } from "@/app/actions/interviews"
import ActiveInterviewRoom from "./active-room"

export default async function InterviewStartPage(props: { params: Promise<{ link: string }>; searchParams: Promise<{ interviewId?: string }> }) {
  const { link } = await props.params
  const { interviewId } = await props.searchParams
  
  if (!interviewId) {
    return notFound()
  }

  const { job, error } = await getJobByLinkAction(link)

  if (error || !job) {
    return notFound()
  }

  return (
    <ActiveInterviewRoom job={job} interviewId={interviewId} />
  )
}
