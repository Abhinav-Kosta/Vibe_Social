import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Create a new post
// @route   POST /api/v1/posts
// @access  Private
export const createPost = async (req, res) => {
  const { caption } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image upload is required' });
    }

    const isCloudinary = req.file.path.startsWith('http://') || req.file.path.startsWith('https://');
    const imageUrl = isCloudinary 
      ? req.file.path 
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const post = await Post.create({
      user: req.user._id,
      caption: caption || '',
      image: imageUrl,
    });

    const populatedPost = await Post.findById(post._id).populate('user', 'username fullName profilePic');

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feed posts (current user + followed users)
// @route   GET /api/v1/posts
// @access  Private
export const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following || [];

    // Query posts by followed users and own posts
    const posts = await Post.find({
      user: { $in: [...followingIds, req.user._id] },
    })
      .populate('user', 'username fullName profilePic')
      .populate('comments.user', 'username fullName profilePic')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like or Unlike a post
// @route   PUT /api/v1/posts/:id/like
// @access  Private
export const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((userId) => userId.toString() !== req.user._id.toString());
      await post.save();
      res.json({ success: true, message: 'Post unliked successfully', data: post.likes });
    } else {
      // Like
      post.likes.push(req.user._id);
      await post.save();

      // Create Notification if like is from another user
      if (post.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          receiver: post.user,
          sender: req.user._id,
          type: 'like',
          post: post._id,
        });
      }

      res.json({ success: true, message: 'Post liked successfully', data: post.likes });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to a post
// @route   POST /api/v1/posts/:id/comment
// @access  Private
export const commentPost = async (req, res) => {
  const { text } = req.body;
  try {
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = {
      user: req.user._id,
      text,
    };

    post.comments.push(comment);
    await post.save();

    // Get the newly added comment populated
    const updatedPost = await Post.findById(post._id)
      .populate('comments.user', 'username fullName profilePic');

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    // Create Notification if comment is from another user
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        receiver: post.user,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
      });
    }

    res.status(201).json({ success: true, data: addedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/v1/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if post belongs to user
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
