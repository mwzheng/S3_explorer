import React, { useState } from "react";

interface FolderShareProps {
  folderName: string; // Dynamically passed from the clicked folder or file
  onClose: () => void; // Close function for the share form
}

const FolderShare: React.FC<FolderShareProps> = ({ folderName, onClose }) => {
  const [sharedWith, setSharedWith] = useState("");
  const [permissionType, setPermissionType] = useState("read");

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      folderName,
      sharedWith,
      permissionType,
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/share-folder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      console.log("Folder shared:", response);
      onClose(); // Close the form after sharing
    } catch (error) {
      console.error("Error sharing folder:", error);
    }
  };

  return (
    <form
      onSubmit={handleShare}
      className="border p-2"
    >
      <h3 className="font-bold">Share {folderName}</h3>
      <input
        type="text"
        placeholder="User to share with"
        value={sharedWith}
        onChange={(e) => setSharedWith(e.target.value)}
        className="border p-2 mt-2 w-full"
      />
      <select
        value={permissionType}
        onChange={(e) => setPermissionType(e.target.value)}
        className="border p-2 mt-2 w-full"
      >
        <option value="read">Read</option>
        <option value="write">Write</option>
      </select>
      <div className="mt-4 flex justify-between">
        <button
          type="submit"
          className="bg-blue-500 text-white"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-red-500 text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default FolderShare;
