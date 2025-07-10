import React, { useState, useEffect } from "react";
import S3FileList from "./components/S3FileList";
import FileUpload from "./components/FileUpload";
import FileDelete from "./components/FileDelete";

const App: React.FC = () => {
  const [files, setFiles] = useState<any>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("configs/"); // Start at configs folder
  const [breadcrumb, setBreadcrumb] = useState<string[]>(["configs"]); // Initialize breadcrumb
  const [isListView, setIsListView] = useState<boolean>(true); // Toggle for view type

  const [currentFileKey, setCurrentFileKey] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const openDeleteModal = (fileKey: string) => {
    console.log("open modal");
    setCurrentFileKey(fileKey);
    setShowDeleteModal(true);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_ENDPOINT}/list-s3-objects?prefix=${currentFolder}`
        );
        const data = await response.json();

        // Directly set the response as files, assuming the API response includes both folders and files.
        setFiles(data);
        console.log(data);
      } catch (error) {
        console.error("Error fetching S3 objects:", error);
      }
    };

    fetchFiles();
  }, [currentFolder]);

  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder); // Change current folder
    const folderName = folder.split("/").slice(-2, -1)[0]; // Get only the last folder name
    setBreadcrumb((prev) => [...prev, folderName]); // Update breadcrumb
  };

  const handleGoBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1); // Remove last breadcrumb
      const parentFolder = `${currentFolder
        .split("/")
        .slice(0, -2)
        .join("/")}/`; // Get parent folder path
      setCurrentFolder(parentFolder); // Set the current folder to parent
      setBreadcrumb(newBreadcrumb); // Update the breadcrumb
    }
  };

  const toggleView = () => {
    setIsListView(!isListView); // Toggle view type
  };

  return (
    <div className="p-4">
      <h1 className="text-4xl text-center font-bold mb-4">S3 File Explorer</h1>

      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={handleGoBack}
          disabled={breadcrumb.length === 1} // Disable when at root
          className="p-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>

        <button onClick={toggleView} className="p-2 bg-gray-300 rounded">
          {isListView ? "Switch to Grid View" : "Switch to List View"}
        </button>
      </div>

      <div className="breadcrumb mb-4">
        {breadcrumb.map((folder, index) => (
          <span key={index}>
            <span
              onClick={() => {
                const newPath = breadcrumb.slice(0, index + 1).join("/") + "/";
                setCurrentFolder(newPath);
                setBreadcrumb(breadcrumb.slice(0, index + 1));
              }}
              className="cursor-pointer text-blue-600"
            >
              {folder}
            </span>
            {index < breadcrumb.length - 1 && " > "}
          </span>
        ))}
      </div>
      <FileUpload />

      {files.length === 0 ? null : (
        <S3FileList
          files={files.files.filter((file: any) => !file.Key.endsWith("/"))} // Render files only
          folders={files.folders.filter((file: any) =>
            file.Prefix.endsWith("/")
          )} // Render folders only
          onFolderChange={handleFolderChange}
          isListView={isListView}
          onDeleteFile={openDeleteModal}
        />
      )}

      {showDeleteModal && (
        <FileDelete
          fileKey={currentFileKey}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      <hr />
    </div>
  );
};

export default App;
