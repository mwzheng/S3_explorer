import {
  S3Client,
  ListObjectsCommand,
  ObjectOwnership,
} from "@aws-sdk/client-s3";

import dotenv from "dotenv";
dotenv.config();

// Configure your AWS client
const client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to list S3 bucket objects
export async function listS3Objects() {
  const input = {
    Bucket: process.env.BUCKET, // Specify your bucket name
    MaxKeys: 1000, // Limit the number of objects fetched
    Prefix: process.env.ROOT_DIR,
  };

  const command = new ListObjectsCommand(input);
  ObjectOwnership();
  try {
    const response = await client.send(command); // Send the request to list objects
    return response.Contents; // Return the list of objects in the bucket
  } catch (error) {
    console.error("Error listing S3 objects: ", error);
    throw error;
  }
}
