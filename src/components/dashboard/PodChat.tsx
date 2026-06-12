"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

interface CompanionChatProps {
  completedCount: number;
  totalCount: number;
}

const INITIAL_DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "msg_1",
    userId: "companion",
    userName: "AI Companion",
    text: "Hello, I'm here with you. What feels most important to talk through right now?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isOwn: false
  }
];

function containsGreeting(text: string) {
  return /\b(hello|hi|hey)\b/i.test(text);
}

export default function CompanionChat({ completedCount, totalCount }: CompanionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";

  const fetchMessages = useCallback(async () => {
    if (isDemo) {
      const saved = localStorage.getItem("calmpulse_companion_messages");
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages(INITIAL_DEMO_MESSAGES);
        }
      } else {
        setMessages(INITIAL_DEMO_MESSAGES);
        localStorage.setItem("calmpulse_companion_messages", JSON.stringify(INITIAL_DEMO_MESSAGES));
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/pod/messages");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessages(json.messages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);

    if (isDemo) {
      const userMessage: ChatMessage = {
        id: `msg_user_${Date.now()}`,
        userId: "user",
        userName: "You",
        text: draft.trim(),
        createdAt: new Date().toISOString(),
        isOwn: true
      };

      const currentMessages = [...messages, userMessage];
      setMessages(currentMessages);
      localStorage.setItem("calmpulse_companion_messages", JSON.stringify(currentMessages));
      setDraft("");
      setSending(false);

      // Simulate AI Pacing Companion response
      setTimeout(() => {
        let botResponse = "";

        const lowerText = userMessage.text.toLowerCase();

        if (containsGreeting(userMessage.text)) {
          botResponse = "Hello, I'm here with you. What feels most important to talk through right now?";
        } else if (lowerText.includes("anxious") || lowerText.includes("stressed") || lowerText.includes("overwhelmed") || lowerText.includes("panic")) {
          botResponse = "I hear you. If this feels intense, you can open Calm Space from the bottom-left button for quiet breathing and grounding. Or we can take a few slow breaths together right here.";
        } else if (lowerText.includes("habit") || lowerText.includes("task") || lowerText.includes("pace") || lowerText.includes("do today")) {
          if (completedCount === 0) {
            botResponse = "You haven't checked in with a pacing habit today yet. A gentle place to start is the body calm break on your checklist.";
          } else if (completedCount < totalCount) {
            botResponse = `You've completed ${completedCount} of ${totalCount} pacing habits today. Pick the easiest remaining one next so the plan keeps moving without adding pressure.`;
          } else {
            botResponse = `You've completed all ${totalCount} pacing habits today. Let the rest of the day be maintenance: lower stimulation, keep transitions gentle, and avoid adding extra obligations.`;
          }
        } else {
          const answers = [
            "Let's keep this small and concrete. Name the one thing that feels heaviest right now, and we can turn it into the next manageable step.",
            "That makes sense. Before solving all of it, try lowering the intensity for the next ten minutes: fewer inputs, slower transitions, and one clear priority.",
            "You do not have to push through this all at once. Pick the next action that would make your body feel 5 percent safer or less overloaded.",
            "Let's pause the analysis for a moment. Put both feet down, unclench your jaw, and tell me what changed even slightly."
          ];
          botResponse = answers[Math.floor(Math.random() * answers.length)];
        }

        const botMessage: ChatMessage = {
          id: `msg_bot_${Date.now()}`,
          userId: "companion",
          userName: "AI Companion",
          text: botResponse,
          createdAt: new Date().toISOString(),
          isOwn: false
        };

        const finalMessages = [...currentMessages, botMessage];
        setMessages(finalMessages);
        localStorage.setItem("calmpulse_companion_messages", JSON.stringify(finalMessages));
      }, 1200);
      return;
    }

    // Real account: send message to the backend
    try {
      const userMessage: ChatMessage = {
        id: `msg_user_${Date.now()}`,
        userId: "user",
        userName: "You",
        text: draft.trim(),
        createdAt: new Date().toISOString(),
        isOwn: true
      };

      setMessages((prev) => [...prev, userMessage]);
      setDraft("");

      const res = await fetch("/api/pod/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userMessage.text }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.message) {
          setMessages((prev) => [...prev, json.message]);
        }
      }
    } catch (err) {
      console.error("Failed to send companion message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassCard className="p-6 shadow-md bg-white border border-slate-200/60 flex flex-col h-[420px] max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-4 shrink-0 border-b border-slate-100 pb-3">
        <div className="space-y-0.5 text-left">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <MessageCircle className="w-4.5 h-4.5 text-slate-700" />
            AI Pacing Companion
          </h3>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wide">
              Companion Active
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
          <Sparkles className="w-3 h-3 text-violet-500 animate-bounce-subtle" />
          Progress-Aware Context
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-8">
            No messages yet. Say hello to your AI Pacing Companion.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.isOwn ? "ml-auto items-end" : "items-start"
              }`}
            >
              <span className="text-[8px] font-bold text-slate-400 mb-0.5 px-1">
                {msg.userName}
              </span>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed text-left ${
                  msg.isOwn
                    ? "bg-slate-900 text-white rounded-br-sm shadow-sm"
                    : "bg-slate-50 border border-slate-150 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="text-[10px] text-rose-600 font-semibold mb-2">{error}</p>
      )}

      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your coach about habits, triggers, or pacing..."
          maxLength={2000}
          className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={!draft.trim() || sending}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl cursor-pointer transition-all flex items-center justify-center"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </GlassCard>
  );
}
