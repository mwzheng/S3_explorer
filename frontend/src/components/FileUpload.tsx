import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

interface FileUploadProps {
  currentPrefix: string;
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  currentPrefix,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files ? e.target.files[0] : null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.name.startsWith(".")) {
      Swal.fire("Error", "Uploading dotfiles is not allowed.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("prefix", currentPrefix);
    Swal.fire({
      title: "Uploading...",
      html: "Please do not close or leave this page.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/upload-s3-object`,
        {
          method: "POST",
          body: formData,
        }
      );
      console.log("File uploaded:", formData);
      if (!response.ok) throw new Error("Upload failed");
      Swal.fire("Success", "File uploaded successfully!", "success");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess();
    } catch (error) {
      Swal.fire("Upload Failed", `${error}`, "error");
    }
  };

  return (
    <form onSubmit={handleUpload} className="py-8">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} />
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
