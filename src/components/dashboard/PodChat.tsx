"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Loader2, Users } from "lucide-react";
import GlassCard from "@/components/shared/GlassCard";
import CohortInfoWidget from "@/components/shared/vitals/CohortInfoWidget";
import PodMembersModal from "@/components/dashboard/PodMembersModal";
import { MIN_POD_SIZE } from "@/lib/podConstants";

interface PodMember {
  id: string;
  displayName: string;
  isCurrentUser: boolean;
  activeToday: boolean;
}

interface PodData {
  id: string;
  podNumber: number;
  focusArea: string;
  memberCount: number;
  activeCount: number;
  isForming: boolean;
  members: PodMember[];
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

interface PodChatProps {
  pod: PodData | null;
}

export default function PodChat({ pod }: PodChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatEnabled = pod && !pod.isForming;

  const fetchMessages = useCallback(async () => {
    if (!pod) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/pod/messages");
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch {
      console.error("Failed to load pod messages");
    } finally {
      setLoading(false);
    }
  }, [pod]);

  useEffect(() => {
    fetchMessages();
    if (!chatEnabled) return;

    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages, chatEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/pod/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to send message");
        return;
      }
      setMessages((prev) => [...prev, json.message]);
      setDraft("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!pod) {
    return (
      <GlassCard className="p-6 shadow-md bg-white border border-slate-200/60">
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="w-4 h-4" />
          <span className="text-xs font-semibold">Complete onboarding to join your cohort pod.</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6 shadow-md bg-white border border-slate-200/60 flex flex-col h-[420px]">
        <div className="flex justify-between items-start mb-4 shrink-0">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageCircle className="w-4.5 h-4.5 text-slate-700" />
              Cohort Pod Chat
            </h3>
            <CohortInfoWidget
              podId={pod.podNumber}
              activeCount={pod.activeCount}
              totalCount={pod.memberCount}
              onClick={() => setShowMembers(true)}
            />
          </div>
        </div>

        {pod.isForming ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-2">
            <Users className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">
              Waiting for pod mates ({pod.memberCount}/{MIN_POD_SIZE})
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
              Group chat unlocks when at least {MIN_POD_SIZE} peers join your cohort pod. We match by focus area.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-8">
                  No messages yet. Say hello to your pod mates.
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
                      {msg.isOwn ? "You" : msg.userName}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                        msg.isOwn
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
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
                placeholder="Share a pacing win or check-in..."
                maxLength={500}
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl cursor-pointer transition-colors"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </>
        )}
      </GlassCard>

      {showMembers && (
        <PodMembersModal
          podNumber={pod.podNumber}
          focusArea={pod.focusArea}
          members={pod.members}
          onClose={() => setShowMembers(false)}
        />
      )}
    </>
  );
}
