import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FlagModal({ isOpen, onClose, postId, onFlagSuccess }) {
  const [flagReasons, setFlagReasons] = useState({});
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFlagReasons();
    }
  }, [isOpen]);

  const fetchFlagReasons = async () => {
    try {
      const response = await axios.get('/api/flag-reasons');
      setFlagReasons(response.data.reasons);
    } catch (error) {
      console.error('Error fetching flag reasons:', error);
      setError('Failed to load flag reasons');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for flagging');
      return;
    }

    if (selectedReason === 'other' && !details.trim()) {
      setError('Please provide details when selecting "Other"');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await axios.post(`/api/posts/${postId}/flag`, {
        reason: selectedReason,
        details: details.trim()
      });
      
      onFlagSuccess();
      handleClose();
      
    } catch (error) {
      console.error('Error flagging post:', error);
      if (error.response?.status === 409) {
        setError('You have already flagged this post');
      } else {
        setError(error.response?.data?.error || 'Failed to flag post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="flag-modal-overlay" onClick={handleClose} />
      <div className="flag-modal">
        <div className="flag-modal-header">
          <h3>Flag Post</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flag-modal-content">
          {error && (
            <div className="error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          <div className="flag-reason-group">
            <label>Why are you flagging this post?</label>
            <div className="flag-reason-options">
              {Object.entries(flagReasons).map(([key, description]) => (
                <label key={key} className="flag-reason-option">
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={selectedReason === key}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={loading}
                  />
                  <span className="flag-reason-text">
                    <strong>{description}</strong>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'other' && (
            <div className="flag-details-group">
              <label htmlFor="flag-details">Please provide more details:</label>
              <textarea
                id="flag-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe why you're flagging this post..."
                rows="3"
                disabled={loading}
                maxLength="500"
              />
              <div className="character-count">
                {details.length}/500 characters
              </div>
            </div>
          )}

          <div className="flag-modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flag-submit-btn"
              disabled={loading || !selectedReason}
            >
              {loading ? 'Flagging...' : 'Flag Post'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default FlagModal; 