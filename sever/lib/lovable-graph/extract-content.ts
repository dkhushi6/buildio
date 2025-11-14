import { BaseMessage, isAIMessage } from "@langchain/core/messages";
export function extractRawContent(msg: BaseMessage): string {
  // Handle AI messages safely
  if (!isAIMessage(msg)) return "";

  const content = msg.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    // Join array elements into string
    return content.join("\n");
  }

  // fallback to finishMessage.content if present
  const finishMessage = msg.additional_kwargs?.finishMessage as
    | { content?: string }
    | string
    | undefined;

  if (typeof finishMessage === "string") {
    return finishMessage;
  }

  if (typeof finishMessage?.content === "string") {
    return finishMessage.content;
  }

  // Default fallback
  return "";
}
