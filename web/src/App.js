import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ThemeSwitcher from './components/ThemeSwitcher';
import FlagModal from './components/FlagModal';
import Comments from './components/Comments';
import Voting from './components/Voting';
import './index.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTheme, setCurrentTheme] = useState('original');
  const [flagModal, setFlagModal] = useState({ isOpen: false, postId: null });

  useEffect(() => {
    fetchPosts();
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('reveal-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Dynamically load theme CSS
    loadTheme(currentTheme);
    
    // Save theme preference
    localStorage.setItem('reveal-theme', currentTheme);
  }, [currentTheme]);

  const loadTheme = (themeName) => {
    // Remove existing theme link
    const existingThemeLink = document.getElementById('theme-css');
    if (existingThemeLink) {
      existingThemeLink.remove();
    }

    // If it's the original theme, we use the default index.css (already loaded)
    if (themeName === 'original') {
      return;
    }

    // Load the new theme CSS
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = `/themes/${themeName}.css`;
    document.head.appendChild(link);
  };

  const handleThemeChange = (themeName) => {
    setCurrentTheme(themeName);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setMessage({ type: 'error', text: 'Failed to load posts. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both title and content.' });
      return;
    }

    if (formData.content.length < 10) {
      setMessage({ type: 'error', text: 'Content must be at least 10 characters long.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      
      await axios.post('/api/posts', formData);
      
      setMessage({ type: 'success', text: 'Your secret has been shared anonymously!' });
      setFormData({ title: '', content: '' });
      
      // Refresh posts to show the new one
      fetchPosts();
      
    } catch (error) {
      console.error('Error submitting post:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit your secret. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = (postId) => {
    setFlagModal({ isOpen: true, postId });
  };

  const handleFlagSuccess = () => {
    setMessage({ type: 'success', text: 'Post has been flagged and hidden from your view.' });
    // Refresh posts to remove the flagged post for this user
    fetchPosts();
  };

  const closeFlagModal = () => {
    setFlagModal({ isOpen: false, postId: null });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Show relative time for recent posts, full date/time for older ones
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="container">
      <ThemeSwitcher 
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      
      <header className="header">
        <h1>Reveal</h1>
        <p>Share your secrets anonymously in a safe space</p>
      </header>

      <form className="post-form" onSubmit={handleSubmit}>
        <h2 style={{ marginBottom: '1.5rem', color: 'inherit', fontWeight: '300' }}>Share Your Secret</h2>
        
        {message.text && (
          <div className={message.type}>
            {message.text}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Give your secret a title..."
            maxLength="255"
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Your Secret</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Share what's on your mind anonymously..."
            rows="6"
            maxLength="5000"
            disabled={submitting}
          />
          <div style={{ fontSize: '0.8rem', color: 'inherit', marginTop: '0.5rem', opacity: 0.7 }}>
            {formData.content.length}/5000 characters
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Sharing...' : 'Share Anonymously'}
        </button>
      </form>

      <section className="posts-section">
        <div className="posts-header">
          <h2>Recent Secrets</h2>
          <p className="posts-count">
            {loading ? 'Loading...' : `${posts.length} anonymous secrets shared`}
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading recent secrets...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <h3>No secrets yet</h3>
            <p>Be the first to share an anonymous secret!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p className="post-content">{post.content}</p>
              <div className="post-meta">
                <span className="post-date">
                  {formatDate(post.created_at)}
                </span>
                <button 
                  className="flag-btn"
                  onClick={() => handleFlag(post.id)}
                  title="Flag as inappropriate"
                >
                  Flag
                </button>
              </div>
              
              {/* Voting Section */}
              <Voting postId={post.id} />
              
              {/* Comments Section */}
              <Comments postId={post.id} />
            </div>
          ))
        )}
      </section>

      <footer className="footer">
        <p>
          All posts are anonymous and cannot be traced back to you. 
          Please be respectful and avoid sharing harmful content.
        </p>
      </footer>

      <FlagModal
        isOpen={flagModal.isOpen}
        postId={flagModal.postId}
        onClose={closeFlagModal}
        onFlagSuccess={handleFlagSuccess}
      />
    </div>
  );
}

export default App; 