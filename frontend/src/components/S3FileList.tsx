import React, { useState } from "react";
import {
  FaFolder,
  FaFile,
  FaTrash,
  FaShareAlt,
  FaDownload,
} from "react-icons/fa";
import FolderShare from "./FolderShare"; // Adjust the import as necessary
import FileDelete from "./FileDelete"; // Import the FileDelete component
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

enum SortOption {
  ALPHABETICAL = "Alphabetical",
  DATE_MODIFIED = "Date Modified",
  DATE_CREATED = "Date Created",
}

// Define types for your props
interface File {
  Key: string;
  LastModified: string;
  Size: number;
}

interface Folder {
  Prefix: string;
}

interface S3FileListProps {
  files: File[];
  folders: Folder[];
  onFolderChange: (folderKey: string) => void;
  isListView: boolean;
  onDeleteSuccess: () => void;
}

const S3FileList: React.FC<S3FileListProps> = ({
  files,
  folders,
  onFolderChange,
  isListView,
  onDeleteSuccess,
}) => {
  const [sharingFolder, setSharingFolder] = useState<string>("");
  const [showShareForm, setShowShareForm] = useState<boolean>(false);
  const [sharePosition, setSharePosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [currentFileKey, setCurrentFileKey] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>(
    SortOption.ALPHABETICAL
  );
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query state

  const handleDownload = async (fileKey: string) => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_ENDPOINT
        }/generate-download-url?key=${encodeURIComponent(fileKey)}`
      );

      if (!response.ok) throw new Error("Failed to get download URL");

      const { url } = await response.json();
      window.open(url, "_blank"); // or use a programmatic download
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed.");
    }
  };

  const handleShareClick = (folder: string, event: React.MouseEvent) => {
    setSharingFolder(folder);
    setShowShareForm(true);
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setSharePosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left,
    });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value as SortOption);
  };

  // Sorting logic based on the selected option
  const sortFilesAndFolders = () => {
    let sortedFolders = [...folders];
    let sortedFiles = [...files];
    switch (sortOption) {
      case SortOption.ALPHABETICAL:
        sortedFolders.sort((a, b) => a.Prefix.localeCompare(b.Prefix));
        sortedFiles.sort((a, b) => a.Key.localeCompare(b.Key));
        break;
      case SortOption.DATE_MODIFIED:
        sortedFiles.sort(
          (a, b) =>
            new Date(b.LastModified).getTime() -
            new Date(a.LastModified).getTime()
        );
        break;
      case SortOption.DATE_CREATED:
        // Assuming there's a 'DateCreated' field, adjust accordingly if you're using a different field.
        sortedFiles.sort(
          (a, b) =>
            new Date(b.LastModified).getTime() -
            new Date(a.LastModified).getTime()
        );
        break;
      default:
        break;
    }

    // Apply search filtering
    if (searchQuery.trim()) {
      sortedFolders = sortedFolders.filter((folder) =>
        folder.Prefix.toLowerCase().includes(searchQuery.toLowerCase())
      );
      sortedFiles = sortedFiles.filter((file) =>
        file.Key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return { sortedFolders, sortedFiles };
  };

  const { sortedFolders, sortedFiles } = sortFilesAndFolders();
  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Sort Button */}
      <div className="flex justify-end mb-4">
        <select
          value={sortOption}
          onChange={handleSortChange}
          className="border p-2 rounded"
        >
          <option value={SortOption.ALPHABETICAL}>Alphabetical</option>
          <option value={SortOption.DATE_MODIFIED}>Date Modified</option>
          <option value={SortOption.DATE_CREATED}>Date Created</option>
        </select>
      </div>

      {isListView ? (
        <div className="overflow-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Last Modified</th>
                <th className="border px-4 py-2">Size</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFolders
                .filter((folder) =>
                  folder.Prefix.toLowerCase().includes(
                    searchQuery.toLowerCase()
                  )
                )
                .map((folder) => (
                  <tr key={folder.Prefix}>
                    <td className="border px-4 py-2 text-center">
                      <FaFolder
                        size={20}
                        className="text-blue-500 inline-block"
                      />
                    </td>

                    <td
                      className="border px-4 py-2 cursor-pointer"
                      onClick={() => onFolderChange(folder.Prefix)}
                    >
                      {folder.Prefix.split("/").slice(-2, -1)[0]}
                    </td>
                    <td className="border px-4 py-2">{"-"}</td>
                    <td className="border px-4 py-2">-</td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center space-x-4">
                        <FaShareAlt
                          size={20}
                          className="cursor-pointer text-green-500"
                          onClick={(e) => handleShareClick(folder.Prefix, e)}
                        />
                        <FileDelete
                          fileKey={folder.Prefix}
                          onDeleteSuccess={onDeleteSuccess}
                        >
                          <FaTrash
                            size={20}
                            className="cursor-pointer text-red-500"
                          />
                        </FileDelete>
                      </div>
                    </td>
                  </tr>
                ))}
              {sortedFiles
                .filter(
                  (file) =>
                    !file.Key.split("/").pop()?.startsWith(".") &&
                    file.Key.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((file) => (
                  <tr key={file.Key}>
                    <td className=" border px-4 py-2.5 text-center flex justify-center items-center">
                      <FaFile size={20} className="text-gray-500" />
                    </td>
                    <td className="border px-4 py-2">
                      {file.Key.split("/").slice(-1)[0]}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(file.LastModified).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2">{file.Size} bytes</td>
                    <td className="border px-4 py-2">
                      <div className="flex items-center space-x-4">
                        <FaShareAlt
                          size={20}
                          className="cursor-pointer text-green-500"
                          onClick={(e) => handleShareClick(file.Key, e)}
                        />
                        <FileDelete
                          fileKey={file.Key}
                          onDeleteSuccess={onDeleteSuccess}
                        >
                          <FaTrash
                            size={20}
                            className="cursor-pointer text-red-500"
                          />
                        </FileDelete>
                        <FaDownload
                          size={20}
                          className="cursor-pointer text-blue-500"
                          onClick={() => handleDownload(file.Key)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sortedFolders
            .filter(
              (folder) =>
                !folder.Prefix.split("/")
                  .filter(Boolean)
                  .pop()
                  ?.startsWith(".") &&
                folder.Prefix.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((folder) => (
              <div key={folder.Prefix} className="border p-2 relative">
                <FaFolder size={40} className="text-blue-500" />
                <p>{folder.Prefix.split("/").slice(-2, -1)[0]}</p>
                <p>-</p>
                <div className="absolute top-0 right-0 flex space-x-2 py-5 mr-3">
                  <FaShareAlt
                    size={20}
                    className="text-green-500 cursor-pointer"
                    onClick={(e) => handleShareClick(folder.Prefix, e)}
                  />
                  <FileDelete
                    fileKey={folder.Prefix}
                    onDeleteSuccess={onDeleteSuccess}
                  >
                    <FaTrash
                      size={20}
                      className="cursor-pointer text-red-500"
                    />
                  </FileDelete>
                </div>
              </div>
            ))}
          {sortedFiles
            .filter((file) =>
              file.Key.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((file) => (
              <div key={file.Key} className="border p-2 relative">
                <FaFile size={40} className="text-gray-500" />
                <p>{file.Key.split("/").slice(-1)[0]}</p>
                <p>{new Date(file.LastModified).toLocaleString()}</p>
                <p>{file.Size} bytes</p>
                <div className="absolute top-0 right-0 flex space-x-2 py-5 mr-3">
                  <FaShareAlt
                    size={20}
                    className="text-green-500 cursor-pointer"
                    onClick={(e) => handleShareClick(file.Key, e)}
                  />
                  <FileDelete
                    fileKey={file.Key}
                    onDeleteSuccess={onDeleteSuccess}
                  >
                    <FaTrash
                      size={20}
                      className="cursor-pointer text-red-500"
                    />
                  </FileDelete>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default S3FileList;
