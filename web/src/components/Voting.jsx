import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Voting({ 
  postId, 
  commentId, 
  initialVotes = null, // { upvotes, downvotes, userVote }
  onVoteUpdate = null // Callback when vote changes
}) {
  const [votes, setVotes] = useState(
    initialVotes || { upvotes: 0, downvotes: 0, userVote: '', score: 0 }
  )
  const [loading, setLoading] = useState(!initialVotes)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    // Only fetch votes if no initial vote data was provided
    if (!initialVotes) {
      fetchVotes()
    }
  }, [postId, commentId, initialVotes])

  useEffect(() => {
    // Update state when initialVotes prop changes
    if (initialVotes) {
      setVotes(initialVotes)
      setLoading(false)
    }
  }, [initialVotes])

  const fetchVotes = async () => {
    try {
      setLoading(true)
      const endpoint = postId ? `/api/posts/${postId}/votes` : `/api/comments/${commentId}/votes`
      const response = await axios.get(endpoint)
      setVotes(response.data)
    } catch (error) {
      console.error('Error fetching votes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteType) => {
    if (voting) return

    try {
      setVoting(true)
      const endpoint = postId ? `/api/posts/${postId}/vote` : `/api/comments/${commentId}/vote`
      
      await axios.post(endpoint, { vote_type: voteType })
      
      // If we have initial votes, try to update locally and call onVoteUpdate
      if (initialVotes && onVoteUpdate) {
        await fetchVotes() // Get fresh data
        // Get the updated votes and call the callback
        const updatedEndpoint = postId ? `/api/posts/${postId}/votes` : `/api/comments/${commentId}/votes`
        const response = await axios.get(updatedEndpoint)
        setVotes(response.data)
        onVoteUpdate(response.data)
      } else {
        await fetchVotes()
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted/50 rounded-lg animate-pulse"></div>
        <div className="w-12 h-4 bg-muted/50 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-muted/50 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  const netScore = votes.upvotes - votes.downvotes
  const totalVotes = votes.upvotes + votes.downvotes

  return (
    <div className="flex items-center gap-1">
      {/* Upvote Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={voting}
        className={cn(
          "relative h-8 w-8 p-0 rounded-lg transition-all duration-200",
          "hover:bg-green-500/10 hover:border-green-500/20",
          votes.userVote === 'upvote' 
            ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30" 
            : "text-muted-foreground hover:text-green-600 dark:hover:text-green-400"
        )}
        aria-label="Upvote"
      >
        <ChevronUp className={cn(
          "h-4 w-4 transition-transform duration-200",
          votes.userVote === 'upvote' && "scale-110"
        )} />
      </Button>

      {/* Vote Count/Score */}
      <div className="flex items-center gap-1 px-2 min-w-[3rem] justify-center">
        {totalVotes > 0 ? (
          <div className="flex items-center gap-1">
            {netScore > 0 && (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            {netScore < 0 && (
              <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
            )}
            {netScore === 0 && totalVotes > 0 && (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(
              "text-sm font-medium",
              netScore > 0 && "text-green-600 dark:text-green-400",
              netScore < 0 && "text-red-600 dark:text-red-400",
              netScore === 0 && "text-muted-foreground"
            )}>
              {netScore > 0 ? `+${netScore}` : netScore}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        )}
      </div>

      {/* Downvote Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={voting}
        className={cn(
          "relative h-8 w-8 p-0 rounded-lg transition-all duration-200",
          "hover:bg-red-500/10 hover:border-red-500/20",
          votes.userVote === 'downvote' 
            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30" 
            : "text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          votes.userVote === 'downvote' && "scale-110"
        )} />
      </Button>

      {/* Vote breakdown tooltip on hover (optional - can add later) */}
      {totalVotes > 0 && (
        <div className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-popover text-popover-foreground px-2 py-1 rounded shadow-lg border border-border/50 whitespace-nowrap z-10">
          {votes.upvotes} up • {votes.downvotes} down
        </div>
      )}
    </div>
  )
} 