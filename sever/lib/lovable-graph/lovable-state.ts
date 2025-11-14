import z from "zod";
import { type BaseMessage } from "@langchain/core/messages";

export const LovableState = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  llmCalls: z.number().optional(),
});
