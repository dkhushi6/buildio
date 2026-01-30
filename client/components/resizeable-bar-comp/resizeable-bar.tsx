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
type ReloadProjectItem = {
  message: string;
  project: any;
  url: string;
};
type ResizableProps = {
  projectId: string;
  reload: boolean;
  reloadProject: ReloadProjectItem | undefined;
};
export function ResizableBar({
  projectId,
  reload,
  reloadProject,
}: ResizableProps) {
  const [projectMade, setProjectMade] = useState(false);

  const [url, setUrl] = useState("");
  const [sandboxId, setSandboxId] = useState("");
  useEffect(() => {
    if (reload && reloadProject) {
      console.log("the reload project is ", reloadProject);
      setUrl(`https://${reloadProject?.url}`);
    }
  }, [reload, reloadProject]);
  return (
    <ResizablePanelGroup direction="horizontal" className="  ">
      <ResizablePanel defaultSize={33} minSize={20} maxSize={50}>
        <LeftSide
          projectId={projectId}
          setProjectMade={setProjectMade}
          setUrl={setUrl}
          setSandboxId={setSandboxId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={67}>
        {url ? (
          <RightSide
            sandboxId={sandboxId}
            projectMade={projectMade}
            url={url}
          />
        ) : (
          <RightSideInitial />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
