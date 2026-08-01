"use client";

import { motion } from "framer-motion";
import VoiceWidget from "../components/VoiceWidget";
import RecentCalls from "../components/RecentCalls";
import QuickLookup from "../components/QuickLookup";
import TiltCard from "../components/TiltCard";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 90, damping: 16 },
  },
};

export default function HomePage() {
  return (
    <motion.main
      className="min-h-screen px-6 py-10 md:px-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={item} className="text-center mb-10">
        <motion.p
          className="text-xs tracking-[0.3em] uppercase text-radiant-500 mb-2"
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Powered by ElevenLabs + Supabase
        </motion.p>
        <h1 className="text-4xl md:text-5xl font-bold gradient-text pb-1">
          AI Customer Support Voice Agent
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Ask about your order, ticket, payment, or account — out loud, in real time.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <motion.div variants={item} className="lg:col-span-1">
          <TiltCard className="rounded-3xl">
            <VoiceWidget />
          </TiltCard>
        </motion.div>
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={item}>
            <TiltCard className="rounded-3xl">
              <QuickLookup />
            </TiltCard>
          </motion.div>
          <motion.div variants={item}>
            <TiltCard className="rounded-3xl">
              <RecentCalls />
            </TiltCard>
          </motion.div>
        </div>
      </div>

      <motion.footer
        variants={item}
        className="text-center text-xs text-slate-400 mt-12"
      >
        Backend never runs raw SQL from the agent — every request goes through
        validated, access-controlled functions.
      </motion.footer>

      <AnalyticsDashboard />
    </motion.main>
  );
}
