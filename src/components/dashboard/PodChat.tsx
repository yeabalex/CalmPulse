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
  anxietyScore: number;
}

const INITIAL_DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "msg_1",
    userId: "companion",
    userName: "AI Companion",
    text: "Hello! I am your AI Pacing Companion. I monitor your daily pacing indicators and can help guide you through anxiety triggers or schedule adjustments. How are you feeling today?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isOwn: false
  }
];

export default function CompanionChat({ completedCount, totalCount, anxietyScore }: CompanionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(() => {
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
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);

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

      if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
        botResponse = `Hello! I'm here. Looking at your records today, you have completed ${completedCount} of your ${totalCount} daily pacing plan habits, and your current stress baseline is at ${anxietyScore.toFixed(1)}/10. What is on your mind?`;
      } else if (lowerText.includes("anxious") || lowerText.includes("stressed") || lowerText.includes("overwhelmed") || lowerText.includes("panic")) {
        botResponse = `I hear you. If you are experiencing somatic spikes, I highly recommend clicking the red SOS button in the bottom right corner to start immediate breathing guidance. Or we can practice a 4-7-8 breathing pause right here.`;
      } else if (lowerText.includes("habit") || lowerText.includes("task") || lowerText.includes("pace") || lowerText.includes("do today")) {
        if (completedCount === 0) {
          botResponse = `You haven't completed any pacing habits today yet. I recommend starting with the "Somatic Grounding Pause" (5m breathing break) on your checklist to help lower your ${anxietyScore.toFixed(1)} stress score.`;
        } else if (completedCount < totalCount) {
          botResponse = `You've checked off ${completedCount} pacing habits so far. Great effort! Try completing the remaining activities to satisfy today's pacing target.`;
        } else {
          botResponse = `Excellent work! You have completed all ${totalCount} pacing habits for today. Your stress baseline has been successfully decelerated.`;
        }
      } else {
        // Standard conversational responses incorporating user stats
        const answers = [
          `Pacing is all about small, steady adjustments. Since your stress score is currently ${anxietyScore.toFixed(1)}, let's focus on setting tight boundaries on your digital notifications this evening.`,
          `I notice you have checked off ${completedCount}/${totalCount} habits today. How are you feeling physically? Are you experiencing any shoulder tension or chest tightness?`,
          `That is helpful context. Remember, the goal isn't productivity—it's bio-regulatory stability. Take a step back and engage in a somatic pause if you need to.`,
          `I am keeping track of your logs. Your historical data suggests you recover faster on days when you complete your pacing strolls. Let's try to do that today.`
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
          maxLength={500}
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
