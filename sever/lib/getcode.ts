import Sandbox from "@e2b/code-interpreter";
import { getCodeAgent, namellm, plannerllm } from "../lovable-graph/llms/llm";
import {
  llmOutputState,
  llmOutputStateType,
} from "../lovable-graph/state/states";
import { HumanMessage, SystemMessage, ToolMessage } from "langchain";
import { namePrompt } from "../lovable-graph/prompts/name-prompt";
import { plannerPrompt } from "../lovable-graph/prompts/planner-prompt";
import { prdPrompt } from "../lovable-graph/prompts/prd-prompt";
import { randomUUID } from "crypto";
import { isAIMessage } from "@langchain/core/messages";
import { codePrompt } from "../lovable-graph/prompts/codePrompt";
import { StateGraph, START, END } from "@langchain/langgraph";
import { Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { Prisma } from "./generated/prisma";
import { SaveProjectsAzur } from "../lovable-graph/azure/save-project";
type GetCodePropsTypes = {
  prompt: string;
  projectId: string;
  userId: string;
  socket: Socket;
};

export const getcode = async ({
  prompt,
  projectId,
  userId,
  socket,
}: GetCodePropsTypes) => {
  const sandbox = await Sandbox.create("base-app", { timeoutMs: 600000 });
  console.log("sandbox id is", sandbox.sandboxId);
  const { sandboxId } = sandbox;
  console.log("promptis ", prompt);
  console.log("projectid", projectId);
  console.log("userid", userId);

  socket.emit("sandboxId", sandboxId);
  const host = sandbox.getHost(5173);
  const url = host;
  socket.emit("url", url);
  console.log("base app made");
  const codellm = await getCodeAgent(sandbox, socket);
  const codeAgent = codellm.codellm;
  const { toolsByName } = codellm;
  // prd node — runs first, generates a rich project brief
  const prdNode = async (state: llmOutputStateType) => {
    socket.emit("prd-start");
    const msgs = [new SystemMessage(prdPrompt), new HumanMessage(prompt)];
    const brief = await plannerllm.invoke(msgs);
    const prd = String(brief.content);
    console.log("prd brief:", prd);
    socket.emit("prd", prd);
    return { prd };
  };

  // name node — uses prd for richer naming context
  const nameNode = async (state: llmOutputStateType) => {
    socket.emit("name start");
    if (!prompt) {
      console.log("no prompt");
      return;
    }
    const context = state.prd
      ? `Project Brief:\n${state.prd}\n\nOriginal prompt:\n${prompt}`
      : prompt;
    const messages = [new SystemMessage(namePrompt), new HumanMessage(context)];
    const res = await namellm.invoke(messages);
    const name = res.content;
    console.log("project name is", name);
    socket.emit("project-name", name);
    return { projectName: name };
  };

  // planner node — uses prd + prompt so steps are fully informed by the brief
  const plannerNode = async (state: llmOutputStateType) => {
    socket.emit("planningStart");
    let steps = state.steps;

    const msgs = [
      new SystemMessage(plannerPrompt),
      new HumanMessage(state.prd),
    ];
    const res = await plannerllm.invoke(msgs);
    console.log(res.content);
    const aiSteps = res.content;
    socket.emit("stepsDone");
    return { steps: [...steps, aiSteps] };
  };

  //code-gen node

  const codeGenNode = async (state: llmOutputStateType) => {
    const steps = state.steps;

    if (!steps) {
      console.log("no steps");
      return;
    }
    const lastStep = steps[steps.length - 1];
    const stepsString = JSON.stringify(lastStep, null, 2);

    let messages = [...state.messages];

    if (messages.length === 0) {
      console.log("first llm call");
      messages = [
        new SystemMessage(codePrompt),
        new HumanMessage(stepsString),
      ];
    }

    try {
      console.log("inside try block of code");
      const aiMsg: any = await codeAgent.invoke(messages);

      (aiMsg.tool_calls ?? []).forEach((tc: any) => {
        tc.tool_call_id = tc.id ?? tc.tool_call_id ?? randomUUID();
      });

      console.log("aiMsg content", aiMsg.content[0].type);
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
  };
  // tool call node
  const toolNode = async (state: llmOutputStateType) => {
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
        (m) => m instanceof ToolMessage && m.tool_call_id === id,
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
      // await prisma.project.update({
      //   where: { id: projectId, userId },
      //   data: {
      //     messages: JSON.parse(
      //       JSON.stringify([
      //         ...state.messages.map((m) => m.toJSON()),
      //         toolMsg.toJSON ? toolMsg.toJSON() : toolMsg,
      //       ])
      //     ),
      //   },
      // });
      return {
        messages: [...state.messages, toolMsg],
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
  };

  async function shouldContinue(state: llmOutputStateType) {
    const lastAI = [...state.messages].reverse().find((m) => isAIMessage(m));

    if (!lastAI) return "codeGenNode";

    const nextCall = (lastAI.tool_calls ?? []).find((tc) => {
      const id = tc.id;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === id,
      );
    });

    if (nextCall) return "toolNode";
    state.status = "complete";
    return END;
  }

  const projectGraph = new StateGraph({ state: llmOutputState })
    .addNode("prdNode", prdNode)
    .addNode("nameNode", nameNode)
    .addNode("plannerNode", plannerNode)
    .addNode("codeGenNode", codeGenNode)
    .addNode("toolNode", toolNode)
    .addEdge(START, "prdNode")
    .addEdge("prdNode", "nameNode")
    .addEdge("nameNode", "plannerNode")
    .addEdge("plannerNode", "codeGenNode")
    .addConditionalEdges("codeGenNode", shouldContinue, [
      "toolNode",
      "codeGenNode",
      END,
    ])
    .addEdge("toolNode", "codeGenNode")
    .compile();

  console.log("🔗 Base App is available at:", host);
  const initialState: llmOutputStateType = {
    projectName: "",
    steps: [],
    messages: [],
    llmCalls: 0,
    status: "pending",
    prd: "",
  };

  const result = await projectGraph.invoke(initialState, {
    recursionLimit: 100,
  });
  const oldProject = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (oldProject) {
    console.log("project already exist");
    return;
  }
  const messagesToSave = result.messages.map((m) => m.toJSON());

  const cleanedMessages = JSON.parse(JSON.stringify(messagesToSave));
  await prisma.project.create({
    data: {
      id: projectId,
      userId,
      name: result.projectName,
      prompt: prompt,

      messages: cleanedMessages as Prisma.InputJsonValue,
    },
  });

  socket.emit("done");

  SaveProjectsAzur(sandboxId, projectId, userId);
  socket.emit("azur-done");

  console.log("🔗 App is available at:", host);
};
