import React from "react";
import Swal from "sweetalert2";

interface FileDeleteProps {
  fileKey: string;
  onDeleteSuccess: () => void;
  user: string;
  children: React.ReactNode;
}

const FileDelete: React.FC<FileDeleteProps> = ({
  fileKey,
  onDeleteSuccess,
  user,
  children,
}) => {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const objectName = fileKey.split("/").at(-1) || fileKey.split("/").at(-2);

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${objectName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/delete-s3-file`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: fileKey, user }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        Swal.fire("Delete Failed", `${error.error}`, "error");
      } else {
        await Swal.fire("Deleted!", "Your file has been deleted.", "success");
        onDeleteSuccess();
      }
    } catch (err) {
      Swal.fire("Error", `Failed to delete file: ${err}`, "error");
    }
  };

  return <span onClick={handleDelete}>{children}</span>;
};

export default FileDelete;
