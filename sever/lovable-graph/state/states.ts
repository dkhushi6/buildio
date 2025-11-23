import z from "zod";
import { type BaseMessage } from "@langchain/core/messages";

const stepSchema = z.object({
  id: z.string(),
  description: z.string().min(5, "Step description too short"),
  tool: z.enum(["createFile", "replaceFile", "runCommand"]),
  args: z.object(),
});
export const llmOutputState = z.object({
  projectName: z.string(),
  steps: z.array(stepSchema),
  messages: z.array(z.custom<BaseMessage>()),
  llmCalls: z.number().optional(),
  status: z.enum(["pending", "complete"]).default("pending"),
});
export const plan_statusState = z
  .enum(["idle", "planning", "executing", "completed", "failed"])
  .default("idle");

export type llmOutputStateType = z.infer<typeof llmOutputState>;
// export type projectNameState = z.infer<typeof projectName>;

// export type SingleStep = z.infer<typeof stepSchema>;
// export type projectStepsState = z.infer<typeof steps>;
