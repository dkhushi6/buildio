"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import LeftSide from "./left-side";
import RightSide from "./right-side";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import RightSideInitial from "./right-side-initial";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

export function ResizableBar() {
  const [projectMade, setProjectMade] = useState(false);

  const [url, setUrl] = useState("");
  const [sandboxId, setSandboxId] = useState("");

  return (
    <ResizablePanelGroup direction="horizontal" className="  ">
      <ResizablePanel defaultSize={33} minSize={20} maxSize={50}>
        <LeftSide
          socket={socket}
          setProjectMade={setProjectMade}
          setUrl={setUrl}
          setSandboxId={setSandboxId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={67}>
        {projectMade ? (
          <RightSide
            sandboxId={sandboxId}
            projectMade={projectMade}
            url={url}
          />
        ) : (
          <RightSideInitial />
        )}{" "}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
