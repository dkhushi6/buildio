import axios from "axios";

type DeployProjectProps = {
  sandboxId: string;
  projectId: string;
};

export const deployProject = async ({
  sandboxId,
  projectId,
}: DeployProjectProps) => {
  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/deploy`, {
    sandboxId,
    projectId,
  });

  return res.data as {
    message: string;
    deployUrl: string;
    files: number;
    needsStaticWebsiteUrl?: boolean;
  };
};
