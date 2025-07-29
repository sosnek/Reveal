import { useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Send, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function CreatePostForm({ onPostCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear message when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both title and content.' })
      return
    }

    if (formData.title.trim().length < 3) {
      setMessage({ type: 'error', text: 'Title must be at least 3 characters long.' })
      return
    }

    if (formData.content.trim().length < 10) {
      setMessage({ type: 'error', text: 'Content must be at least 10 characters long.' })
      return
    }

    try {
      setSubmitting(true)
      setMessage({ type: '', text: '' })
      
      await axios.post('/api/posts', {
        title: formData.title.trim(),
        content: formData.content.trim()
      })
      
      setFormData({ title: '', content: '' })
      setMessage({ type: 'success', text: 'Your secret has been shared anonymously!' })
      
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create post. Please try again.' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const titleLength = formData.title.length
  const contentLength = formData.content.length
  const isFormValid = formData.title.trim().length >= 3 && formData.content.trim().length >= 10

  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-purple-500/[0.03] dark:from-blue-400/[0.03] dark:to-purple-400/[0.03]"></div>
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-lg text-foreground">Share Your Secret</CardTitle>
            <p className="text-sm text-muted-foreground">Your identity will remain completely anonymous</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Anonymous
          </Badge>
          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            <Lock className="w-3 h-3 mr-1" />
            Encrypted
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Title
              </Label>
              <span className={`text-xs ${titleLength >= 3 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {titleLength}/100
              </span>
            </div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Give your secret a title..."
              maxLength={100}
              className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20"
              disabled={submitting}
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-medium text-foreground">
                Your Secret
              </Label>
              <span className={`text-xs ${contentLength >= 10 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {contentLength}/5000
              </span>
            </div>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share what's on your mind... This is a safe space where you can express yourself freely and anonymously."
              maxLength={5000}
              rows={6}
              className="bg-background/50 border-border/50 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
              disabled={submitting}
            />
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'error' 
                ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                : 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Your post will be visible to everyone, but completely anonymous
            </div>
            
            <Button
              type="submit"
              disabled={submitting || !isFormValid}
              className={`
                relative overflow-hidden px-6 py-2 font-medium
                ${isFormValid 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
                transition-all duration-300 disabled:opacity-50
              `}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sharing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Share Anonymously</span>
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Privacy Notice */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-start gap-3 text-xs text-muted-foreground">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
            <div className="space-y-1">
              <p className="font-medium">Your privacy is protected:</p>
              <ul className="space-y-0.5 text-muted-foreground/80">
                <li>• No personal information is collected</li>
                <li>• Your IP address is encrypted and cannot be traced back</li>
                <li>• Posts cannot be edited or deleted to maintain anonymity</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 