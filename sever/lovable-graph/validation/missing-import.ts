// Import extraction function
export const extractImports = (content: string) => {
  const importRegex = /import\s+(?:[\w{}\s,*]+)\s+from\s+['"]([^'%22]+)['"]/g;
  const imports: string[] = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
};

// Package.json extraction function
export const extractPackageJson = (
  content: string
): Record<string, string> | null => {
  try {
    const json = JSON.parse(content);
    return json.dependencies ?? {};
  } catch (e) {
    return null;
  }
};
