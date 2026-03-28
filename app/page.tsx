import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Video, Zap, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-white">
            <Bot className="size-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">AIcruiter</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
            Sign In
          </Link>
          <Button asChild className="font-semibold shadow-sm rounded-full px-6">
             <Link href="/signup">Get Started Free</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center text-center px-4 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-3xl" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-3xl" />
          </div>
          
          <div className="max-w-4xl space-y-8 relative z-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Now powered by Gemini 2.5 Flash
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Hire Top Talent with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Voice AI Interviews
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
              Automate your screening process. AIcruiter conducts real-time, 
              two-way conversational technical interviews and provides an instantly graded executive summary.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                <Link href="/signup">
                  Start Interviewing <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full border-slate-300 hover:bg-slate-100">
                <Link href="#features">
                  See how it works
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to scale hiring</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">Stop reading resumes. Let AI cruiter actually talk to your candidates and find the ones who truly know what they are doing.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 p-4 rounded-2xl w-fit mb-6 text-blue-600">
                <Video className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live WebRTC Voice</h3>
              <p className="text-slate-600 leading-relaxed">
                Using Vapi, candidates talk directly to our AI through their microphone in real-time, with sub-500ms latency. No awkward typing.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-100 p-4 rounded-2xl w-fit mb-6 text-indigo-600">
                <Zap className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Evaluation</h3>
              <p className="text-slate-600 leading-relaxed">
                As soon as the interview ends, Gemini 2.5 Flash analyzes the transcript to issue a 1-10 technical score and a highly detailed summary.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-100 p-4 rounded-2xl w-fit mb-6 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Zero Bias Hiring</h3>
              <p className="text-slate-600 leading-relaxed">
                Every candidate gets the exact same structured interview based perfectly on your custom Job Description constraints.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 border-t border-slate-200 bg-white text-center">
        <p className="text-slate-500 font-medium">© 2026 AIcruiter Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
