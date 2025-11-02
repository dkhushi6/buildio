"use client";
import React, { useEffect, useState } from "react";
// import FolderTree, { Item } from "../folder-tree/folder-tree";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import CodeEditor from "../code-editor";
import RightSideInitial from "./right-side-initial";
import { Button } from "../ui/button";
import FileTree, { FileNode } from "./getTree";

type RightSideProps = {
  url: string;
  sandboxId: string;

  projectMade: boolean;
};

const RightSide = ({ url, projectMade, sandboxId }: RightSideProps) => {
  const [tree, setTree] = useState<FileNode>();
  const [code, setCode] = useState("");
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");

  useEffect(() => {
    console.log("projectmade", projectMade);
    if (!sandboxId) return console.log("no id");
    if (projectMade) {
      const getFolderTree = async () => {
        try {
          const res = await axios.post("http://localhost:8080/api/tree", {
            sandboxId,
          });
          if (res?.data?.tree) setTree(res.data.tree);
        } catch (err) {
          console.log(err);
        }
      };
      getFolderTree();
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

  if (!tree && sandboxId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="animate-spin w-10 h-10 text-muted-foreground" />
      </div>
    );
  }

  if (!tree) return null;
  return (
    <div className="h-screen ">
      <div className="flex justify-start gap-3 p-3 border-b border-[#41413F] sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setViewMode("code")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === "code"
              ? "bg-[#393028] text-white dark:bg-[#ffe0c2] dark:text-black shadow-md scale-105"
              : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setViewMode("preview")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            viewMode === "preview"
              ? "bg-[#393028] text-white dark:bg-[#ffe0c2] dark:text-black shadow-md scale-105"
              : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Preview
        </button>
      </div>
      <div className="flex-1 flex ">
        {/* Toggle bar */}

        {/* Main view area */}
        <div className="flex-1 overflow-auto">
          {viewMode === "code" ? (
            <div className="flex">
              <div className="w-[30vh] bg-[#1C1C1C] overflow-auto  ">
                <FileTree treeData={tree} onFileClick={onFileClick} />
              </div>
              <div className="w-[60vh] pt-2">
                <CodeEditor code={code} language="javascript" />
              </div>{" "}
            </div>
          ) : url ? (
            <iframe
              src={url}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-screen border-none"
            />
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSide;
