"use client";

import { useEffect, useRef } from "react";

export default function VoiceWidget() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!document.getElementById("elevenlabs-convai-script")) {
      const script = document.createElement("script");
      script.id = "elevenlabs-convai-script";
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }

    const showDashboard = ({ table, email }) => {
      console.log("[voice-widget] show_dashboard called with", { table, email });
      window.dispatchEvent(
        new CustomEvent("ai-voice-support:show-dashboard", {
          detail: { table, email },
        })
      );
      return "Dashboard opened on screen.";
    };

    const clientTools = { show_dashboard: showDashboard };

    // The widget's exact client-tool wiring mechanism can vary by widget
    // version, so we register through every documented/likely path at once —
    // whichever one the loaded widget actually supports will pick it up.
    // Check the browser console for "[voice-widget]" logs to see which fires.

    const handleWidgetCall = (event) => {
      console.log("[voice-widget] elevenlabs-convai:call event fired", event.detail);
      if (event.detail && event.detail.config) {
        event.detail.config.clientTools = {
          ...(event.detail.config.clientTools || {}),
          ...clientTools,
        };
      }
    };

    document.addEventListener("elevenlabs-convai:call", handleWidgetCall);
    const el = widgetRef.current;
    el?.addEventListener("elevenlabs-convai:call", handleWidgetCall);

    // Some widget versions read a `clientTools` property directly off the
    // custom element instead of (or in addition to) the call event.
    if (el) {
      el.clientTools = clientTools;
    }

    return () => {
      document.removeEventListener("elevenlabs-convai:call", handleWidgetCall);
      el?.removeEventListener("elevenlabs-convai:call", handleWidgetCall);
    };
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
      <elevenlabs-convai ref={widgetRef} agent-id={agentId}></elevenlabs-convai>
      <p className="text-xs text-slate-500 text-center max-w-xs">
        Tap the mic and ask about an order, ticket, payment, or your account.
      </p>
    </div>
  );
}
