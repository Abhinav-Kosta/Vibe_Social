import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Edit2, MessageSquare, UserCheck, UserPlus } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateProfileState } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);

  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/users/profile/${username}`);
      if (res.data.success) {
        const { user: u, posts: p } = res.data.data;
        setProfileUser(u);
        setPosts(p);
        setBio(u.bio || '');
        setFullName(u.fullName);
        
        // Check if current user is following this profile
        if (currentUser) {
          setIsFollowing(u.followers.some((f) => f._id === currentUser._id));
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    try {
      const res = await API.put(`/users/follow/${profileUser._id}`);
      if (res.data.success) {
        setIsFollowing(!isFollowing);
        // Refresh profile stats
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);
    setUpdating(true);

    try {
      const res = await API.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setProfileUser((prev) => ({ ...prev, profilePic: res.data.data.profilePic }));
        updateProfileState(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await API.put('/users/profile', { fullName, bio });
      if (res.data.success) {
        setProfileUser((prev) => ({ ...prev, fullName: res.data.data.fullName, bio: res.data.data.bio }));
        updateProfileState(res.data.data);
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleMessageShortcut = async () => {
    try {
      const res = await API.post('/chats', { receiverId: profileUser._id });
      if (res.data.success) {
        navigate('/chats', { state: { activeChatId: res.data.data._id } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Resolving profile...</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profileUser?._id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm mb-10 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
            {/* Avatar block */}
            <div className="relative group mb-6 md:mb-0">
              <img
                src={profileUser.profilePic}
                alt={profileUser.username}
                className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md group-hover:opacity-90 transition-opacity"
              />
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updating}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-colors active:scale-90"
                  title="Upload profile picture"
                >
                  <Camera className="h-4.5 w-4.5" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Bio and details */}
            <div className="flex-1 text-center md:text-left">
              {editMode ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 max-w-md">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-200"
                  />
                  <textarea
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-slate-200 resize-none"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      {updating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 mb-4 justify-center md:justify-start">
                    <h2 className="text-xl font-bold">{profileUser.fullName}</h2>
                    <span className="text-sm text-slate-400">@{profileUser.username}</span>

                    {/* CTAs */}
                    <div className="flex items-center space-x-2 justify-center">
                      {isOwnProfile ? (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center space-x-1 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all duration-200 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit Profile</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleFollowToggle}
                            className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                              isFollowing
                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                            }`}
                          >
                            {isFollowing ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleMessageShortcut}
                            className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Message</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Followers count panel */}
                  <div className="flex justify-center md:justify-start space-x-6 mb-4 text-sm font-semibold">
                    <p>
                      <span className="font-extrabold mr-1">{posts.length}</span>
                      <span className="text-slate-400 text-xs">Posts</span>
                    </p>
                    <p>
                      <span className="font-extrabold mr-1">{profileUser.followers?.length || 0}</span>
                      <span className="text-slate-400 text-xs">Followers</span>
                    </p>
                    <p>
                      <span className="font-extrabold mr-1">{profileUser.following?.length || 0}</span>
                      <span className="text-slate-400 text-xs">Following</span>
                    </p>
                  </div>

                  {/* Bio details */}
                  <p className="text-sm text-slate-600 dark:text-slate-350 max-w-lg leading-relaxed">
                    {profileUser.bio || "No bio yet."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Gallery / Feed Posts list */}
        <h3 className="text-base font-extrabold mb-5 uppercase tracking-wider text-slate-500">Posts</h3>
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
            <p className="text-slate-400 font-medium">No posts shared yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="relative aspect-square rounded-2xl overflow-hidden group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
              >
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-6 text-white font-bold text-sm">
                  <div className="flex items-center space-x-1.5">
                    <Camera className="h-5 w-5 fill-current" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MessageSquare className="h-5 w-5 fill-current" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
