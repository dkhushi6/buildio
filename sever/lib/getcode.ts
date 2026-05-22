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
import { logPreview, shortLog } from "./logger";
type GetCodePropsTypes = {
  prompt: string;
  projectId: string;
  userId: string;
  sandboxId?: string | null;
  socket: Socket;
};

export const getcode = async ({
  prompt,
  projectId,
  userId,
  sandboxId: existingSandboxId,
  socket,
}: GetCodePropsTypes) => {
  const oldProject = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  const isContinuation = Boolean(existingSandboxId || oldProject);
  const sandbox = existingSandboxId
    ? await Sandbox.connect(existingSandboxId)
    : await Sandbox.create("base-app", { timeoutMs: 600000 });
  console.log("sandbox id is", sandbox.sandboxId);
  const { sandboxId } = sandbox;
  logPreview("prompt:", prompt, 300);
  console.log("projectid", projectId);
  console.log("userid", userId);
  console.log("is continuation", isContinuation);

  socket.emit("sandboxId", sandboxId);
  const host = sandbox.getHost(5173);
  const url = host;
  socket.emit("url", url);
  console.log("base app made");
  const userPrompt = isContinuation
    ? [
        "Continue editing the existing app in the current sandbox.",
        "Do not create a brand-new app unless the user explicitly asks for a rewrite.",
        oldProject?.prompt ? `Original project request: ${oldProject.prompt}` : "",
        `New user request: ${prompt}`,
      ]
        .filter(Boolean)
        .join("\n")
    : prompt;
  const codellm = await getCodeAgent(sandbox, socket);
  const codeAgent = codellm.codellm;
  const { toolsByName } = codellm;
  // prd node — runs first, generates a rich project brief
  const prdNode = async (state: llmOutputStateType) => {
    socket.emit("prd-start");
    const msgs = [new SystemMessage(prdPrompt), new HumanMessage(userPrompt)];
    const brief = await plannerllm.invoke(msgs);
    const prd = String(brief.content);
    logPreview("prd brief:", prd, 500);
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
      ? `Project Brief:\n${state.prd}\n\nPrompt:\n${userPrompt}`
      : userPrompt;
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
    logPreview("planner output:", res.content, 500);
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
      const taskPrompt = isContinuation
        ? [
            "You are modifying an existing Vite/React app already present in /home/user.",
            "Inspect and edit the current files as needed. Preserve working parts of the existing app.",
            "Apply this continuation plan:",
            stepsString,
          ].join("\n\n")
        : stepsString;
      messages = [
        new SystemMessage(codePrompt),
        new HumanMessage(taskPrompt),
      ];
    }

    try {
      console.log("inside try block of code");
      const aiMsg: any = await codeAgent.invoke(messages);

      (aiMsg.tool_calls ?? []).forEach((tc: any) => {
        tc.tool_call_id = tc.id ?? tc.tool_call_id ?? randomUUID();
      });

      console.log("aiMsg:", {
        contentType: aiMsg.content?.[0]?.type ?? typeof aiMsg.content,
        toolCalls: aiMsg.tool_calls?.length ?? 0,
        contentPreview: shortLog(aiMsg.content, 300),
      });
      return {
        messages: [...messages, aiMsg],
        llmCalls: (state.llmCalls ?? 0) + 1,
      };
    } catch (err) {
      console.error("LLM invocation failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      socket.emit("generation-error", errorMessage);
      return {
        messages,
        llmCalls: (state.llmCalls ?? 0) + 1,
        status: "failed",
      };
    }
  };
  // tool call node
  const toolNode = async (state: llmOutputStateType) => {
    // Get the last AI message with tool calls
    const last = state.messages[state.messages.length - 1];
    console.log("toolNode messages:", {
      total: state.messages.length,
      lastType: last?._getType?.() ?? typeof last,
    });
    if (!last || !isAIMessage(last)) return state;

    const toolCalls = last.tool_calls ?? [];

    // Gemini expects every tool call in an AI turn to receive a tool response
    // before the next LLM invocation.
    const pendingCalls = toolCalls.filter((tc) => {
      const id = tc.id;
      return !state.messages.some(
        (m) => m instanceof ToolMessage && m.tool_call_id === id,
      );
    });

    if (pendingCalls.length === 0) return state;

    const toolMessages: ToolMessage[] = [];

    for (const nextCall of pendingCalls) {
      const tool = toolsByName[nextCall.name];
      const callId = nextCall.id ?? randomUUID();

      if (!tool) {
        toolMessages.push(
          new ToolMessage({
            content: JSON.stringify({
              error: `Tool not registered: ${nextCall.name}`,
            }),
            tool_call_id: callId,
            name: nextCall.name,
          }),
        );
        continue;
      }

      try {
        const output = await tool.invoke(nextCall.args);

        toolMessages.push(
          new ToolMessage({
            content:
              typeof output === "string" ? output : JSON.stringify(output),
            tool_call_id: callId,
            name: nextCall.name,
          }),
        );
      } catch (err) {
        toolMessages.push(
          new ToolMessage({
            content: JSON.stringify({ error: String(err) }),
            tool_call_id: callId,
            name: nextCall.name,
          }),
        );
      }
    }

    return {
      messages: [...state.messages, ...toolMessages],
      llmCalls: state.llmCalls,
    };
  };

  async function shouldContinue(state: llmOutputStateType) {
    if (state.status === "failed") return END;

    if ((state.llmCalls ?? 0) >= 25) {
      socket.emit("generation-error", "Generation stopped after too many LLM calls.");
      return END;
    }

    const lastAI = [...state.messages].reverse().find((m) => isAIMessage(m));

    if (!lastAI) return END;

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

  let result: llmOutputStateType;
  try {
    result = await projectGraph.invoke(initialState, {
      recursionLimit: 50,
    });
  } catch (err) {
    console.error("Project graph failed:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    socket.emit("generation-error", errorMessage);
    return;
  }

  if (result.status === "failed") {
    console.log("Project generation failed before completion.");
    return;
  }

  const messagesToSave = result.messages.map((m) => m.toJSON());

  const cleanedMessages = JSON.parse(JSON.stringify(messagesToSave));
  if (oldProject) {
    await prisma.project.update({
      where: { id: projectId, userId },
      data: {
        name: result.projectName || oldProject.name,
        prompt: `${oldProject.prompt}\n\n${prompt}`,
        messages: cleanedMessages as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.project.create({
      data: {
        id: projectId,
        userId,
        name: result.projectName,
        prompt: prompt,

        messages: cleanedMessages as Prisma.InputJsonValue,
      },
    });
  }

  socket.emit("done");

  try {
    await SaveProjectsAzur(sandboxId, projectId, userId);
    socket.emit("azur-done");
  } catch (err) {
    console.error("Azure project save failed:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    socket.emit(
      "generation-error",
      `Project generated, but save failed: ${errorMessage}`,
    );
  }

  console.log("🔗 App is available at:", host);
};
