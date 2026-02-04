import axios from "axios";
type ReloadProjectItem = {
  message: string;
  project: any;
  url: string;
  sandboxId: string;
};
type handleReloadProps = {
  setReload: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
  id: string;
  setReloadProject: React.Dispatch<
    React.SetStateAction<ReloadProjectItem | undefined>
  >;
};
export const handleReload = async ({
  setReload,
  id,
  userId,
  setReloadProject,
}: handleReloadProps) => {
  setReload(true);
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reload`,
    {
      projectId: id,
      userId,
    },
  );

  setReloadProject(res.data);
  console.log("project", res.data);
  console.log("messages", res.data.project.messages);
};
