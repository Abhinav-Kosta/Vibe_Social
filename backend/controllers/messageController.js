import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { getReceiverSocketId, getIO } from '../config/socket.js';

// @desc    Send a message (text or attachment)
// @route   POST /api/v1/messages
// @access  Private
export const sendMessage = async (req, res) => {
  const { chatId, content, receiverId } = req.body;

  try {
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required' });
    }

    let mediaUrl = '';
    let mediaType = '';

    if (req.file) {
      const isCloudinary = req.file.path.startsWith('http://') || req.file.path.startsWith('https://');
      mediaUrl = isCloudinary 
        ? req.file.path 
        : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      } else {
        mediaType = 'file';
      }
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    // Determine initial status based on recipient online status
    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = receiverSocketId ? 'delivered' : 'sent';

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content: content || '',
      mediaUrl,
      mediaType,
      status: initialStatus,
    });

    // Update the chat room's latest message reference
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'username fullName profilePic'
    );

    // Emit socket event to the recipient in real-time
    if (receiverSocketId) {
      const io = getIO();
      io.to(receiverSocketId).emit('new-message', {
        chatId,
        message: populatedMessage,
      });
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages for a specific chat
// @route   GET /api/v1/messages/:chatId
// @access  Private
export const getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    // Fetch chat first to ensure permission
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(401).json({ success: false, message: 'Not authorized to view these messages' });
    }

    // Fetch messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username fullName profilePic')
      .sort({ createdAt: 1 });

    // Mark unread messages as 'read' if current user is receiver
    const unreadUpdate = await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        status: { $ne: 'read' },
      },
      { $set: { status: 'read' } }
    );

    // If any messages were marked read, notify the sender via Socket.io
    if (unreadUpdate.modifiedCount > 0) {
      const otherParticipantId = chat.participants.find(
        (id) => id.toString() !== req.user._id.toString()
      );
      const otherSocketId = getReceiverSocketId(otherParticipantId);
      if (otherSocketId) {
        const io = getIO();
        io.to(otherSocketId).emit('chat-read', {
          chatId,
          readBy: req.user._id,
        });
      }
    }

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
