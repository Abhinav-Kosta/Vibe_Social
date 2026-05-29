import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const PostCard = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const isLiked = likes.includes(user?._id);

  const handleLike = async () => {
    try {
      const res = await API.put(`/posts/${post._id}/like`);
      if (res.data.success) {
        setLikes(res.data.data);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await API.post(`/posts/${post._id}/comment`, { text: commentText });
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.data]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const res = await API.delete(`/posts/${post._id}`);
        if (res.data.success) {
          if (onPostDeleted) {
            onPostDeleted(post._id);
          }
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mb-6 transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.user.username}`} className="flex items-center space-x-3">
          <img
            src={post.user.profilePic}
            alt={post.user.username}
            className="h-10 w-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
          />
          <div>
            <p className="font-semibold text-sm hover:underline">{post.user.fullName}</p>
            <p className="text-xs text-slate-400">@{post.user.username} • {formatDate(post.createdAt)}</p>
          </div>
        </Link>

        {user?._id === post.user._id && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Post Image */}
      <div className="w-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center max-h-[600px]">
        <img
          src={post.image}
          alt="Post asset"
          className="w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Action panel */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
              isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{comments.length}</span>
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
            <span className="font-bold mr-1.5 text-slate-900 dark:text-white">
              {post.user.username}
            </span>
            {post.caption}
          </p>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 animate-in fade-in duration-200">
            {comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex items-start space-x-2 text-sm">
                    <Link to={`/profile/${comment.user.username}`}>
                      <img
                        src={comment.user.profilePic}
                        alt={comment.user.username}
                        className="h-7 w-7 rounded-full object-cover mt-0.5 border border-slate-100 dark:border-slate-800"
                      />
                    </Link>
                    <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl px-3.5 py-2 flex-1">
                      <p className="font-semibold text-xs mb-0.5">
                        <Link to={`/profile/${comment.user.username}`} className="hover:underline">
                          {comment.user.username}
                        </Link>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 text-xs">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4">No comments yet. Start the conversation!</p>
            )}

            {/* Comment input form */}
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:text-slate-200"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentLoading}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
