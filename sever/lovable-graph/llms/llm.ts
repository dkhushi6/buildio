import Sandbox from "@e2b/code-interpreter";
import { model } from "./model";
import { createFile, replaceFile, runCommand } from "../../lib/tools";
export const namellm = model.withConfig({
  metadata: { enableThoughts: false },
});

export const plannerllm = model.withConfig({
  metadata: { enableThoughts: false },
});
export const getCodeAgent = async (sandbox: Sandbox, socket: any) => {
  const cf = createFile(sandbox, socket);
  const rf = replaceFile(sandbox, socket);
  const rc = runCommand(sandbox, socket);

  const toolsByName: Record<string, any> = {
    createFile: cf,
    replaceFile: rf,
    runCommand: rc,
  };
  const tools = Object.values(toolsByName);

  const codellm = model
    .bindTools(tools)
    .withConfig({ metadata: { enableThoughts: false } });
  return { codellm, toolsByName };
};
