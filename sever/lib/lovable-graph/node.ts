import z from "zod";
import { LovableState } from "./lovable-state";
import { SystemMessage, ToolMessage } from "langchain";
import { isAIMessage } from "@langchain/core/messages";
import { sysprompt } from "../prompt";
export async function llmCall(
  state: z.infer<typeof LovableState>,
  modelWithTools: any
) {
  // state:{messages[],llmCalls}
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage(sysprompt),
      ...state.messages,
    ]),
    llmCalls: (state.llmCalls ?? 0) + 1,
  };
}
console.log("toolNodecall");
//tool node (when to call a tool)
export async function toolNode(
  state: z.infer<typeof LovableState>,
  toolsByName: Record<string, any>
) {
  const lastMessage = state.messages[state.messages.length - 1];
  console.log("lastms from toolnode", lastMessage);
  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    console.log("toolcall", toolCall);
    const tool = toolsByName[toolCall.name as string];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }
  return { messages: result };
}
