import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const userSocketMap = {}; // { userId: socketId }

let io;

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We can restrict this to frontend URL in production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Check if bearer token format
      const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      
      const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    userSocketMap[userId] = socket.id;

    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Update online status in database
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast updated online status to everyone
    io.emit('user-status', {
      userId,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Notify other online users
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      delete userSocketMap[userId];

      const lastSeenTime = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: lastSeenTime,
      });

      // Broadcast offline status
      io.emit('user-status', {
        userId,
        isOnline: false,
        lastSeen: lastSeenTime,
      });
    });

    // Typing indicators
    socket.on('typing', ({ chatId, receiverId, isTyping }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { chatId, isTyping });
      }
    });

    // Read receipts
    socket.on('message-read', async ({ chatId, messageId, senderId }) => {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message-status-updated', {
          chatId,
          messageId,
          status: 'read',
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

