import React, { useState, useRef } from 'react';
import { Image, Send, X } from 'lucide-react';
import API from '../../services/api';

const CreatePost = ({ onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', selectedFile);

    try {
      const res = await API.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setCaption('');
        handleRemoveImage();
        if (onPostCreated) {
          onPostCreated(res.data.data);
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6 transition-all duration-300">
      <form onSubmit={handleSubmit}>
        <textarea
          rows="2"
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full resize-none border-0 bg-transparent text-sm focus:ring-0 focus:outline-none placeholder-slate-400 dark:text-slate-200"
        />

        {previewUrl && (
          <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96">
            <img src={previewUrl} alt="Preview" className="w-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Image className="h-5 w-5 text-indigo-500" />
            <span>Photo</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="submit"
            disabled={!selectedFile || loading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <span>Post</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
