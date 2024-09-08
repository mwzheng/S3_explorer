import express from "express";
import { listS3Objects } from "./s3_backend.js";

const app = express();
const port = 5555;

app.get("/list-s3-objects", async (req, res) => {
  try {
    const data = await listS3Objects();
    res.json(data);
  } catch (err) {
    console.error("Error fetching bucket objects:", err);
    res.status(500).send("Error fetching bucket objects: " + err);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
