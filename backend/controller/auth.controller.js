import { User } from "../models/User.model.js";
import bcryptjs from "bcryptjs";
import { generateVerificationToken } from "../utils/verificationTokens.js";
import { generateWebTokenAndSetCookie } from "../utils/generateWebTokenAndSetCookie.js";
import { sendEmail } from "../config/sendMail.config.js";

const logError = (message, error) => {
  console.error(`ERROR: ${message}`, error);
};

export const signup = async (req, res) => {
  const { email, name, password, phoneNumber } = req.body;
  try {
    // 1. Validate input
    if (!email || !name || !password || !phoneNumber) {
      const message = "Missing required fields";
      logError(message, { email, name, phoneNumber });
      return res.status(400).json({ error: message });
    }

    // 2. Check if email already exists
    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      const message = "Email already exists";
      logError(message, { email });
      return res.status(400).json({ error: message });
    }

    // 3. Hash the password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // 4. Generate OTP token
    const { token, expiresAt } = generateVerificationToken();
    if (!token) {
      const message = "Failed to generate OTP";
      logError(message, { email });
      return res.status(500).json({ error: message });
    }

    // 5. Save user
    const newUser = new User({
      email,
      name,
      phoneNumber,
      password: hashedPassword,
      verificationToken: token,
      tokenExpiresAt: expiresAt,
    });

    await newUser.save();

    // 6. Send email with OTP
    const msg = `
      <p>Dear ${newUser.name},</p>
      <p>Thank you for your interest in joining us. Your OTP for account activation is:</p>
      <p><strong>${newUser.verificationToken}</strong></p>
      <p>If you encounter any issues, please contact support.</p>
    `;

    try {
      await sendEmail({
        to: newUser.email,
        subject: "Account Activation OTP",
        html: msg,
      });
    } catch (sendError) {
      const message = "Failed to send OTP email";
      logError(message, sendError);
      return res.status(500).json({ error: message });
    }

    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: { id: newUser._id, email: newUser.email },
    });
  } catch (error) {
    logError("Unexpected error during signup", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  console.log("Hello");
  const { email, password } = req.body;

  // Validate if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Fetch the user by email
    const user = await User.findOne({ email: email });

    // If user doesn't exist, return error
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcryptjs.compare(password, user.password);

    // If passwords don't match, return error
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // If the user is not verified, return error
    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    // Send success response
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        password: undefined, // Don't send the password in the response
      },
      token: generateWebTokenAndSetCookie(res, user._id), // Assuming this is your JWT generation function
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Validate token and expiration
    if (user.verificationToken !== token) {
      return res.status(400).json({ error: "Invalid token." });
    }

    if (new Date() > user.tokenExpiresAt) {
      return res.status(400).json({ error: "Token has expired." });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = null; // Clear the token after verification
    user.tokenExpiresAt = null; // Clear the expiration date
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
};

export const logout = async (req, res) => {};
