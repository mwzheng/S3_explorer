import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Readable } from "stream";
import { GetObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to read and update permissions.json
export async function getPermissions(folderName) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `${folderName}/permissions.json`,
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

    const bodyContents = await streamToString(response.Body);
    return JSON.parse(bodyContents);
  } catch (error) {
    console.error("Error fetching permissions: ", error);
    throw error;
  }
}

// Helper function to update permissions.json
export async function updatePermissions(folderName, newPermissions) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `${folderName}/permissions.json`,
    Body: JSON.stringify(newPermissions),
  };

  const command = new PutObjectCommand(params);

  try {
    await client.send(command);
  } catch (error) {
    console.error("Error updating permissions:", error);
    throw error;
  }
}

export async function listS3Objects() {
  const input = {
    Bucket: process.env.BUCKET,
  };

  const command = new ListObjectsCommand(input);

  try {
    const response = await client.send(command);
    return response.Contents;
  } catch (error) {
    console.error("Error listing S3 objects: ", error);
    throw error;
  }
}

export async function uploadS3Object(file) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: file.originalname,
    Body: file.buffer,
  };

  const command = new PutObjectCommand(params);

  try {
    await client.send(command);
  } catch (error) {
    console.error("Error uploading file to S3: ", error);
    throw error;
  }
}

export async function deleteS3Object(objectKey) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: objectKey,
  };

  const command = new DeleteObjectCommand(params);

  try {
    await client.send(command);
  } catch (error) {
    console.error("Error deleting object from S3: ", error);
    throw error;
  }
}
