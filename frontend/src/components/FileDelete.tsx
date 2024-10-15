import React, { useState } from "react";

interface FileDeleteProps {
  fileKey: string;
  onClose: () => void;
}

const FileDelete: React.FC<FileDeleteProps> = ({ fileKey, onClose }) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/delete-s3-object/${fileKey}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete file");
      alert("File deleted successfully");
      onClose(); // Close the modal after deletion
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  return (
    <div>
      <p>
        Are you sure you want to delete the file: <strong>{fileKey}</strong>?
      </p>
      <button onClick={handleDelete}>Confirm Delete</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default FileDelete;
