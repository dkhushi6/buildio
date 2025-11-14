import * as z from "zod";
import { tool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, START, END } from "@langchain/langgraph";
import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
  isAIMessage,
  ToolMessage,
} from "@langchain/core/messages";

// --- 1. Define tools ---
export const squareTool = tool(
  ({ number }: { number: number }) => number * number,
  {
    name: "square",
    description: "Returns the square of a number",
    schema: z.object({ number: z.number() }),
  }
);

export const cubeTool = tool(({ number }: { number: number }) => number ** 3, {
  name: "cube",
  description: "Returns the cube of a number",
  schema: z.object({ number: z.number() }),
});

export const sqrtTool = tool(
  ({ number }: { number: number }) => Math.sqrt(number),
  {
    name: "square_root",
    description: "Returns the square root of a number",
    schema: z.object({ number: z.number().nonnegative() }),
  }
);

// --- 2. Tools map ---
export const toolsByName: Record<string, any> = {
  square: squareTool,
  cube: cubeTool,
  square_root: sqrtTool,
};

export const tools = Object.values(toolsByName);

// --- 3. State schema ---
export const MathState = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  llmCalls: z.number().optional(),
});

export type MathStateType = z.infer<typeof MathState>;

// --- 4. Main function ---
export async function runMathGraph(
  model: ChatGoogleGenerativeAI,
  prompt: string
): Promise<MathStateType> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Prompt cannot be empty");
  }

  const modelWithTools = model.bindTools(tools);

  // --- LLM node ---
  async function llmCall(state: MathStateType): Promise<MathStateType> {
    // Include system message + history + human prompt (first time)
    const messages: BaseMessage[] = [
      new SystemMessage(
        "You are a helpful assistant tasked with performing arithmetic operations using the available tools."
      ),
      ...(state.messages.length > 0
        ? state.messages
        : [new HumanMessage(prompt)]),
    ];

    // invoke the model
    const response = await modelWithTools.invoke(messages);

    // Ensure messages array
    const newMessages: BaseMessage[] = Array.isArray(response)
      ? response
      : [response];

    return {
      messages: newMessages,
      llmCalls: (state.llmCalls ?? 0) + 1,
    };
  }

  // --- Tool execution node ---
  async function toolNode(state: MathStateType): Promise<MathStateType> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || !isAIMessage(lastMessage)) return { messages: [] };

    const results: ToolMessage[] = [];

    for (const toolCall of lastMessage.tool_calls ?? []) {
      const tool = toolsByName[toolCall.name];
      if (!tool) continue;

      const observation = await tool.invoke(toolCall);
      results.push(observation);
    }

    return { messages: results };
  }

  // --- Build the graph ---
  const mathGraph = new StateGraph(MathState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    .addEdge(START, "llmCall")
    .addEdge("llmCall", "toolNode")
    // .addEdge("toolNode", "llmCall") // optional loop
    .compile();

  // --- Invoke the graph with initial state ---
  const res = await mathGraph.invoke({
    messages: [], // empty at first, llmCall will add HumanMessage
    llmCalls: 0,
  });

  return res;
}
