import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Import the CORS package
import { connectDB } from "./dbHelpers/db.connect.js";

dotenv.config();
console.log("JWT Secret:", process.env.JWT_SECRET);

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // This will allow all origins by default

const PORT = process.env.PORT || 5000;

import authRoutes from "./routes/auth.routes.js";

// Routes
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  connectDB(); // Connect to MongoDB after server starts
  console.log("Server is running on port", PORT);
});
