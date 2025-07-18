import express from "express";
import multer from "multer";
import {
  listS3Objects,
  uploadS3Object,
  uploadS3Folder,
  deleteS3File,
  deleteS3Folder,
  getPermissions,
  downloadS3Object,
} from "./s3_backend.js";
import { checkOwner } from "./checkOwner.js";
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
  const { prefix } = req.query;

  try {
    const data = await listS3Objects(prefix);

    res.json(data);
  } catch (err) {
    console.error("Error fetching bucket objects:", err);
    res.status(500).send("Error fetching bucket objects: " + err);
  }
});

app.get("/list-folder-details", async (req, res) => {
  let { folderName } = req.query;
  folderName = decodeURIComponent(folderName); // Explicitly decode the query param

  console.log("Decoded folder name:", folderName);

  try {
    const permissions = await getPermissions(folderName); // Fetch permissions
    res.json({
      owner: permissions.owner,
      sharedWith: permissions.sharedWith,
    });
  } catch (error) {
    console.error("Error fetching folder details:", error);
    res.status(500).send("Error fetching folder details: " + error);
  }
});

// Endpoint to upload a file to S3
app.post("/upload-s3-object", upload.single("file"), async (req, res) => {
  try {
    const prefix = req.body.prefix || "";
    const fileName = req.file?.originalname || req.body.folderName;

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
    const { prefix, folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: "Missing folder name." });
    }

    await uploadS3Folder("", prefix, folderName);
    res.status(200).json({ message: `Folder '${folderName}' created.` });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Error creating folder" });
  }
});

// Endpoint to delete a file from S3
app.delete("/delete-s3-file/*", async (req, res) => {
  const key = decodeURIComponent(req.params[0]);
  console.log(key);

  try {
    if (key.endsWith("/")) {
      // Folder
      await deleteS3Folder(key);
      return res.json({ message: "Folder and its contents deleted." });
    } else {
      // Single file
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

// Sharing the folder (Owner-only)
app.post("/share-folder", checkOwner, async (req, res) => {
  const { folderName, sharedWith, permissionType } = req.body; // permissionType can be 'read' or 'write'

  console.log(
    `> Folder Name: ${folderName}, Shared With: ${sharedWith}, Permission Type: ${permissionType}`
  );

  try {
    const permissions = await getPermissions(folderName);

    // Update the permissions JSON file with new user permission
    permissions.sharedWith[sharedWith] = permissionType;

    await updatePermissions(folderName, permissions);
    res.send("Folder shared successfully.");
  } catch (error) {
    console.error("Error sharing folder:", error);
    res.status(500).send("Error sharing folder: " + error);
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
