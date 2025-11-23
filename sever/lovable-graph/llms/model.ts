import dotenv from "dotenv";
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-pro-preview",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
  maxOutputTokens: 30000,
});
