"use client";
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import Navbar from "../navbar";

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      alert(`Creating: ${prompt}`);
    }
  };

  return (
    <div className="min-h-screen  text-zinc-200">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-6 py-32 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-medium text-amber-50 mb-6 text-center tracking-tight">
          Create anything
        </h1>

        <p className="text-lg text-zinc-500 mb-16 text-center max-w-xl">
          Describe what you want to create
        </p>

        {/* Input Box */}
        <div className="w-full max-w-2xl mb-8">
          <div className="relative bg-[#231f1c] border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-colors">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a landing page for..."
              className="w-full bg-transparent text-white placeholder-neutral-600 resize-none outline-none px-6 py-5 text-base min-h-[120px]"
              rows={3}
            />
            <div className="px-4 pb-4 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-white text-black rounded-md font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                Create
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 justify-center text-sm">
          {["Landing page", "Dashboard", "Portfolio", "Blog"].map(
            (suggestion) => (
              <button
                key={suggestion}
                onClick={() =>
                  setPrompt(`Create a ${suggestion.toLowerCase()}`)
                }
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors text-neutral-400 hover:text-white"
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </main>
    </div>
  );
}
