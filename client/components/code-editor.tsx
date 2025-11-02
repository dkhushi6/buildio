import { Editor } from "@monaco-editor/react";
import React from "react";

type CodeEditorProps = {
  code: string;
  language: string;
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, language }) => {
  return (
    <div>
      <Editor
        height="100vh"
        width="100vh"
        language={language}
        value={code}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default CodeEditor;
