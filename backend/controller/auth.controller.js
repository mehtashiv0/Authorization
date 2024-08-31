import { User } from "../models/User.model.js";
import bcryptjs from "bcryptjs";
import { generateVerificationToken } from "../utils/verificationTokens.js";
import { generateWebTokenAndSetCookie } from "../utils/generateWebTokenAndSetCookie.js";
import { sendEmail } from "../config/sendMail.config.js";

export const signup = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    if (!email || !name || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const { token, expiresAt } = generateVerificationToken();

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      verificationToken: token,
      tokenExpiresAt: expiresAt,
    });

    await newUser.save();
    //send jsonweb token
    let newToken = generateWebTokenAndSetCookie(res, newUser._id);
    let msg = `
    <p>Dear ${newUser.name},</p>
<p>Thank you for your interest in joining Shiv Engineering and utilizing our ERP system. As part of our secure registration process, we have generated a one-time password (OTP) for your account activation.</p>
<p>Your OTP: <strong>${newUser.verificationToken}</strong></p>
<p>Upon verifying with the OTP, you will gain access to our ERP system and be able to take advantage of our comprehensive suite of tools and features.</p>
<p>If you encounter any issues during the registration process or have questions about our ERP system, please don't hesitate to contact our support team at <a href="mailto:support@shivengineering.com">support@shivengineering.com</a>.</p>
<p>We look forward to your successful registration and are excited to have you on board!</p>
<p>Best regards,</p>
<p>Shiv Engineering Team</p>
      `;
    console.log(msg);
    let mail = await sendEmail({
      to: newUser.email,
      subject: "Activate Your ERP Account - OTP Inside",
      html: msg,
    });
    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        password: undefined,
        verificationToken: newUser.verificationToken,
      },
      token: newToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const isMatch = await bcryptjs.compare(password);
    const user = await User.findOne({ email: email, password: isMatch });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }
    return res.sendResposne({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: undefined,
      },
      token: generateWebTokenAndSetCookie(res, user._id),
    });
  } catch (error) {}
};

export const logout = async (req, res) => {};
