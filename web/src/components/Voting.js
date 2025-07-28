import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Voting = ({ postId, commentId }) => {
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0, userVote: '', score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, commentId]);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const endpoint = postId ? `/api/posts/${postId}/votes` : `/api/comments/${commentId}/votes`;
      const response = await axios.get(endpoint);
      setVotes(response.data);
    } catch (error) {
      console.error('Error fetching votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      const endpoint = postId ? `/api/posts/${postId}/vote` : `/api/comments/${commentId}/vote`;
      const response = await axios.post(endpoint, {
        vote_type: voteType
      });
      
      // Update votes with the response data
      setVotes(response.data);
      
    } catch (error) {
      console.error('Error voting:', error);
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        alert('You\'re voting too frequently. Please wait a moment.');
      } else if (error.response?.status === 400) {
        alert('Invalid vote.');
      } else if (error.response?.status === 404) {
        alert(postId ? 'Post not found.' : 'Comment not found.');
      } else {
        alert('Failed to vote. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="voting-loading">Loading votes...</div>;
  }

  return (
    <div className="voting-section">
      <div className="voting-buttons">
        <button
          className={`vote-btn upvote-btn ${votes.userVote === 'upvote' ? 'voted' : ''}`}
          onClick={() => handleVote('upvote')}
          title="Upvote"
        >
          <span className="vote-arrow">▲</span>
        </button>
        
        <div className="vote-score">
          {votes.score}
        </div>
        
        <button
          className={`vote-btn downvote-btn ${votes.userVote === 'downvote' ? 'voted' : ''}`}
          onClick={() => handleVote('downvote')}
          title="Downvote"
        >
          <span className="vote-arrow">▼</span>
        </button>
      </div>
      
      {(votes.upvotes > 0 || votes.downvotes > 0) && (
        <div className="vote-details">
          <span className="upvotes">👍 {votes.upvotes}</span>
          <span className="downvotes">👎 {votes.downvotes}</span>
        </div>
      )}
    </div>
  );
};

export default Voting; 