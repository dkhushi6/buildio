import axios from "axios";
type onFileClickPropsTypes = {
  filePath: string;
  sandboxId: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
};
export const onFileClick = async ({
  filePath,
  sandboxId,
  setCode,
}: onFileClickPropsTypes) => {
  if (!sandboxId || !filePath) return console.log("Missing id or filepath");
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/getfile`,
      {
        sandboxId,
        filePath,
      },
    );
    console.log("code", res.data.file);
    setCode(res.data.file || "");
  } catch (err) {
    console.log(err);
  }
};
