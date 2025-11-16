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
import { newSystemPrompt } from "./new-prompt";
type LovableStateType = z.infer<typeof LovableState>;
export type ToolCallLC = {
  tool_call_id: string;
  name: string;
  args: Record<string, any>;
};

const ToolSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("createFile"),
    args: z.object({
      path: z.string(),
      content: z.string(),
    }),
  }),
  z.object({
    name: z.literal("replaceFile"),
    args: z.object({
      path: z.string(),
      content: z.string(),
    }),
  }),
  z.object({
    name: z.literal("runCommand"),
    args: z.object({
      command: z.string(),
    }),
  }),
]);

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

  const modelWithTools = model
    .bindTools(tools)
    .withConfig({ metadata: { enableThoughts: false } });

  // --- Nodes ---
  // --- hardened llmCall, toolNode, shouldContinue ---

  // async function llmCall(state: LovableStateType): Promise<LovableStateType> {
  //   const messages = state.messages.length
  //     ? state.messages
  //     : [new SystemMessage(newSystemPrompt), new HumanMessage(prompt)];

  //   try {
  //     const aiMsg = await modelWithTools.invoke(messages);
  //     console.log("LLM -> tool_calls:", (aiMsg as any).tool_calls);
  //     // ✅ Prevent content + tool_calls error
  //     if ((aiMsg as any).tool_calls?.length > 0) {
  //       // Only keep tool_calls, remove content
  //       (aiMsg as any).content = [];
  //     }
  //     return {
  //       messages: [...state.messages, aiMsg],
  //       llmCalls: (state.llmCalls ?? 0) + 1,
  //     };
  //   } catch (err) {
  //     console.error("LLM invocation failed:", err);
  //     // push an error ToolMessage so the graph doesn't move incorrectly
  //     const errorMsg = new ToolMessage({
  //       content: JSON.stringify({ error: String(err) }),
  //       tool_call_id: `llm-error-${randomUUID()}`,
  //       name: "llmInvocationError",
  //     });
  //     return {
  //       messages: [...state.messages, errorMsg],
  //       llmCalls: (state.llmCalls ?? 0) + 1,
  //     };
  //   }
  // }
  async function llmCall(state: LovableStateType): Promise<LovableStateType> {
    const messages = state.messages.length
      ? state.messages
      : [new SystemMessage(newSystemPrompt), new HumanMessage(prompt)];

    try {
      const aiMsg: any = await modelWithTools.invoke(messages);

      // ✅ 1. Remove content if there are tool_calls
      if (aiMsg.tool_calls?.length > 0) {
        aiMsg.content = [];
      }

      // ✅ 2. Normalize tool_call_id
      (aiMsg.tool_calls ?? []).forEach((tc: any) => {
        tc.tool_call_id = tc.id ?? tc.tool_call_id ?? randomUUID();
      });

      return {
        messages: [...state.messages, aiMsg],
        llmCalls: (state.llmCalls ?? 0) + 1,
      };
    } catch (err) {
      console.error("LLM invocation failed:", err);
      const errorMsg = new ToolMessage({
        content: JSON.stringify({ error: String(err) }),
        tool_call_id: `llm-error-${randomUUID()}`,
        name: "llmInvocationError",
      });
      return {
        messages: [...state.messages, errorMsg],
        llmCalls: (state.llmCalls ?? 0) + 1,
      };
    }
  }

  async function toolNode(state: LovableStateType): Promise<LovableStateType> {
    const last = state.messages[state.messages.length - 1];
    if (!last || !isAIMessage(last)) return state;

    const toolCalls = (last as any).tool_calls ?? [];

    // pick FIRST unexecuted tool call (one-by-one)
    const nextCall: any = toolCalls.find((tc: any) => {
      const tcId = tc.id ?? tc.tool_call_id ?? tc.toolCallId;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === tcId
      );
    });

    if (!nextCall) return state; // nothing to do

    const tool = toolsByName[nextCall.name];
    if (!tool) {
      // push ToolMessage error so LLM sees a function response (and doesn't re-call)
      const missingToolMsg = new ToolMessage({
        content: JSON.stringify({
          error: `Tool not registered: ${nextCall.name}`,
        }),
        tool_call_id: nextCall.id ?? nextCall.tool_call_id ?? randomUUID(),
        name: nextCall.name,
      });
      return {
        messages: [...state.messages, missingToolMsg],
        llmCalls: state.llmCalls,
      };
    }

    // Execute exactly ONE tool and always return a ToolMessage
    try {
      const output = await tool.invoke(nextCall.args);
      const toolMsg = new ToolMessage({
        content: typeof output === "string" ? output : JSON.stringify(output),
        tool_call_id:
          nextCall.id ??
          nextCall.tool_call_id ??
          nextCall.toolCallId ??
          randomUUID(),
        name: nextCall.name,
      });

      return {
        messages: [...state.messages, toolMsg],
        llmCalls: state.llmCalls,
      };
    } catch (err) {
      console.error(`Tool ${nextCall.name} failed:`, err);
      const toolErrorMsg = new ToolMessage({
        content: JSON.stringify({ error: String(err) }),
        tool_call_id:
          nextCall.id ??
          nextCall.tool_call_id ??
          nextCall.toolCallId ??
          randomUUID(),
        name: nextCall.name,
      });
      return {
        messages: [...state.messages, toolErrorMsg],
        llmCalls: state.llmCalls,
      };
    }
  }

  async function shouldContinue(state: LovableStateType) {
    const last = state.messages[state.messages.length - 1];
    if (!last || !isAIMessage(last)) return END;

    // ✅ Check for unexecuted tool calls first
    const nextCall = (last.tool_calls ?? []).find((tc: any) => {
      const id = tc.id ?? tc.tool_call_id ?? tc.toolCallId;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === id
      );
    });

    if (nextCall) return "toolNode";

    // ✅ No tool calls left → end
    return END;
  }

  // --- Build StateGraph ---
  const agent = new StateGraph({
    state: LovableState,
  })
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, [
      "toolNode",
      "llmCall",
      END,
    ])
    .addEdge("toolNode", "llmCall") // loop if tool calls generate more LLM calls
    .compile();

  // --- Initial state ---
  const initialState: LovableStateType = { messages: [], llmCalls: 0 };

  // --- Invoke graph ---
  const result = await agent.invoke(initialState);

  console.log(result);
  return result;
}
