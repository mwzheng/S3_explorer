import express from "express";
import multer from "multer";
import {
  listS3Objects,
  getShortcuts,
  uploadS3Object,
  uploadS3Folder,
  deleteS3File,
  deleteS3Folder,
  getPermissions,
  downloadS3Object,
  updatePermissions,
} from "./s3_backend.js";
import cors from "cors";
import e from "express";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
app.use(cors({ origin: "*" }));
// app.use(express.static("public"));
const port = 5555;
const upload = multer(); // For handling file uploads

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to list all objects from S3 bucket
app.get("/list-s3-objects", async (req, res) => {
  const { prefix, user } = req.query;

  try {
    const trimmedPrefix = prefix.replace(/\/$/, "");

    const isAuthorized = await getPermissions(trimmedPrefix, user, "read");
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Access denied: Read permission required." });
    }

    const data = await listS3Objects(prefix);
    let shortcuts = {};
    if (trimmedPrefix.endsWith("Shared Folders")) {
      shortcuts = await getShortcuts(trimmedPrefix);
    }

    res.json({
      ...data,
      shortcuts,
    });
  } catch (err) {
    console.error("Error fetching bucket objects:", err);
    res.status(500).send("Error fetching bucket objects: " + err);
  }
});

// Endpoint to upload a file to S3
app.post("/upload-s3-object", upload.single("file"), async (req, res) => {
  try {
    const prefix = req.body.prefix || "";
    const fileName = req.file?.originalname || req.body.folderName;
    const user = req.body.user || "";
    const isAuthorized = await getPermissions(
      prefix.replace(/\/$/, ""),
      user,
      "write"
    );
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Access denied: write permission required." });
    }

    if (!fileName) {
      return res.status(400).send("Missing file name.");
    }

    const data = await uploadS3Object(req.file, prefix, fileName);
    res.json(data);
  } catch (err) {
    console.error("Error uploading file:", err.stack || err);
    res.status(500).send("Error uploading file: " + err);
  }
});

app.post("/create-folder", express.json(), async (req, res) => {
  try {
    const { prefix, folderName, user } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: "Missing folder name." });
    }
    const isAuthorized = await getPermissions(
      prefix.replace(/\/$/, ""),
      user,
      "write"
    );
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Access denied: write permission required." });
    }

    await uploadS3Folder(user, prefix, folderName);
    res.status(200).json({ message: `Folder '${folderName}' created.` });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Error creating folder" });
  }
});

app.post("/share-folder", async (req, res) => {
  const { folderKey, user, targets } = req.body;
  console.log(targets);

  try {
    const currentPermissions = await getPermissions(
      folderKey.replace(/\/$/, ""),
      user,
      null,
      true
    );

    if (currentPermissions._meta?.owner !== user) {
      return res
        .status(403)
        .json({ error: "Only the owner may share this folder" });
    }
    let newPermissions = currentPermissions;
    for (const { username, permissions } of targets) {
      const sharedFolderKey = `${username}/Shared Folders/`;
      let userShortcuts = await getShortcuts(
        sharedFolderKey.replace(/\/$/, "")
      );

      if (userShortcuts == {}) {
        return res
          .status(400)
          .json({ error: `User ${username} does not exist.` });
      }
      userShortcuts[folderKey] = { path: folderKey, owner: user };
      await uploadS3Object(
        JSON.stringify(userShortcuts),
        sharedFolderKey,
        ".shortcuts"
      );
      newPermissions[username] = {
        read: !!permissions.read,
        write: !!permissions.write,
      };
    }
    const sharedFolderKey = `${user}/Shared Folders/`;
    let userShortcuts = await getShortcuts(sharedFolderKey.replace(/\/$/, ""));
    userShortcuts[folderKey] = { path: folderKey, owner: user };
    await uploadS3Object(
      JSON.stringify(userShortcuts),
      sharedFolderKey,
      ".shortcuts"
    );

    await updatePermissions(folderKey, newPermissions);
    res.json({ message: "Folder shared successfully" });
  } catch (err) {
    console.error("Share error:", err);
    return res.status(500).json({ error: "Failed to share folder" });
  }
});

// Endpoint to delete a file from S3
app.delete("/delete-s3-file", async (req, res) => {
  const { key, user } = req.body;
  const prefix = key.substring(0, key.lastIndexOf("/"));

  try {
    const isAuthorized = await getPermissions(
      prefix.replace(/\/$/, ""),
      user,
      "write"
    );
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Access denied: write permission required." });
    }

    if (key.endsWith("/")) {
      // Folder
      console.log("\nFolder Found\n");
      await deleteS3Folder(key);
      return res.json({ message: "Folder and its contents deleted." });
    } else {
      // Single file
      console.log("\nFile Found\n");
      await deleteS3File(key);
      return res.json({ message: "File deleted." });
    }
  } catch (error) {
    console.error("Error deleting S3 object:", error);
    res.status(500).json({
      error: "Error deleting S3 object",
      details: error.message,
    });
  }
});

app.get("/generate-download-url", async (req, res) => {
  const key = req.query.key;
  console.log(key);

  if (!key) {
    return res.status(400).json({ error: "Missing 'key' parameter" });
  }

  try {
    const url = await downloadS3Object(key);

    return res.json({ url });
  } catch (err) {
    console.error("Failed to generate download URL:", err);
    return res.status(500).json({ error: "Failed to generate URL" });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
