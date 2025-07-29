import React, { useState, useEffect } from "react";
import S3FileList from "./components/S3FileList";
import FileUpload from "./components/FileUpload";
import FolderCreate from "./components/FolderCreate";
import Swal from "sweetalert2";

const App: React.FC = () => {
  const [user, setUser] = useState<string>("ExampleUser");
  const [shortcutRoot, setShortcutRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<any>([]);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>(`${user}/`); // Start at configs folder
  const [breadcrumb, setBreadcrumb] = useState<string[]>([user]); // Initialize breadcrumb
  const [isListView, setIsListView] = useState<boolean>(true); // Toggle for view type
  const [shortcuts, setShortcuts] = useState<any[]>([]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/list-s3-objects?prefix=${currentFolder}&user=${user}`
      );

      if (!response.ok) {
        const errorText = await response.text(); // Parse error message safely
        throw new Error(`Failed to fetch: ${errorText}`);
      }

      const data = await response.json();
      setFiles(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching S3 objects:", error.message);
        Swal.fire("Error", error.message, "error");
        handleGoBack();
      } else {
        console.error("Unknown error:", error);
        Swal.fire("Error", "An unknown error occurred.", "error");
        handleGoBack();
      }
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentFolder]);

  const changeUser = async () => {
    const { value: userName } = await Swal.fire({
      title: "Change Username",
      input: "text",
      inputLabel: "New Username",
      inputPlaceholder: user,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "Username cannot be empty";
        return null;
      },
    });
    setUser(userName);
    fetchFiles();
  };

  const handleFolderChange = (folder: string, isShortcut = false) => {
    if (historyStack.length < 5) {
      setHistoryStack((prev) => [...prev, currentFolder]);
    } else {
      setHistoryStack((prev) => [...prev.slice(1), currentFolder]);
    }

    if (isShortcut) {
      setShortcutRoot(folder);
      const displayName = folder.split("/").filter(Boolean).pop()!;
      setBreadcrumb([displayName]); // Only show the shared folder name
    } else {
      if (shortcutRoot && folder.startsWith(shortcutRoot)) {
        // navigating deeper into shortcut
        const relPath = folder
          .replace(shortcutRoot, "")
          .split("/")
          .filter(Boolean);
        const sharedRootName = shortcutRoot.split("/").filter(Boolean).pop()!;
        setBreadcrumb([sharedRootName, ...relPath]);
      } else {
        // normal folder navigation
        setShortcutRoot(null);
        setBreadcrumb(folder.split("/").filter(Boolean));
      }
    }
    setCurrentFolder(folder); // Change current folder

    setBreadcrumb(folder.split("/").filter(Boolean));
  };

  const handleGoBack = () => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev;

      const newHistory = [...prev];
      const lastFolder = newHistory.pop();

      if (lastFolder) {
        setCurrentFolder(lastFolder);
        if (shortcutRoot && lastFolder.startsWith(shortcutRoot)) {
          const rel = lastFolder
            .replace(shortcutRoot, "")
            .split("/")
            .filter(Boolean);
          const rootName = shortcutRoot.split("/").filter(Boolean).pop()!;
          setBreadcrumb([rootName, ...rel]);
        } else {
          // Exited the shortcut
          setShortcutRoot(null);
          setBreadcrumb(lastFolder.split("/").filter(Boolean));
        }
      }
      return newHistory;
    });
  };

  const toggleView = () => {
    setIsListView(!isListView); // Toggle view type
  };

  return (
    <div className="p-4">
      <h1 className="text-4xl text-center font-bold mb-4">S3 File Explorer</h1>

      <div className="mb-4 flex justify-between items-center">
        <div className="mb-4 flex justify-between items-left gap-2">
          <button
            onClick={handleGoBack}
            className="p-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
          >
            Go Back
          </button>

          <button
            onClick={fetchFiles}
            className="p-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
          >
            {" "}
            Refresh{" "}
          </button>
          <button
            onClick={changeUser}
            className="p-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
          >
            {" "}
            Current User: {user}{" "}
          </button>
        </div>
        <button onClick={toggleView} className="p-2 bg-gray-300 rounded">
          {isListView ? "Switch to Grid View" : "Switch to List View"}
        </button>
      </div>

      <div className="breadcrumb mb-4">
        {breadcrumb.map((folder, index) => {
          const pathUpTo = breadcrumb.slice(0, index + 1).join("/") + "/";

          return (
            <span key={index}>
              <span
                onClick={() => {
                  handleFolderChange(pathUpTo);
                }}
                className="cursor-pointer text-blue-600"
              >
                {folder}
              </span>
              {index < breadcrumb.length - 1 && " > "}
            </span>
          );
        })}
      </div>
      <div className="mb-4 flex justify-between items-center">
        <FileUpload
          currentPrefix={currentFolder}
          onUploadSuccess={fetchFiles}
          user={user}
        />
        <FolderCreate
          currentPrefix={currentFolder}
          onCreateSuccess={fetchFiles}
          user={user}
        />
      </div>
      {files.length === 0 ? null : (
        <S3FileList
          files={files.files.filter((file: any) => !file.Key.endsWith("/"))} // Render files only
          folders={files.folders.filter((file: any) =>
            file.Prefix.endsWith("/")
          )} // Render folders only
          onFolderChange={handleFolderChange}
          isListView={isListView}
          user={user}
          onDeleteSuccess={fetchFiles}
          currentPrefix={currentFolder}
        />
      )}
      <hr />
    </div>
  );
};

export default App;
