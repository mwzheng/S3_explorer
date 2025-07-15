import React, { useState } from "react";

interface FileDeleteProps {
  fileKey: string;
  onClose: () => void;
}

const FileDelete: React.FC<FileDeleteProps> = ({ fileKey, onClose }) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_ENDPOINT
        }/delete-s3-file/${encodeURIComponent(fileKey)}`,
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded shadow-lg z-60"
        onClick={(e) => e.stopPropagation()} // Prevent click-through to close
      >
        <h2 className="text-xl font-semibold mb-4">Confirm File Deletion</h2>
        <p className="mb-4">
          Are you sure you want to delete the file: <strong>{fileKey}</strong>?
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDelete;
