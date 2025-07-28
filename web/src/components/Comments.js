import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Voting from './Voting';

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setMessage({ type: 'error', text: 'Please enter a comment.' });
      return;
    }

    if (newComment.length > 1000) {
      setMessage({ type: 'error', text: 'Comment too long (max 1000 characters).' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      
      await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment
      });
      
      setNewComment('');
      setMessage({ type: 'success', text: 'Comment posted anonymously!' });
      
      // Refresh comments to show the new one
      fetchComments();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to post comment. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else if (diffInHours < 48) {
      return '1d ago';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="comments-section">
      <button 
        className="comments-toggle"
        onClick={toggleComments}
      >
        {showComments ? 'Hide Comments' : 'Show Comments'} 
        {comments.length > 0 && ` (${comments.length})`}
      </button>

      {showComments && (
        <div className="comments-content">
          {/* Comment Form */}
          <form className="comment-form" onSubmit={handleSubmitComment}>
            {message.text && (
              <div className={`comment-message ${message.type}`}>
                {message.text}
              </div>
            )}
            
            <div className="comment-input-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an anonymous comment..."
                maxLength="1000"
                disabled={submitting}
                rows="3"
              />
              <div className="comment-char-count">
                {newComment.length}/1000
              </div>
            </div>
            
            <button 
              type="submit" 
              className="comment-submit-btn"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {loading ? (
              <div className="comments-loading">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-main">
                    <Voting commentId={comment.id} />
                    <div className="comment-body">
                      <p className="comment-content">{comment.content}</p>
                      <div className="comment-meta">
                        <span className="comment-date">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments; 