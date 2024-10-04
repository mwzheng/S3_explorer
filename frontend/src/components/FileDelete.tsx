import React, { useState } from "react";

const FileDelete = () => {
  const [fileKey, setFileKey] = useState("");

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5555/delete-s3-object/${fileKey}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete file");
      alert("File deleted successfully");
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter file key to delete"
        value={fileKey}
        onChange={(e) => setFileKey(e.target.value)}
      />
      <button onClick={handleDelete}>Delete File</button>
    </div>
  );
};

export default FileDelete;
