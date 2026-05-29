import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';

// @desc    Search users for chat or follow
// @route   GET /api/v1/users/search
// @access  Private
export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query || '', $options: 'i' },
      _id: { $ne: req.user._id },
    })
      .select('username fullName profilePic isOnline')
      .limit(10);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile details
// @route   GET /api/v1/users/profile/:username
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username fullName profilePic')
      .populate('following', 'username fullName profilePic');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ user: user._id })
      .populate('user', 'username fullName profilePic')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        user,
        posts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { fullName, bio } = req.body;
  try {
    const updateData = { fullName, bio };

    if (req.file) {
      const isCloudinary = req.file.path.startsWith('http://') || req.file.path.startsWith('https://');
      updateData.profilePic = isCloudinary 
        ? req.file.path 
        : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Follow / Unfollow user
// @route   PUT /api/v1/users/follow/:id
// @access  Private
export const followUnfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      res.json({ success: true, message: 'User unfollowed successfully' });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, { $push: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUserId } });

      // Create Follow Notification
      await Notification.create({
        receiver: targetUserId,
        sender: currentUserId,
        type: 'follow',
      });

      res.json({ success: true, message: 'User followed successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
