import { StateGraph, START, END } from "@langchain/langgraph";
import {
  SystemMessage,
  HumanMessage,
  ToolMessage,
  isAIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import z from "zod";
import { createFile, replaceFile, runCommand } from "./tools";
import Sandbox from "@e2b/code-interpreter";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { LovableState } from "./lovable-graph/lovable-state";
import { randomUUID } from "crypto";
import { systemPrompt } from "./systemPrompt";

type LovableStateType = z.infer<typeof LovableState>;
export type ToolCallLC = {
  tool_call_id: string;
  name: string;
  args: Record<string, any>;
};

export async function buildAgent(
  prompt: string,
  sandbox: Sandbox,
  socket: any,
  model: BaseChatModel
) {
  // --- Setup tools ---
  const cf = createFile(sandbox, socket);
  const rf = replaceFile(sandbox, socket);
  const rc = runCommand(sandbox, socket);

  const toolsByName: Record<string, any> = {
    createFile: cf,
    replaceFile: rf,
    runCommand: rc,
  };
  const tools = Object.values(toolsByName);

  const modelWithTools = model.bindTools(tools);

  // --- Nodes ---
  async function llmCall(state: LovableStateType): Promise<LovableStateType> {
    const messages = state.messages.length
      ? state.messages
      : [new SystemMessage(systemPrompt), new HumanMessage(prompt)];

    const response = await modelWithTools.invoke(messages, {
      tool_choice: "auto",
    });
    const newMessages: BaseMessage[] = Array.isArray(response)
      ? response
      : [response];

    // Parse tool calls from AIMessage content if present
    for (const msg of newMessages) {
      let rawContentStr = "";

      if (isAIMessage(msg)) {
        if (typeof msg.content === "string") {
          rawContentStr = msg.content;
        } else if (Array.isArray(msg.content)) {
          rawContentStr = msg.content.join("\n");
        } else if (
          msg.additional_kwargs?.finishMessage &&
          typeof (msg.additional_kwargs.finishMessage as any).content ===
            "string"
        ) {
          rawContentStr = any.content;
        }

        if (rawContentStr.includes("tool_calls")) {
          try {
            const parsed = JSON.parse(
              rawContentStr
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim()
            );
            if (parsed.tool_calls) {
              msg.tool_calls = parsed.tool_calls.map((t: any) => ({
                name: t.name,
                args: t.args,
                tool_call_id: t.tool_call_id || randomUUID(),
              }));
            }
          } catch (e) {
            console.warn("Failed to parse tool_calls", e);
          }
        }
      }
    }

    return {
      messages: [...state.messages, response],
      llmCalls: (state.llmCalls ?? 0) + 1,
    };
  }

  async function toolNode(state: LovableStateType): Promise<LovableStateType> {
    const last = state.messages[state.messages.length - 1];
    if (!last || !isAIMessage(last)) return state;

    const toolCalls = (last as any).tool_calls ?? [];
    const resultMessages: ToolMessage[] = [];

    for (const call of toolCalls) {
      const tool = toolsByName[call.name];
      if (!tool) continue;

      const output = await tool.invoke(call.args);

      resultMessages.push(
        new ToolMessage({
          content: JSON.stringify(output),
          tool_call_id: call.tool_call_id, // <-- FIX
          name: call.name,
        })
      );
    }

    return {
      messages: [...state.messages, ...resultMessages],
      llmCalls: state.llmCalls,
    };
  }

  // --- End condition ---
  async function shouldContinue(state: LovableStateType) {
    // Check for any AIMessage with tool_calls that haven't been executed
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const msg = state.messages[i];
      if (isAIMessage(msg) && msg.tool_calls && msg.tool_calls.length > 0) {
        // Make sure these tool_calls are not already executed
        const executed = state.messages.some(
          (m) =>
            m instanceof ToolMessage &&
            msg.tool_calls?.some(
              (tc: any) => tc.tool_call_id === m.tool_call_id
            )
        );
        if (!executed) return "toolNode";
      }
    }
    return END;
  }

  // --- Build StateGraph ---
  const agent = new StateGraph(LovableState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
    .addEdge("toolNode", "llmCall") // loop if tool calls generate more LLM calls
    .compile();

  // --- Initial state ---
  const initialState: LovableStateType = { messages: [], llmCalls: 0 };

  // --- Invoke graph ---
  const result = await agent.invoke(initialState);

  console.log(result);
  return result;
}
