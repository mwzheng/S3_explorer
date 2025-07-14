import React, { useState } from "react";
interface FileUploadProps {
  currentPrefix: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ currentPrefix }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files ? e.target.files[0] : null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.name.startsWith(".")) {
      alert("Uploading dotfiles is not allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("prefix", currentPrefix);
    console.log("file path:", currentPrefix);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/upload-s3-object`,
        {
          method: "POST",
          body: formData,
        }
      );
      console.log("File uploaded:", formData);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <form onSubmit={handleUpload} className="py-8">
      <input type="file" onChange={handleFileChange} />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload File
      </button>
    </form>
  );
};

export default FileUpload;
