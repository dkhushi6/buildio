"use client";
import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import { Rose, Send, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { getToken } from "@auth/core/jwt";

type ChatMessage = {
  sender: "user" | "system";
  text: string;
};

type LeftSideProps = {
  setProjectMade: React.Dispatch<React.SetStateAction<boolean>>;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setSandboxId: React.Dispatch<React.SetStateAction<string>>;
  projectId: string;
};

const LeftSide = ({
  setProjectMade,
  setUrl,
  setSandboxId,
  projectId,
}: LeftSideProps) => {
  const { data: session } = useSession();
  if (!session?.user) {
    console.log("Login first");
  }
  const [prompt, setPrompt] = useState("");
  const [socketMsg, setSocketMsg] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addSocketMsg = (sender: "system" | "user", text: string) => {
    setSocketMsg((prev) => [...prev, { sender, text }]);
  };
  const socketBoxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (socketBoxRef.current) {
      socketBoxRef.current.scrollTop = socketBoxRef.current.scrollHeight;
    }
  }, [socketMsg]);
  const handleSend = () => {
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, prompt]); // user msg (right)
    sendPrompt();
    setPrompt("");
  };

  const sendPrompt = async () => {
    setLoading(true);
    try {
      console.log("PROJECT CREATION REQ SEND");

      // const res = await axios.get("/api/auth/token");
      // const token = res.data;
      // if (token) {
      //   console.log("no token");
      // }
      if (projectId) {
        console.log("no projectId");
      }
      const userId = session?.user?.id;
      // console.log("token is", token);
      const socket = io("http://localhost:8080");
      socket.emit("projectId", projectId);
      socket.emit("userId", userId);
      socket.emit("getcode", prompt);

      addSocketMsg("system", " Sent prompt to backend…");

      socket.on("sandboxId", (id) => {
        addSocketMsg("system", `$ Sandbox ID: ${id}`);
        setSandboxId(id);
      });

      socket.on("url", (url) => {
        addSocketMsg("system", `$Sandbox URL: https://${url}`);
        setUrl(`https://${url}`);
      });

      socket.on("createFile", (path) => {
        addSocketMsg("system", `$ File created: ${path}`);
      });
      socket.on("stepsDone", () => {
        addSocketMsg(
          "system",
          `$ planned all the steps needed for making the app`
        );
      });
      socket.on("planningStart", () => {
        addSocketMsg("system", `$  Planning Start for app prep`);
      });
      socket.on("replaceFile", (path) => {
        addSocketMsg("system", `$ File replaced: ${path}`);
      });

      socket.on("runCmd", (cmd) => {
        addSocketMsg("system", `$ Command executed: ${cmd}`);
      });

      socket.on("done", () => {
        addSocketMsg("system", "$ All steps completed.");
      });
      socket.on("azur-done", () => {
        addSocketMsg("system", "$ Project Saved in Azur.");
        setProjectMade(true);
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen flex flex-col text-foreground bg-gradient-to-b from-[#1B1917] to-[#151311]">
      {/* Top bar - Enhanced */}
      <div className="flex justify-start gap-3 p-4 border-b items-center border-[#41413F]/50 backdrop-blur-sm sticky top-0 z-10 bg-[#1B1917]/80">
        <div className="flex rounded-xl p-2.5 bg-gradient-to-br from-[#523613] to-[#6B4A1F] shadow-lg shadow-[#523613]/20 hover:shadow-[#523613]/40 transition-all duration-300 hover:scale-105">
          <Rose className="text-amber-50 w-5 h-5" />
        </div>
        <div className="text-amber-50 font-semibold text-lg tracking-tight">
          New project
        </div>
        {loading && (
          <div className="ml-auto flex items-center gap-2 text-amber-200/60 text-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Creating...</span>
          </div>
        )}
      </div>

      {/* User Messages (right side) - Enhanced */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            <div className="text-center space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-amber-600/40" />
              <p>Describe what you want to create</p>
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div key={i} className="flex justify-end animate-fadeIn">
            <div className="max-w-[70%] bg-gradient-to-br from-[#3D2E1F] to-[#2D1F12] text-amber-50 px-5 py-3 rounded-2xl rounded-br-sm shadow-lg border border-[#523613]/30 hover:border-[#523613]/50 transition-all duration-300">
              {message}
            </div>
          </div>
        ))}

        {/* System Messages (left side) - Enhanced */}
        {/* System Messages (left side) - Enhanced Terminal */}
        {socketMsg.length > 0 && (
          <div
            ref={socketBoxRef}
            className="overflow-y-auto p-5 border-2 border-emerald-500/30 rounded-xl bg-gradient-to-br from-[#0a0e0a] via-[#0d120d] to-[#0a0e0a] backdrop-blur-sm shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all duration-300"
            style={{ height: "250px" }}
          >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/20">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              </div>
              <span className="text-emerald-400/70 text-xs font-mono ml-2">
                ~/terminal
              </span>
            </div>

            <div className="space-y-2">
              {socketMsg.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  } animate-fadeIn`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="max-w-[90%] text-[13px] leading-relaxed font-mono group">
                    <div className="flex items-start gap-2  hover:from-emerald-950/60 hover:to-cyan-950/60 px-2 rounded-lg  transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5 group-hover:text-emerald-300 transition-colors">
                        {m.text.startsWith("$") ? "❯" : "●"}
                      </span>
                      <span className="text-cyan-300/90 group-hover:text-cyan-200 transition-colors break-all">
                        {m.text}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input box - Enhanced */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#1B1917] to-transparent p-4">
        <div className="relative bg-[#231F1D] border border-[#41413F] hover:border-[#523613]/50 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl focus-within:border-[#523613] focus-within:shadow-[#523613]/20">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your prompt here..."
            disabled={loading}
            className="flex-1 py-4 px-5 bg-transparent placeholder-zinc-500 w-full text-amber-50 focus:outline-none pr-14 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 text-[#1B1917] rounded-lg hover:from-amber-50 hover:to-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:hover:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LeftSide;
