import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import API from '../services/api';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeed = async () => {
    try {
      const res = await API.get('/posts');
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      setError('Could not load feed. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((post) => post._id !== deletedPostId));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <CreatePost onPostCreated={handlePostCreated} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-medium">Curating your feed...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm text-center">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <p className="text-slate-500 dark:text-slate-400 font-medium">No posts here yet.</p>
            <p className="text-xs text-slate-400 mt-1">Follow users to see their posts or share your own thoughts above!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
