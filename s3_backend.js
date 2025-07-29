import {
  S3Client,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to read and update permissions
export async function getPermissions(
  folderName,
  userName,
  mode = "read",
  raw = false
) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `${folderName}/.permissions`,
  };

  const command = new GetObjectCommand(params);
  try {
    const response = await client.send(command);

    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf-8"))
        );
      });

    const content = await streamToString(response.Body);
    const permissions = JSON.parse(content);

    if (raw) {
      return permissions;
    }

    if (permissions?.["_meta"]?.["owner"] == userName) {
      return true;
    } else {
      return permissions?.[userName]?.[mode] === true;
    }
  } catch (error) {
    console.error("Error fetching permissions from S3:", error);
    throw error;
  }
}

// Helper function to update permissions
export async function updatePermissions(folderName, newPermissions) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `${folderName}.permissions`,
    Body: JSON.stringify(newPermissions),
  };

  const command = new PutObjectCommand(params);

  try {
    await client.send(command);
    console.log(
      `Updated permissions for folder "${folderName}":`,
      newPermissions
    );
  } catch (error) {
    console.error("Error updating permissions:", error);
    throw error;
  }
}

export async function listS3Objects(prefix = "") {
  const input = {
    Bucket: process.env.BUCKET,
    Prefix: prefix,
    Delimiter: "/", // This ensures we can get folder-like results
  };

  const command = new ListObjectsCommand(input);

  try {
    const response = await client.send(command);

    // The response will include CommonPrefixes for folders
    const contents = response.Contents || [];
    const prefixes = response.CommonPrefixes || [];

    // Combine files and folders for the response
    return {
      files: contents,
      folders: prefixes,
    };
  } catch (error) {
    console.error("Error listing S3 objects: ", error);
    throw error;
  }
}

export async function getShortcuts(folderName) {
  const key = `${folderName}/.shortcuts`;
  console.log("Getshortcuts: ", key);

  const params = {
    Bucket: process.env.BUCKET,
    Key: key,
  };

  const command = new GetObjectCommand(params);

  try {
    const response = await client.send(command);

    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf-8"))
        );
      });

    const content = await streamToString(response.Body);
    return JSON.parse(content);
  } catch (error) {
    if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
      return {}; // Return empty object if file doesn't exist
    }

    console.error("Error reading .shortcuts file:", error);
    return {}; // Also fallback to empty object on other read errors
  }
}

export async function uploadS3Object(file, prefix = "", fileName) {
  const key = `${prefix}${fileName}`;
  console.log("Uploading: ", file);

  const actualBody =
    typeof file === "string" || Buffer.isBuffer(file)
      ? file
      : file?.buffer || "";

  const params = {
    Bucket: process.env.BUCKET,
    Key: key,
    Body: actualBody,
    ContentType: "application/json", // optional: helpful for .shortcuts
  };

  const command = new PutObjectCommand(params);

  try {
    await client.send(command);
    return { message: `Upload successful: ${key}`, key };
  } catch (error) {
    console.error("Error uploading file to S3: ", error);
    throw error;
  }
}

export async function uploadS3Folder(
  userName = "ExampleUser",
  prefix = "",
  folderName
) {
  const key = `${prefix}${folderName}/.permissions`;

  const defaultPermissions = {};
  defaultPermissions["_meta"] = { owner: userName };

  const params = {
    Bucket: process.env.BUCKET,
    Key: key,
    Body: JSON.stringify(defaultPermissions),
  };

  const command = new PutObjectCommand(params);

  try {
    await client.send(command);
    return { message: `Upload successful: ${key}`, key };
  } catch (error) {
    console.error("Error uploading file to S3: ", error);
    throw error;
  }
}

export async function deleteS3File(fileKey) {
  const params = {
    Bucket: process.env.BUCKET,
    Delete: {
      Objects: [{ Key: fileKey }],
    },
  };

  const command = new DeleteObjectsCommand(params);
  try {
    await client.send(command);
  } catch (error) {
    console.error("Error deleting object from S3: ", error);
    throw error;
  }
}

export async function deleteS3Folder(folderKey) {
  const listParams = {
    Bucket: process.env.BUCKET,
    Prefix: folderKey,
  };

  try {
    const listedObjects = await client.send(
      new ListObjectsV2Command(listParams)
    );

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log("No contents found under prefix:", folderKey);
      throw new Error("Folder is empty or does not exist.");
    }

    const objectsToDelete = listedObjects.Contents.map((obj) => ({
      Key: obj.Key,
    }));

    const deleteParams = {
      Bucket: process.env.BUCKET,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    };

    const deleteResult = await client.send(
      new DeleteObjectsCommand(deleteParams)
    );
    console.log("Deleted objects:", deleteResult.Deleted);
    return deleteResult;
  } catch (error) {
    console.error("Error deleting folder from S3:", error);
    throw error;
  }
}

export async function downloadS3Object(objectKey) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: objectKey,
  };

  const command = new GetObjectCommand(params);
  console.log(command);

  try {
    const url = await getSignedUrl(client, command, { expiresIn: 60 }); // 60 seconds valid
    return url;
  } catch (error) {
    console.error("Error getting object url from S3: ", error);
    throw error;
  }
}
