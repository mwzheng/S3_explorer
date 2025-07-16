import React from "react";
import Swal from "sweetalert2";

interface FileDeleteProps {
  fileKey: string;
  onDeleteSuccess: () => void;
  children: React.ReactNode;
}

const FileDelete: React.FC<FileDeleteProps> = ({
  fileKey,
  onDeleteSuccess,
  children,
}) => {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${fileKey.split("/").at(-1)}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_ENDPOINT
        }/delete-s3-file/${encodeURIComponent(fileKey)}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Delete failed");

      await Swal.fire("Deleted!", "Your file has been deleted.", "success");
      onDeleteSuccess();
    } catch (err) {
      Swal.fire("Error", "Failed to delete file", "error");
    }
  };

  return <span onClick={handleDelete}>{children}</span>;
};

export default FileDelete;
