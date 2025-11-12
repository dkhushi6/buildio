"use client";
import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";

type LeftSideProps = {
  setProjectMade: React.Dispatch<React.SetStateAction<boolean>>;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setSandboxId: React.Dispatch<React.SetStateAction<string>>;
};
const LeftSide = ({ setProjectMade, setUrl, setSandboxId }: LeftSideProps) => {
  const [prompt, setPrompt] = useState("");

  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, prompt]);

    sendPrompt();
    setPrompt("");
  };
  const sendPrompt = async () => {
    setLoading(true);
    try {
      console.log("PROJECT CREATION REQ SEND");
      const socket = io("http://localhost:8080");
      socket.emit("getcode", prompt);
      socket.on("sandboxId", (id) => {
        console.log("🧩 Sandbox ID:", id);
        setSandboxId(id);
      });

      socket.on("url", (url) => {
        console.log("🌐 Sandbox URL:", url);
        const completeUrl = `https://${url}`;
        setUrl(completeUrl);
      });

      socket.on("createFile", (path) => {
        console.log("📄 File created:", path);
      });

      socket.on("replaceFile", (path) => {
        console.log("♻️ File replaced:", path);
      });

      socket.on("runCmd", (cmd) => {
        console.log("⚙️ Command executed:", cmd);
      });
      socket.on("done", () => {
        setProjectMade(true);
        console.log("✅ All steps completed:");
      });
      // const res = await axios.post("http://localhost:8080/api/getcode", {
      //   prompt,
      // });
      // console.log("res recieved");
      // if (res.data.status === "ok") {
      //   setProjectMade(true);
      // }
      // setSandboxId(res.data.sandboxId);

      // setTimeout(() => {
      //   const completeUrl = `https://${res.data.url}`;
      //   setUrl(completeUrl);
      // }, 3000);

      // setResponse(res.data.result);
    } catch (err: any) {
      console.log(err);
      // setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative h-screen flex flex-col  text-foreground">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, i) => (
          <div key={i} className="flex justify-end animate-fadeIn">
            <div className="max-w-[70%] bg-[#282825]  text-muted px-4 py-2 rounded-2xl rounded-br-sm shadow-sm">
              {message}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Input Area */}
      <div className="sticky bottom-0 bg-[#282825] text-white mx-2  border border-[#41413F] p-4 rounded-lg mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your prompt here..."
          className="flex-1 py-2 px-3 bg-transparent  placeholder-white/50 w-full text-white  focus:outline-none"
        />
      </div>
    </div>
  );
};

export default LeftSide;
