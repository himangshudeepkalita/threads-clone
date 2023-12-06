import express from "express";
import { verifyToken } from '../utils/verifyUser.js';
import { getMessages, sendMessage, getConversations } from "../controllers/messageController.js";

const router = express.Router();

router.get("/conversations", verifyToken, getConversations);
router.get("/:otherUserId", verifyToken, getMessages);
router.post("/", verifyToken, sendMessage);

export default router;