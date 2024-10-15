// FolderShare.tsx
import React from "react";

interface FolderShareProps {
  folderName: string;
  onShare: (
    userName: string,
    permissions: { read: boolean; write: boolean }
  ) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
}

const FolderShare: React.FC<FolderShareProps> = ({
  folderName,
  onShare,
  onClose,
  position,
}) => {
  const [sharedWith, setSharedWith] = React.useState<string>("");
  const [permissionType, setPermissionType] = React.useState<string>("read");

  const handleShare = async (event: React.FormEvent) => {
    event.preventDefault();
    const permissions = {
      read: permissionType === "read",
      write: permissionType === "write",
    };
    await onShare(sharedWith, permissions);
  };

  return (
    <form
      onSubmit={handleShare}
      className="border p-2 bg-gray-100 shadow-lg rounded-md absolute"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)", // Adjusts the position to appear next to the button
      }}
    >
      <h3 className="font-bold mb-2">Share {folderName}</h3>
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default FolderShare;
