import express from 'express';
import {
  createPost,
  getFeed,
  likeUnlikePost,
  commentPost,
  deletePost,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('image'), createPost)
  .get(protect, getFeed);

router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, likeUnlikePost);
router.post('/:id/comment', protect, commentPost);

export default router;
