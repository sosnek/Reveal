import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Voting from '@/components/Voting'
import Comments from '@/components/Comments'
import { Flag, MessageCircle, Clock, Eye, EyeOff } from 'lucide-react'

export default function PostCard({ post, onUpdate }) {
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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
      return 'Yesterday'
    } else {
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    }
  }

  const shouldTruncate = post.content.length > 300
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.substring(0, 300) + '...' 
    : post.content

  return (
    <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:border-border">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-purple-500/[0.02] dark:from-blue-400/[0.02] dark:to-purple-400/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <Badge variant="secondary" className="text-xs bg-muted/50 border-border/50">
                Anonymous
              </Badge>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(post.created_at)}
              </div>
            </div>
            
            <CardTitle className="text-xl text-foreground mb-3 leading-tight line-clamp-2">
              {post.title}
            </CardTitle>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
            onClick={() => setShowFlagModal(true)}
          >
            <Flag className="w-4 h-4" />
            <span className="sr-only">Report post</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="prose prose-sm max-w-none text-foreground/90 mb-6">
          <div className="whitespace-pre-wrap leading-relaxed">
            {displayContent}
          </div>
          
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 h-auto p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span className="flex items-center gap-1 text-sm">
                {isExpanded ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Read more
                  </>
                )}
              </span>
            </Button>
          )}
        </div>

        {/* Voting and Comments Section */}
        <div className="border-t border-border/50 pt-4 space-y-4">
          {/* Voting Row */}
          <div className="flex items-center justify-between">
            <Voting postId={post.id} />
            <div className="text-xs text-muted-foreground">
              Share your thoughts below
            </div>
          </div>
          
          {/* Comments Section */}
          <div>
            <Comments postId={post.id} />
          </div>
        </div>
      </CardContent>

      {/* Flag Modal (Simple) */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Report Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to report this post? Our moderation team will review it.
              </p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFlagModal(false)}
                  className="border-border/50"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    // Handle flag submission
                    setShowFlagModal(false)
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
} 