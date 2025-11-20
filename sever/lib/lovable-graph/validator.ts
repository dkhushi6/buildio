export async function validateLLMOutput(aiMsg: any) {
  const errors: string[] = [];

  // ---------------------------------------------------------
  // 0. Basic sanity check
  // ---------------------------------------------------------
  if (!aiMsg || typeof aiMsg !== "object") {
    return { ok: false, errors: ["LLM output is not an object."] };
  }

  // ---------------------------------------------------------
  // 1. Tool-call validation (my additions)
  // ---------------------------------------------------------
  const rawCalls = aiMsg.tool_calls || [];
  const allowedTools = ["createFile", "replaceFile", "runCommand"];

  const cleanedCalls: any[] = [];

  for (const tc of rawCalls) {
    // --- must be an object ---
    if (!tc || typeof tc !== "object") {
      errors.push("Invalid tool_call: not an object.");
      continue;
    }

    // --- valid name ---
    if (!tc.name || typeof tc.name !== "string") {
      errors.push("Tool call missing valid 'name'.");
      continue;
    }

    // --- name must be allowed ---
    if (!allowedTools.includes(tc.name)) {
      errors.push(`Unknown tool: ${tc.name}`);
      continue;
    }

    // --- validate & parse args ---
    let argsObj = {};
    try {
      argsObj =
        typeof tc.args === "string" ? JSON.parse(tc.args) : tc.args || {};
    } catch {
      errors.push(`Invalid JSON in args for tool: ${tc.name}`);
      continue;
    }

    // --- normalize id ---
    const id =
      tc.id ||
      tc.tool_call_id ||
      tc.toolCallId ||
      `tool-${Math.random().toString(36).slice(2)}`;

    cleanedCalls.push({
      name: tc.name,
      tool_call_id: id,
      args: argsObj,
    });
  }

  // Attach cleaned version back
  aiMsg.tool_calls = cleanedCalls;

  // ---------------------------------------------------------
  // 2. Your original rule set (type, reason, code, tool)
  // ---------------------------------------------------------

  const output = aiMsg.output ?? aiMsg; // support both formats

  // Required type
  if (!output.type) {
    errors.push("Missing `type` field.");
  }

  // Required reason

  // Allowed types
  //   const allowedTypes = ["code", "tool", "message"];
  //   if (output.type && !allowedTypes.includes(output.type)) {
  //     errors.push("Invalid `type`. Allowed: code, tool, message");
  //   }

  // --------------------------
  // Type = "code" validations
  // --------------------------
  //   if (output.type === "code") {
  //     if (!output.code) {
  //       errors.push("Missing `code` when type = code.");
  //     } else {
  //       const code = output.code.trim();

  //       if (code.length < 5) {
  //         errors.push("Code block is too short.");
  //       }

  //       if (
  //         code.includes("```") ||
  //         code.includes("<script>") ||
  //         code.includes("eval(")
  //       ) {
  //         errors.push("Code contains unsafe or invalid patterns.");
  //       }

  //       // bracket balance check
  //       const open = (code.match(/{/g) || []).length;
  //       const close = (code.match(/}/g) || []).length;
  //       if (open !== close) {
  //         errors.push("Unbalanced curly braces in generated code.");
  //       }
  //     }
  //   }

  // --------------------------
  // Type = "tool" validations
  // --------------------------
  //   if (output.type === "tool") {
  //     if (!output.tool) {
  //       errors.push("Missing `tool` field when type = tool.");
  //     } else {
  //       if (!output.tool.name || !output.tool.args) {
  //         errors.push("Tool must include { name, args }.");
  //       }
  //     }
  //   }

  // ---------------------------------------------------------
  // FINAL RESULT
  // ---------------------------------------------------------
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}
