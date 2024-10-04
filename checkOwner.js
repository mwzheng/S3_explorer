import { getPermissions } from "./s3_backend.js";

export const checkOwner = async (req, res, next) => {
  const { folderName, username } = req.body;

  try {
    const permissions = await getPermissions(folderName);

    // Check if the current user is the owner of the folder
    if (permissions.owner === username) {
      next();
    } else {
      res.status(403).send("Only the owner can share this folder.");
    }
  } catch (error) {
    console.error("Error in owner check:", error);
    res.status(500).send("Error checking ownership: " + error);
  }
};
