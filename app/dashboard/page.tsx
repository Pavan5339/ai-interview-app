import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ActionCards } from "@/components/dashboard/action-cards"
import { InterviewCards } from "@/components/dashboard/interview-cards"
import { getJobsAction } from "@/app/actions/jobs"

export default async function Dashboard() {
  const { jobs } = await getJobsAction()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" activeItem="All Interview" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header userName="Sarah" />

        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl space-y-8">
            <ActionCards />
            <InterviewCards jobs={jobs?.slice(0, 3)} />
          </div>
        </main>
      </div>
    </div>
  )
}
