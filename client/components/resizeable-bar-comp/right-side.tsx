"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Code, Eye, LoaderCircle, FileCode, Layers } from "lucide-react";
import CodeEditor from "../code-editor";
import RightSideInitial from "./right-side-initial";
import { Button } from "../ui/button";
import FileTree, { FileNode } from "./getTree";
import { getFolderTree } from "@/functions/getFolderTree";

type RightSideProps = {
  url: string;
  sandboxId: string;
  projectMade: boolean;
};

const RightSide = ({ url, projectMade, sandboxId }: RightSideProps) => {
  const [tree, setTree] = useState<FileNode | undefined>();
  const [code, setCode] = useState("");
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");

  useEffect(() => {
    console.log("projectmade", projectMade);
    if (!sandboxId) return console.log("no id");
    if (projectMade) {
      getFolderTree({ setTree, sandboxId });
    }
  }, [sandboxId, projectMade]);

  const onFileClick = async (filePath: string) => {
    if (!sandboxId || !filePath) return console.log("Missing id or filepath");
    try {
      const res = await axios.post("http://localhost:8080/api/getfile", {
        sandboxId,
        filePath,
      });
      console.log("code", res.data.file);
      setCode(res.data.file || "");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1C1C1C]">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#41413F]/50 bg-[#1B1917] sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#402F1D]/40 rounded-lg border border-[#523613]/30">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-200">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex gap-2 bg-[#0F0E0D] pz-1.5 rounded-xl border border-[#41413F]/50 shadow-inner">
          <button
            onClick={() => setViewMode("code")}
            className={`group flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              viewMode === "code"
                ? "bg-gradient-to-br from-[#523613] to-[#6B4A1F] text-amber-50 shadow-lg shadow-[#523613]/30 scale-105 border border-[#744E1E]"
                : "text-zinc-400 hover:text-amber-200 hover:bg-[#2A2826]"
            }`}
          >
            <Code
              className={`w-4 h-4 ${
                viewMode === "code" ? "animate-pulse" : ""
              }`}
            />
            <span>Code</span>
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`group flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              viewMode === "preview"
                ? "bg-gradient-to-br from-[#523613] to-[#6B4A1F] text-amber-50 shadow-lg shadow-[#523613]/30 scale-105 border border-[#744E1E]"
                : "text-zinc-400 hover:text-amber-200 hover:bg-[#2A2826]"
            }`}
          >
            <Eye
              className={`w-4 h-4 ${
                viewMode === "preview" ? "animate-pulse" : ""
              }`}
            />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === "code" ? (
          tree ? (
            <div className="flex h-full">
              <div className="w-80 bg-[#1C1C1C] border-r border-[#41413F]/50 overflow-auto">
                <div className="p-3">
                  <FileTree treeData={tree} onFileClick={onFileClick} />
                </div>
              </div>

              <div className="flex-1 bg-[#1C1C1C] overflow-auto">
                <div className="h-full p-4">
                  {code ? (
                    <div className="h-full  overflow-hidden  ">
                      <CodeEditor code={code} language="javascript" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <FileCode className="w-16 h-16 text-[#523613] animate-pulse" />
                      <p className="text-lg font-medium text-amber-200">
                        Select a file to view code
                      </p>
                      <p className="text-sm text-zinc-500">
                        Choose a file from the sidebar to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <LoaderCircle className="animate-spin w-12 h-12 text-amber-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-amber-200">
                  Loading project files...
                </p>
                <p className="text-sm text-zinc-500">
                  Setting up your workspace
                </p>
              </div>
            </div>
          )
        ) : url ? (
          <div className="h-full p-4 bg-[#1C1C1C]">
            <div className="h-full  shadow-xl">
              <iframe
                src={url}
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
            <Eye className="w-16 h-16 text-[#523613] animate-pulse" />
            <p className="text-lg font-medium text-amber-200">
              No preview available
            </p>
            <p className="text-sm text-zinc-600">
              Preview will appear once your project is ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSide;
