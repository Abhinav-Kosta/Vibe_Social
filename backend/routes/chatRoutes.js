import express from 'express';
import { createOrGetChat, getChats } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrGetChat)
  .get(protect, getChats);

export default router;
