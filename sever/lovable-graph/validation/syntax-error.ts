import { ESLint } from "eslint";

export async function validateWithESLint(code: string) {
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2025,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ["@typescript-eslint"],
      env: {
        browser: true,
        node: true,
        es2025: true,
      },
      rules: {
        "no-unused-vars": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "no-undef": "error",
        semi: ["error", "always"],
        quotes: ["error", "double"],
        eqeqeq: ["warn", "always"],
        "no-console": "off",
        "@typescript-eslint/explicit-function-return-type": "warn",
      },
    },
  } as any); // Cast to any to bypass TS type issues

  const results = await eslint.lintText(code);
  const messages = results[0].messages;

  if (messages.length > 0) {
    return messages.map((m) => ({
      line: m.line,
      column: m.column,
      message: m.message,
      ruleId: m.ruleId,
      severity: m.severity, // 1 = warning, 2 = error
    }));
  }

  return null; // No issues
}
