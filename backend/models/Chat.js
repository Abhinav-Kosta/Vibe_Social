import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Ensure a chat has exactly two participants for 1-to-1
chatSchema.path('participants').validate(function (val) {
  return val.length === 2;
}, 'Chats must have exactly 2 participants.');

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
