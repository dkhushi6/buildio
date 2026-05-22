export const shortLog = (value: unknown, maxLength = 500) => {
  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2) ?? String(value);

  return text.length > maxLength
    ? `${text.slice(0, maxLength)}... [truncated ${text.length - maxLength} chars]`
    : text;
};

export const logPreview = (label: string, value: unknown, maxLength = 500) => {
  console.log(label, shortLog(value, maxLength));
};
