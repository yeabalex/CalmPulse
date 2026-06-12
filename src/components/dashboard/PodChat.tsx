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

function renderInlineMarkdown(text: string, isOwn: boolean) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={`${part}-${index}`}
          className={isOwn ? "font-extrabold text-white" : "font-extrabold text-slate-950"}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderMessageText(text: string, isOwn: boolean) {
  const lines = text.split(/\r?\n/);

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`blank-${index}`} className="h-1" />;
        }

        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          return (
            <p
              key={`heading-${index}`}
              className={`font-extrabold leading-snug ${
                isOwn ? "text-white" : "text-slate-950"
              } ${heading[1].length === 1 ? "text-sm" : "text-xs"}`}
            >
              {renderInlineMarkdown(heading[2], isOwn)}
            </p>
          );
        }

        const bullet = trimmed.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={`bullet-${index}`} className="flex gap-2">
              <span className="mt-[0.45em] h-1 w-1 rounded-full bg-current opacity-60 shrink-0" />
              <p className="min-w-0">{renderInlineMarkdown(bullet[1], isOwn)}</p>
            </div>
          );
        }

        const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
        if (numbered) {
          return (
            <div key={`numbered-${index}`} className="flex gap-2">
              <span className="font-extrabold opacity-70 shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
              <p className="min-w-0">{renderInlineMarkdown(numbered[1], isOwn)}</p>
            </div>
          );
        }

        return <p key={`line-${index}`}>{renderInlineMarkdown(trimmed, isOwn)}</p>;
      })}
    </div>
  );
}

export default function CompanionChat({ completedCount, totalCount }: CompanionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
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
    let active = true;
    queueMicrotask(() => {
      if (active) void fetchMessages();
    });
    return () => {
      active = false;
    };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);

    try {
      setError("");
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
      setDraft("");
      if (isDemo) {
        localStorage.setItem("calmpulse_companion_messages", JSON.stringify(currentMessages));
      }

      const res = await fetch("/api/pod/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userMessage.text,
          demo: isDemo,
          demoContext: isDemo
            ? {
                completedCount,
                totalCount,
                messages: currentMessages.slice(-8).map((message) => ({
                  text: message.text.slice(0, 500),
                  isOwn: message.isOwn,
                })),
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.message) {
          const finalMessages = [...currentMessages, json.message];
          setMessages(finalMessages);
          if (isDemo) {
            localStorage.setItem("calmpulse_companion_messages", JSON.stringify(finalMessages));
          }
        } else {
          setError("The companion could not respond. Try again in a moment.");
        }
      } else {
        setError("The companion could not respond. Try again in a moment.");
      }
    } catch (err) {
      console.error("Failed to send companion message:", err);
      setError("The companion could not respond. Try again in a moment.");
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
                {renderMessageText(msg.text, msg.isOwn)}
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
