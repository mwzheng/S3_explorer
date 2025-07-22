import React from "react";
import Swal from "sweetalert2";

interface FolderCreateProps {
  currentPrefix: string;
  onCreateSuccess: () => void;
  user: string;
}

const FolderCreate: React.FC<FolderCreateProps> = ({
  currentPrefix,
  onCreateSuccess,
  user,
}) => {
  const handleCreateFolder = async () => {
    const { value: folderName } = await Swal.fire({
      title: "Create New Folder",
      input: "text",
      inputLabel: "Folder name",
      inputPlaceholder: "Enter folder name",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "Folder name cannot be empty";
        if (value.startsWith(".")) return "Dotfolders are not allowed";
        if (value.includes("/")) return "Folder name cannot contain slashes";
        return null;
      },
    });
    if (!folderName) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/create-folder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix: currentPrefix,
            folderName,
            user,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        Swal.fire("Error", error.error, "error");
      } else {
        Swal.fire("success", "Folder created successfully", "success");
        onCreateSuccess(); // Refresh file list
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      Swal.fire("Error", "Failed to create folder", "error");
    }
  };

  return (
    <button
      onClick={handleCreateFolder}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
    >
      + New Folder
    </button>
  );
};

export default FolderCreate;
