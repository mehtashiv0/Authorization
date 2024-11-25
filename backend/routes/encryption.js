import express from "express";
import {
  setEncryptionKey,
  savePassword,
  viewPassword,
  updatePassword,
  deletePassword,
} from "../controller/encryption.controller.js"; // Import the new controller methods

const router = express.Router();

// Route for setting the encryption key
router.post("/setEncryptionKey", setEncryptionKey);

// Route for saving a password
router.post("/savePassword", savePassword);

// Route for viewing a saved password
router.post("/viewPassword", viewPassword);

// Route for update a saved password
router.post("/updatePassword", updatePassword);

// Route for delete a saved password
router.post("/deletePassword", deletePassword);

export default router;
