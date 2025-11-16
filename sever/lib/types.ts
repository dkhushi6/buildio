import z from "zod";
import { LovableState } from "./lovable-graph/lovable-state";
export type LovableStateType = z.infer<typeof LovableState>;
export type ToolCallLC = {
  tool_call_id: string;
  name: string;
  args: Record<string, any>;
};
