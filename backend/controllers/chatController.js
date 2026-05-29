import Chat from '../models/Chat.js';

// @desc    Create or get 1-to-1 chat room
// @route   POST /api/v1/chats
// @access  Private
export const createOrGetChat = async (req, res) => {
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ success: false, message: 'Receiver user ID is required' });
  }

  try {
    // Check if chat room already exists between these 2 participants
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, receiverId] },
    })
      .populate('participants', 'username fullName profilePic isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'username fullName profilePic',
        },
      });

    if (!chat) {
      // Create new chat room
      chat = await Chat.create({
        participants: [req.user._id, receiverId],
      });
      chat = await Chat.findById(chat._id).populate(
        'participants',
        'username fullName profilePic isOnline lastSeen'
      );
    }

    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of all chats for current user
// @route   GET /api/v1/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
    })
      .populate('participants', 'username fullName profilePic isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'username fullName profilePic',
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
