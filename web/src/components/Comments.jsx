import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Voting from '@/components/Voting'
import FlagConfirmModal from '@/components/FlagConfirmModal'
import { MessageCircle, Send, Flag, Clock, User, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Comments({ postId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [flagModal, setFlagModal] = useState({ isOpen: false, commentId: null })

  useEffect(() => {
    if (showComments && postId) {
      fetchComments()
    }
  }, [showComments, postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/posts/${postId}/comments`)
      setComments(response.data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      setMessage({ type: 'error', text: 'Please enter a comment.' })
      return
    }

    if (newComment.trim().length < 3) {
      setMessage({ type: 'error', text: 'Comment must be at least 3 characters long.' })
      return
    }

    if (newComment.length > 1000) {
      setMessage({ type: 'error', text: 'Comment too long (max 1000 characters).' })
      return
    }

    try {
      setSubmitting(true)
      setMessage({ type: '', text: '' })
      
      await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment.trim()
      })
      
      setNewComment('')
      setMessage({ type: 'success', text: 'Comment posted anonymously!' })
      
      // Refresh comments to show the new one
      fetchComments()
      
    } catch (error) {
      console.error('Error submitting comment:', error)
      const errorMessage = error.response?.data?.error || 'Failed to post comment. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours}h ago`
    } else if (diffInHours < 48) {
      return '1d ago'
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    setMessage({ type: '', text: '' })
  }

  const handleFlagComment = (commentId) => {
    setFlagModal({ isOpen: true, commentId })
  }

  const closeFlagModal = () => {
    setFlagModal({ isOpen: false, commentId: null })
  }

  const commentCount = comments.length
  const commentLength = newComment.length
  const isCommentValid = newComment.trim().length >= 3

  return (
    <div className="space-y-4">
      {/* Comments Toggle Button */}
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "text-muted-foreground hover:text-foreground gap-2 transition-all duration-200",
          "hover:bg-accent/50 rounded-lg"
        )}
        onClick={toggleComments}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm">
          {showComments ? 'Hide Comments' : 'Show Comments'}
          {commentCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs bg-muted/50 border-border/50">
              {commentCount}
            </Badge>
          )}
        </span>
        {showComments ? (
          <ChevronUp className="w-3 h-3 ml-1" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-1" />
        )}
      </Button>

      {showComments && (
        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
          {/* Comment Form */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <CardTitle className="text-base text-foreground">Add a Comment</CardTitle>
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                  Anonymous
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                {message.text && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    message.type === 'success' 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20" 
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  )}>
                    {message.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Your Comment</span>
                      <span className={cn(
                        "text-xs",
                        commentLength >= 3 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                      )}>
                        {commentLength}/1000
                      </span>
                    </div>
                    <Textarea
                      value={newComment}
                      onChange={(e) => {
                        setNewComment(e.target.value)
                        if (message.text) setMessage({ type: '', text: '' })
                      }}
                      placeholder="Share your thoughts anonymously..."
                      maxLength={1000}
                      disabled={submitting}
                      rows={3}
                      className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      Your comment will be posted anonymously
                    </div>
                    
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={submitting || !isCommentValid}
                      className={cn(
                        "relative overflow-hidden px-4 py-2 font-medium transition-all duration-300",
                        isCommentValid 
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg" 
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Posting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          <span>Post Comment</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="text-center py-12">
                  <div className="relative inline-block mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-blue-500"></div>
                  </div>
                  <p className="text-muted-foreground font-medium">Loading comments...</p>
                </CardContent>
              </Card>
            ) : commentCount === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="text-center py-12">
                  <div className="mb-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">No comments yet</h4>
                  <p className="text-muted-foreground">
                    Be the first to share your thoughts on this secret!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                  </h4>
                  <div className="h-px bg-gradient-to-r from-border to-transparent flex-1"></div>
                </div>
                
                {comments.map(comment => (
                  <Card 
                    key={comment.id} 
                    className="group bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Voting Section */}
                        <div className="flex-shrink-0">
                          <Voting commentId={comment.id} />
                        </div>
                        
                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                <Badge variant="secondary" className="text-xs bg-muted/50 border-border/50">
                                  <User className="w-3 h-3 mr-1" />
                                  Anonymous
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Flag Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                              onClick={() => handleFlagComment(comment.id)}
                            >
                              <Flag className="w-3 h-3" />
                              <span className="sr-only">Report comment</span>
                            </Button>
                          </div>
                          
                          <div className="prose prose-sm max-w-none text-foreground/90">
                            <p className="leading-relaxed whitespace-pre-wrap text-sm">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flag Confirmation Modal for Comments */}
      <FlagConfirmModal
        isOpen={flagModal.isOpen}
        onClose={closeFlagModal}
        type="comment"
        itemId={flagModal.commentId}
        onSuccess={fetchComments}
      />
    </div>
  )
} 