import express from "express";
import {
  signup,
  login,
  logout,
  verifyToken,
} from "../controller/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login/signIn", login);

router.post("/verifyToken", verifyToken);

router.post("/logout", logout);
export default router;
