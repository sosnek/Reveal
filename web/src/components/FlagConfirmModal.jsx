import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flag, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FlagConfirmModal({ isOpen, onClose, type, itemId, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  if (!isOpen) return null

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setMessage({ type: '', text: '' })
      
      const endpoint = type === 'post' 
        ? `/api/posts/${itemId}/flag`
        : `/api/comments/${itemId}/flag`
      
      await axios.post(endpoint, {
        reason: 'reported', // Simple default reason
        details: ''
      })
      
      setMessage({ type: 'success', text: 'Reported successfully!' })
      
      setTimeout(() => {
        onClose()
        setMessage({ type: '', text: '' })
        if (onSuccess) onSuccess()
      }, 1500)
      
    } catch (error) {
      console.error('Error reporting content:', error)
      const errorMessage = error.response?.data?.error || 'Failed to report. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm bg-card border-border shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              <CardTitle className="text-base text-foreground">
                Report {type === 'post' ? 'Post' : 'Comment'}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
              disabled={submitting}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {message.text && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg text-sm mb-4",
              message.type === 'success' 
                ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20" 
                : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              {message.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Are you sure you want to report this {type}? 
              <br />
              <span className="text-xs">Our moderation team will review it.</span>
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={submitting}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSubmit}
                disabled={submitting}
                size="sm"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Reporting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Flag className="w-3 h-3" />
                    <span>Report</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 