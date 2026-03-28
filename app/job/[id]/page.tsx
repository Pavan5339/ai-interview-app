import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import JobShareView from "./client-page"
import { getJobByIdAction } from "@/app/actions/jobs"
import { getInterviewsByJobIdAction } from "@/app/actions/interviews"
import { notFound } from "next/navigation"
import CandidateList from "./candidate-list"
export default async function JobDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const { job, error: jobError } = await getJobByIdAction(id)
  const { interviews } = await getInterviewsByJobIdAction(id)

  if (jobError || !job) {
    notFound()
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" activeItem="All Interview" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header userName="Sarah" />

        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          <JobShareView job={job} />
          
          <CandidateList interviews={interviews || []} />
        </main>
      </div>
    </div>
  )
}
