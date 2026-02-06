"use client";

import React, { useMemo } from "react";
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiReactjsLine,
} from "@remixicon/react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/ui/tree";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  fileExtension?: string;
  children?: FileNode[];
}

interface FileTreeProps {
  treeData: FileNode; // Root node from API
  onFileClick?: (filePath: string) => void;
}

// Helper to map folder tree into headless-tree format
function flattenTree(root: FileNode): Record<string, FileNode> {
  const map: Record<string, FileNode> = {};

  function traverse(node: FileNode) {
    map[node.path] = node;
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return map;
}

// Helper to get file icons
function getFileIcon(extension: string | undefined, className: string) {
  switch (extension) {
    case "tsx":
    case "jsx":
      return <RiReactjsLine className={className} />;
    case "ts":
    case "js":
    case "mjs":
      return <RiCodeSSlashLine className={className} />;
    case "json":
      return <RiBracesLine className={className} />;
    case "svg":
    case "ico":
    case "png":
    case "jpg":
      return <RiImageLine className={className} />;
    case "md":
      return <RiFileTextLine className={className} />;
    default:
      return <RiFileLine className={className} />;
  }
}

const indent = 20;

export default function FileTree({ treeData, onFileClick }: FileTreeProps) {
  const items = useMemo(() => flattenTree(treeData), [treeData]);
  console.log("the tree from backend is", treeData);
  const tree = useTree<FileNode>({
    initialState: {
      expandedItems: [treeData.path],
      selectedItems: [],
    },
    indent,
    rootItemId: treeData.path,
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: (item) => item.getItemData()?.type === "folder",
    canReorder: false,
    onDrop: createOnDropHandler(() => {}),
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) =>
        items[itemId]?.children?.map((c) => c.path) ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <div>
        <Tree className="relative bg-[#1C1C1C]" indent={indent} tree={tree}>
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => {
            return (
              <TreeItem key={item.getId()} item={item} className="pb-0!">
                <TreeItemLabel
                  className="rounded-none py-1"
                  onClick={() => {
                    console.log("Label clicked:", item.getItemData().name);

                    const node = item.getItemData();

                    if (
                      (!node.children || node.children.length === 0) &&
                      onFileClick
                    ) {
                      onFileClick(node.path);
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    {item.getItemData()?.type === "file" &&
                      getFileIcon(
                        item
                          .getItemData()
                          ?.name.split(".")
                          .pop()
                          ?.toLowerCase(),
                        "text-muted-foreground pointer-events-none size-4",
                      )}
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            );
          })}
        </Tree>
      </div>
    </div>
  );
}
