import { FileNode } from "@/components/resizeable-bar-comp/getTree";
import axios from "axios";
type getFolderTreePropsTypes = {
  setTree: React.Dispatch<React.SetStateAction<FileNode | undefined>>;
  sandboxId: string;
};
export const getFolderTree = async ({
  setTree,
  sandboxId,
}: getFolderTreePropsTypes) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tree`,
      {
        sandboxId,
      },
    );
    if (res?.data?.tree) setTree(res.data.tree);
  } catch (err) {
    console.log(err);
  }
};
