"use client";
import React from "react";
import { FileText } from "lucide-react";

const RightSideInitial = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
      <FileText size={48} className="mb-4 opacity-70" />
      <h2 className="text-lg font-medium text-muted-foreground mb-1">
        No projects yet
      </h2>
      <p className="text-sm text-muted-foreground">
        Start by typing a prompt on the left side to create your first project.
      </p>
    </div>
  );
};

export default RightSideInitial;
