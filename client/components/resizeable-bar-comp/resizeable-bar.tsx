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
  sandboxId: string;
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
      setSandboxId(reloadProject?.sandboxId);
    }
  }, [reload, reloadProject]);
  if (reload && !reloadProject) {
    return (
      <div className="text-4xl flex justify-center items-center">
        Reloading project wait ...
      </div>
    );
  }
  return (
    <ResizablePanelGroup direction="horizontal" className="  ">
      <ResizablePanel defaultSize={33} minSize={20} maxSize={50}>
        <LeftSide
          projectId={projectId}
          setProjectMade={setProjectMade}
          setUrl={setUrl}
          setSandboxId={setSandboxId}
          reload={reload}
          reloadProject={reloadProject}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={67}>
        {url ? (
          <RightSide
            reload={reload}
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
