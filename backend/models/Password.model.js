import mongoose from "mongoose";

const passwordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    encryptedPassword: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Password = mongoose.model("Password", passwordSchema);
