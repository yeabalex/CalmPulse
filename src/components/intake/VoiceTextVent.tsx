"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceTextVentProps {
  focusArea: string;
  onSubmit: (ventText: string) => void;
  onBack: () => void;
}

export default function VoiceTextVent({ focusArea, onSubmit, onBack }: VoiceTextVentProps) {
  const [ventText, setVentText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        if (transcript) {
          setVentText((prev) => prev + transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access was denied. Please check your browser permissions.");
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMessage("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error("Failed to start speech recognition:", err);
        setErrorMessage("Could not start microphone. It might be already in use.");
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onSubmit(ventText.trim());
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="space-y-3 text-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
          {focusArea}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-display">
          Vent openly. How are you feeling right now?
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Write or use your microphone to express what triggered your tension, what symptoms you feel, or what is on your mind. AI will parse this to structure your pacing parameters.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="relative glass-panel rounded-2xl border border-slate-200 shadow-sm p-2 bg-white">
          <textarea
            value={ventText}
            onChange={(e) => setVentText(e.target.value)}
            placeholder="Type your feelings here, or click the mic to voice vent..."
            className="w-full h-48 p-4 text-sm text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <span className="text-[10px] text-slate-400 font-semibold">
              {ventText.length} / 1000 characters
            </span>

            {speechSupported ? (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse-ring"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                } cursor-pointer`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            ) : (
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">
                Voice input not supported in this browser
              </span>
            )}
          </div>
        </div>

        {isListening && (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-500 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            Listening... Speak freely.
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-xl">
            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

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
            disabled={!ventText.trim()}
            className={`px-8 py-3.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              ventText.trim()
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            Submit Vent
          </button>
        </div>
      </form>
    </div>
  );
}
