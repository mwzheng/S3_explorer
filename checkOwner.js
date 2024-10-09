import { getPermissions } from "./s3_backend.js";

export const checkOwner = async (req, res, next) => {
  const { folderName, username } = req.body;

  try {
    const permissions = await getPermissions(folderName);

    if (!permissions) {
      return res.status(404).send("Permissions not found for this folder.");
    }

    // Check if the permissions.json contains the 'owner' field
    if (!permissions.owner) {
      return res
        .status(400)
        .send("Owner field is missing in the permissions file.");
    }

    // Check if the current user is the owner of the folder
    if (permissions.owner === username) {
      next(); // Proceed to the next middleware or route
    } else {
      res.status(403).send("Only the owner can share this folder.");
    }
  } catch (error) {
    console.error("Error in owner check:", error);
    res.status(500).send("Error checking ownership: " + error.message);
  }
};
