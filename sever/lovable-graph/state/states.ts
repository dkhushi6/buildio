import z from "zod";
import { type BaseMessage } from "@langchain/core/messages";

export const llmOutputState = z.object({
  projectName: z.string(),
  steps: z.array(z.unknown()),
  messages: z.array(z.custom<BaseMessage>()),
  llmCalls: z.number().optional(),
  prd: z.string(),
  status: z.enum(["pending", "complete", "failed"]).default("pending"),
});
export const plan_statusState = z
  .enum(["idle", "planning", "executing", "completed", "failed"])
  .default("idle");

export type llmOutputStateType = z.infer<typeof llmOutputState>;
