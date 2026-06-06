"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface Question {
  id: string;
  question: string;
}

interface ClarifyingQuestionsProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  onBack: () => void;
}

export default function ClarifyingQuestions({ questions, onSubmit, onBack }: ClarifyingQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (id: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: text
    }));
  };

  const isComplete = questions.every((q) => answers[q.id]?.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete) {
      onSubmit(answers);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          AI Refinements
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          A few clarifying questions...
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Our AI Companion generated these targeted questions based on your description to pin down exact somatic triggers and build your pacing model.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="glass-panel border border-slate-200/60 rounded-2xl p-6 bg-white space-y-3 shadow-sm hover:border-slate-300 transition-colors"
            >
              <label className="block text-sm font-bold text-slate-900">
                <span className="text-slate-400 font-mono mr-1.5">0{idx + 1}.</span>
                {q.question}
              </label>
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Write your answer..."
                className="w-full h-20 p-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-950 focus:outline-none resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-all text-xs cursor-pointer"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={!isComplete}
            className={`px-8 py-3.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              isComplete
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            Calculate Baseline
          </button>
        </div>
      </form>
    </div>
  );
}
