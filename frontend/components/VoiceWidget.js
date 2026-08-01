"use client";

import { useEffect } from "react";

export default function VoiceWidget() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  useEffect(() => {
    if (document.getElementById("elevenlabs-convai-script")) return;
    const script = document.createElement("script");
    script.id = "elevenlabs-convai-script";
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);
  }, []);

  if (!agentId) {
    return (
      <div className="glass-card p-6 text-center text-slate-500">
        Set <code className="px-1 rounded bg-radiant-100">NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code>{" "}
        in your <code>.env.local</code> to activate the voice widget.
      </div>
    );
  }

  return (
    <div className="glass-card glass-card-hover p-8 flex flex-col items-center gap-4 radiant-ring">
      <div className="pulse-glow w-3 h-3 rounded-full bg-radiant-500" />
      <p className="text-sm uppercase tracking-widest text-radiant-600 font-medium">
        Speak to Support
      </p>
      {/* ElevenLabs Conversational AI widget web component */}
      <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
      <p className="text-xs text-slate-500 text-center max-w-xs">
        Tap the mic and ask about an order, ticket, payment, or your account.
      </p>
    </div>
  );
}
