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

  async function llmCall(state: LovableStateType): Promise<LovableStateType> {
    let messages = [...state.messages];

    if (messages.length === 0) {
      console.log("first llm call");
      messages = [new SystemMessage(newSystemPrompt), new HumanMessage(prompt)];
    }
    console.log("the messages array in llm is ", messages);
    try {
      const aiMsg: any = await modelWithTools.invoke(messages);

      (aiMsg.tool_calls ?? []).forEach((tc: any) => {
        tc.tool_call_id = tc.id ?? tc.tool_call_id ?? randomUUID();
      });

      return {
        messages: [...messages, aiMsg],
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
        messages: [errorMsg],
        llmCalls: (state.llmCalls ?? 0) + 1,
      };
    }
  }

  async function toolNode(state: LovableStateType): Promise<LovableStateType> {
    // Get the last AI message with tool calls
    const last = state.messages[state.messages.length - 1];
    console.log("messages array from toolNode");
    console.log("last from toolNode");
    if (!last || !isAIMessage(last)) return state;

    const toolCalls = last.tool_calls ?? [];

    // Find the first unexecuted tool call
    const nextCall = toolCalls.find((tc) => {
      const id = tc.id;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === id
      );
    });

    if (!nextCall) return state;

    const tool = toolsByName[nextCall.name];
    const callId = nextCall.id ?? randomUUID();

    if (!tool) {
      // Return ToolMessage for unknown tool
      return {
        messages: [
          ...state.messages,
          new ToolMessage({
            content: JSON.stringify({
              error: `Tool not registered: ${nextCall.name}`,
            }),
            tool_call_id: callId,
            name: nextCall.name,
          }),
        ],
        llmCalls: state.llmCalls,
      };
    }

    try {
      const output = await tool.invoke(nextCall.args);

      //  Only return the single tool message for this turn
      const toolMsg = new ToolMessage({
        content: typeof output === "string" ? output : JSON.stringify(output),
        tool_call_id: callId,
        name: nextCall.name,
      });

      return {
        messages: [...state.messages, toolMsg], // ONLY this tool's output
        llmCalls: state.llmCalls,
      };
    } catch (err) {
      const errorMsg = new ToolMessage({
        content: JSON.stringify({ error: String(err) }),
        tool_call_id: callId,
        name: nextCall.name,
      });

      return {
        messages: [errorMsg],
        llmCalls: state.llmCalls,
      };
    }
  }

  async function shouldContinue(state: LovableStateType) {
    // Find last AI message in the chain
    const lastAI = [...state.messages].reverse().find((m) => isAIMessage(m));
    if (!lastAI) return END;

    const nextCall = (lastAI.tool_calls ?? []).find((tc) => {
      const id = tc.id;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === id
      );
    });

    if (nextCall) return "toolNode";
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
  const result = await agent.invoke(initialState, { recursionLimit: 50 });

  console.log(result);
  return result;
}
