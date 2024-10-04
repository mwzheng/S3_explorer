import React, { useState, useEffect } from "react";
import S3FileList from "./components/S3FileList";
import FileUpload from "./components/FileUpload";
import FileDelete from "./components/FileDelete";

const App: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    // Fetch the list of files from the backend (S3)
    fetch("http://localhost:5555/list-s3-objects")
      .then((response) => response.json())
      .then((data) => setFiles(data))
      .catch((error) => console.error("Error fetching files:", error));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-4xl text-center font-bold mb-4">S3 File Explorer</h1>
      <FileUpload />
      <S3FileList files={files} />

      <FileDelete />
      <hr />
    </div>
  );
};

export default App;
