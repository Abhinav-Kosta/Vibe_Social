import express from 'express';
import {
  searchUsers,
  getProfile,
  updateProfile,
  followUnfollowUser,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/search', protect, searchUsers);
router.get('/profile/:username', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.put('/follow/:id', protect, followUnfollowUser);

export default router;
