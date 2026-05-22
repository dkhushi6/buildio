"use client";
import React, { useEffect, useState } from "react";
import {
  Code,
  Eye,
  LoaderCircle,
  FileCode,
  Layers,
  Rocket,
  ExternalLink,
} from "lucide-react";
import CodeEditor from "../code-editor";
import FileTree, { FileNode } from "./getTree";
import { getFolderTree } from "@/functions/getFolderTree";
import { onFileClick } from "@/functions/onFileClick";
import { deployProject } from "@/functions/deployProject";

type RightSideProps = {
  url: string;
  sandboxId: string;
  projectId: string;
  projectMade: boolean;
  reload: boolean;
};

const RightSide = ({
  url,
  projectMade,
  sandboxId,
  projectId,
  reload,
}: RightSideProps) => {
  const [tree, setTree] = useState<FileNode | undefined>();
  const [code, setCode] = useState("");
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview");
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [deployError, setDeployError] = useState("");

  useEffect(() => {
    console.log("projectmade", projectMade);
    if (!sandboxId) return console.log("no id");
    if (projectMade || reload) {
      getFolderTree({ setTree, sandboxId });
    }
  }, [sandboxId, projectMade]);

  const handleDeploy = async () => {
    if (!sandboxId || !projectId || deploying) return;

    setDeploying(true);
    setDeployError("");
    try {
      const deployedProject = await deployProject({ sandboxId, projectId });
      setDeployUrl(deployedProject.deployUrl);
    } catch (err: any) {
      setDeployError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Deploy failed",
      );
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1C1C1C]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#41413F]/50 bg-[#1B1917] sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#402F1D]/40 rounded-lg border border-[#523613]/30">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-200">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-200 bg-emerald-950/40 border border-emerald-700/40 rounded-lg hover:bg-emerald-900/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Live</span>
            </a>
          )}
          <button
            onClick={handleDeploy}
            disabled={!sandboxId || deploying}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[#1B1917] bg-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={deployError || "Deploy static site"}
          >
            {deploying ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            <span>{deploying ? "Deploying" : "Deploy"}</span>
          </button>
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
      </div>
      {deployError && (
        <div className="px-6 py-2 text-sm text-red-200 bg-red-950/50 border-b border-red-800/50">
          {deployError}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {viewMode === "code" ? (
          tree ? (
            <div className="flex h-full">
              <div className="w-80 bg-[#1C1C1C] border-r border-[#41413F]/50 overflow-auto">
                <div className="p-3">
                  <FileTree
                    treeData={tree}
                    onFileClick={(filePath: string) =>
                      onFileClick({
                        filePath,
                        sandboxId,
                        setCode,
                      })
                    }
                  />
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
