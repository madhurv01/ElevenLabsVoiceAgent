"use client";

import { useEffect } from "react";

export default function VoiceWidget() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  useEffect(() => {
    if (!document.getElementById("elevenlabs-convai-script")) {
      const script = document.createElement("script");
      script.id = "elevenlabs-convai-script";
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    // Registers the "show_dashboard" Client Tool defined on the ElevenLabs
    // agent. The widget fires this event right before a call starts, letting
    // us inject browser-side functions the agent can call mid-conversation —
    // this is how a voice command actually opens UI, since the agent's
    // server tools can only reach our backend, never the page itself.
    const handleWidgetCall = (event) => {
      event.detail.config.clientTools = {
        ...(event.detail.config.clientTools || {}),
        show_dashboard: ({ table, email }) => {
          window.dispatchEvent(
            new CustomEvent("ai-voice-support:show-dashboard", {
              detail: { table, email },
            })
          );
          return "Dashboard opened on screen.";
        },
      };
    };

    document.addEventListener("elevenlabs-convai:call", handleWidgetCall);
    return () => document.removeEventListener("elevenlabs-convai:call", handleWidgetCall);
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
