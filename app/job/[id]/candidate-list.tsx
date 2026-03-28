"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, UserCircle2, BrainCircuit, MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react"

const timeAgo = (dateStr: string) => {
    const time = new Date(dateStr).getTime()
    const now = Date.now()
    const diff = Math.floor((now - time) / 1000 / 60) // minutes
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff} mins ago`
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`
    return `${Math.floor(diff / 1440)} days ago`
}

export default function CandidateList({ interviews }: { interviews: any[] }) {
  if (!interviews || !interviews.length) {
    return (
      <Card className="mt-8 border-dashed bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Users className="size-16 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">No Candidates Yet</h3>
          <p className="mt-2 max-w-sm">Share the interview link above with candidates to start gathering automated AI evaluations.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Candidate Results</h2>
          <Badge variant="secondary" className="px-3 py-1 font-semibold text-sm">
             {interviews.length} Total
          </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {interviews.map((interview) => (
          <CandidateCard key={interview.id} interview={interview} />
        ))}
      </div>
    </div>
  )
}

function CandidateCard({ interview }: { interview: any }) {
  const isCompleted = interview.status === "COMPLETED"
  const evalData = interview.evaluation_summary

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg border-slate-200 ${!isCompleted ? "opacity-75 grayscale-[0.2]" : "border-t-4 border-t-primary"}`}>
      <CardHeader className="bg-slate-50/70 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100">
                <UserCircle2 className="size-8 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">{interview.candidate_name}</CardTitle>
              <div className="text-xs font-medium text-slate-500 mt-1" suppressHydrationWarning>
                {interview.candidate_email && <span className="mr-1">{interview.candidate_email} •</span>} {timeAgo(interview.created_at)}
              </div>
            </div>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500 hover:bg-green-600 shadow-sm" : ""}>
             {isCompleted ? "Evaluated" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {isCompleted && evalData ? (
          <div className="space-y-5">
            {/* Scores */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col bg-slate-50 border border-slate-100 p-3 rounded-xl items-center shadow-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1"><BrainCircuit className="size-3.5"/> Technical</span>
                    <span className="font-extrabold text-2xl text-slate-800">{evalData.technicalScore}<span className="text-sm font-medium text-slate-400">/10</span></span>
                </div>
                <div className="flex flex-col bg-slate-50 border border-slate-100 p-3 rounded-xl items-center shadow-sm">
                    <span className="text-slate-500 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1"><MessageSquare className="size-3.5"/> Comm.</span>
                    <span className="font-extrabold text-2xl text-slate-800">{evalData.communicationScore}<span className="text-sm font-medium text-slate-400">/10</span></span>
                </div>
            </div>

            {/* Verdict */}
            <div className="flex justify-between items-center text-sm font-bold bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                AI Verdict: 
                <span className={
                    evalData.finalVerdict === "Strong Hire" ? "text-green-600 bg-green-50 px-2 py-0.5 rounded-md" :
                    evalData.finalVerdict === "Hire" ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md" : 
                    "text-red-600 bg-red-50 px-2 py-0.5 rounded-md"
                }>
                    {evalData.finalVerdict}
                </span>
            </div>

            {/* View Full Summary Page */}
            <Link href={`/job/${interview.job_id}/candidate/${interview.id}`}>
              <Button className="w-full mt-2 font-semibold shadow-sm hover:bg-slate-100 transition-colors" variant="outline" size="default">
                  View Full AI Report
              </Button>
            </Link>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
            <Loader2 className="size-6 text-slate-300 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-500">Candidate has not finished the interview yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
