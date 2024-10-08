import React, { useState, useEffect } from "react";
import { FaFolder, FaFile, FaTrash, FaShareAlt } from "react-icons/fa";
import FolderShare from "./FolderShare";

interface S3FileListProps {
  files: any[]; // The array of files from S3
}

const S3FileList: React.FC<S3FileListProps> = (props) => {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFileForSharing, setSelectedFileForSharing] = useState<
    string | null
  >(null);

  useEffect(() => {
    setFiles(props.files);
  }, [props.files]);

  const openFolder = (file: any) => {
    console.log("> Attempting to open folder:", file);

    if (file.Key.endsWith("/")) {
      fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/list-s3-objects?prefix=${file.Key}`
      )
        .then((response) => response.json())
        .then((data) => setFiles(data))
        .catch((error) =>
          console.error("Error fetching folder details:", error)
        );
    }
  };

  const deleteFile = (file: any) => {
    fetch(
      `${process.env.REACT_APP_API_ENDPOINT}/delete-s3-object/${file.Key}`,
      {
        method: "DELETE",
      }
    ).then(() => setFiles(files.filter((f) => f.Key !== file.Key)));
  };

  const handleShareClick = (fileKey: string) => {
    setSelectedFileForSharing(fileKey);
  };

  const handleCloseShare = () => {
    setSelectedFileForSharing(null);
  };

  if (props.files.length === 0) {
    return <>No Files in folder</>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file: any) => {
        return (
          <div
            key={file.Key}
            className="border p-4 rounded-lg bg-white text-center relative shadow-md"
          >
            {file.Key.endsWith("/") ? (
              <FaFolder
                size={40}
                className="mx-auto cursor-pointer text-blue-500"
                onClick={() => openFolder(file)}
              />
            ) : (
              <FaFile size={40} className="mx-auto text-gray-500" />
            )}
            <p className="mt-2">{file.name || file.Key}</p>
            <p className="mt-1">Date Modified: {file.LastModified}</p>
            <p className="text-sm">Owner: {file.owner || "Unknown"}</p>
            {/* Share Button */}
            <FaShareAlt
              size={20}
              className="absolute top-2 right-8 cursor-pointer text-green-500"
              onClick={() => handleShareClick(file.Key)}
            />
            {/* Delete Button */}
            <FaTrash
              size={20}
              className="absolute top-2 right-2 cursor-pointer text-red-500"
              onClick={() => deleteFile(file)}
            />

            {selectedFileForSharing === file.Key && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-100 p-4 shadow-md rounded-lg">
                <FolderShare folderName={file.Key} onClose={handleCloseShare} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default S3FileList;
