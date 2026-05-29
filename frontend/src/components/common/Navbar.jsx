import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, MessageSquare, Bell, LogOut, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import API from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search API trigger
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await API.get(`/users/search?query=${searchQuery}`);
          if (res.data.success) {
            setSearchResults(res.data.data);
            setShowDropdown(true);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Notifications API (in real-world, could also populate notifications)
  const fetchNotifications = async () => {
    // We will simulate or retrieve notification from API if built.
    // Let's query notifications. In controllers, we create them but we can add a route later if needed.
    // Let's create a lightweight notifications system or mock state
  };

  const handleSearchSelect = (username) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/profile/${username}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full glassmorphism border-b border-custom-border px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-300">
      {/* Brand logo */}
      <Link to="/" className="flex items-center space-x-2">
        <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
          VIBE
        </span>
      </Link>

      {/* User Search System */}
      <div ref={dropdownRef} className="relative hidden sm:block w-72 md:w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 rounded-full border border-custom-border bg-slate-100/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-custom-card border border-custom-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {searchResults.map((userResult) => (
              <div
                key={userResult._id}
                onClick={() => handleSearchSelect(userResult.username)}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <img
                  src={userResult.profilePic}
                  alt={userResult.username}
                  className="h-9 w-9 rounded-full object-cover border border-custom-border"
                />
                <div>
                  <p className="font-semibold text-sm">{userResult.fullName}</p>
                  <p className="text-xs text-slate-400">@{userResult.username}</p>
                </div>
                {userResult.isOnline && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav Controls */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Timeline Feed"
        >
          <Compass className="h-5 w-5" />
        </Link>

        <Link
          to="/chats"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Direct Chats"
        >
          <MessageSquare className="h-5 w-5" />
        </Link>

        <ThemeToggle />

        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-custom-border">
            <Link to={`/profile/${user.username}`} className="flex items-center space-x-2 group">
              <img
                src={user.profilePic}
                alt={user.username}
                className="h-8 w-8 rounded-full object-cover border border-custom-border group-hover:scale-105 transition-transform duration-200"
              />
              <span className="hidden md:inline font-semibold text-sm group-hover:text-blue-500 transition-colors">
                {user.fullName}
              </span>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
