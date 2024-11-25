import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.model.js"; // User model
import { Password } from "../models/Password.model.js"; // Password model

// Set Encryption Key
export const setEncryptionKey = async (req, res) => {
  const { userId, encryptionKey } = req.body;

  if (!encryptionKey) {
    return res.status(400).json({ error: "Encryption key is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the encryption key before saving
    const hashedEncryptionKey = await bcryptjs.hash(encryptionKey, 10);

    // Save the hashed encryption key in the user document
    user.encryptionKeyHash = hashedEncryptionKey;
    await user.save();

    return res.status(200).json({
      message: "Encryption key set successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Save Password
export const savePassword = async (req, res) => {
  const { userId, email, password, encryptionKey } = req.body;

  if (!email || !password || !encryptionKey) {
    return res.status(400).json({
      error: "Email, password, and encryption key are required",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is free and already has 3 saved passwords
    if (!user.isPaid) {
      const passwordCount = await Password.countDocuments({ user: userId });
      if (passwordCount >= 3) {
        return res.status(403).json({
          error:
            "Free users can only save up to 3 passwords. Upgrade to save more.",
        });
      }
    }

    // Encrypt the password
    const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
    let encryptedPassword = cipher.update(password, "utf8", "hex");
    encryptedPassword += cipher.final("hex");

    // Save the encrypted password
    const passwordData = new Password({
      user: userId,
      email,
      encryptedPassword,
    });
    await passwordData.save();

    return res.status(200).json({ message: "Password saved successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// View Password
export const viewPassword = async (req, res) => {
  const { userId, email, encryptionKey } = req.body;

  if (!email || !encryptionKey) {
    return res
      .status(400)
      .json({ error: "Email and encryption key are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the saved password for the given email
    const savedPassword = await Password.findOne({ user: userId, email });
    if (!savedPassword) {
      return res.status(404).json({ error: "Password not found" });
    }

    try {
      // Attempt to decrypt the password using the provided encryption key
      const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);
      let decryptedPassword = decipher.update(
        savedPassword.encryptedPassword,
        "hex",
        "utf8"
      );
      decryptedPassword += decipher.final("utf8");

      return res.status(200).json({
        email,
        decryptedPassword,
      });
    } catch (decryptionError) {
      // Handle decryption failure (invalid encryption key)
      return res.status(400).json({ error: "Invalid encryption key" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updatePassword = async (req, res) => {
  const { userId, email, newPassword, encryptionKey } = req.body;

  if (!email || !newPassword || !encryptionKey) {
    return res
      .status(400)
      .json({ error: "Email, new password, and encryption key are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Verify if the email-password pair exists
    const savedPassword = await Password.findOne({ user: userId, email });
    if (!savedPassword) {
      return res.status(404).json({ error: "Password record not found." });
    }

    // Attempt to decrypt the saved password using the provided encryption key
    try {
      const decipher = crypto.createDecipher("aes-256-cbc", encryptionKey);
      decipher.update(savedPassword.encryptedPassword, "hex", "utf8");
      decipher.final("utf8");
    } catch (err) {
      return res.status(400).json({ error: "Invalid encryption key." });
    }

    // Encrypt the new password
    const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
    let encryptedPassword = cipher.update(newPassword, "utf8", "hex");
    encryptedPassword += cipher.final("hex");

    // Update the password in the database
    savedPassword.encryptedPassword = encryptedPassword;
    await savedPassword.save();

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePassword = async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "User ID and email are required" });
  }

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the email-password pair exists for this user
    const savedPassword = await Password.findOne({ user: userId, email });
    if (!savedPassword) {
      return res
        .status(404)
        .json({ error: "No password entry found for this email" });
    }

    // Delete the password entry
    await Password.deleteOne({ user: userId, email });

    return res.status(200).json({
      message: "Password entry deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
