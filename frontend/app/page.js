import VoiceWidget from "../components/VoiceWidget";
import RecentCalls from "../components/RecentCalls";
import QuickLookup from "../components/QuickLookup";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-16">
      <header className="text-center mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-radiant-500 mb-2">
          Powered by ElevenLabs + Supabase
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-radiant-600 via-radiant-500 to-radiant-400 bg-clip-text text-transparent">
          AI Customer Support Voice Agent
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Ask about your order, ticket, payment, or account — out loud, in real time.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-1">
          <VoiceWidget />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <QuickLookup />
          <RecentCalls />
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 mt-12">
        Backend never runs raw SQL from the agent — every request goes through
        validated, access-controlled functions.
      </footer>
    </main>
  );
}
