import { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import PostCard from '@/components/PostCard'
import CreatePostForm from '@/components/CreatePostForm'
import ThemeToggle from '@/components/ThemeToggle'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from '@/components/ui/toaster'
import { Sparkles, Shield, Lock } from 'lucide-react'

function AppContent() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/posts')
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    fetchPosts()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Reveal
                  </h1>
                  <p className="text-sm text-muted-foreground">Anonymous secrets, safely shared</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>100% Anonymous</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Share your thoughts anonymously</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Your secrets are
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"> safe</span> here
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Share your deepest thoughts, confessions, and secrets in a completely anonymous and judgment-free environment. 
              Your identity remains private, always.
            </p>
          </div>

          {/* Create Post Section */}
          <div className="max-w-2xl mx-auto mb-16">
            <CreatePostForm onPostCreated={handlePostCreated} />
          </div>

          {/* Posts Section */}
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  Recent Secrets
                </h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-sm bg-muted/50 backdrop-blur-sm border border-border/50"
                  >
                    {loading ? 'Loading...' : `${posts.length} anonymous ${posts.length === 1 ? 'secret' : 'secrets'}`}
                  </Badge>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-muted border-t-blue-500"></div>
                  <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-6 text-muted-foreground font-medium">Loading recent secrets...</p>
              </div>
            ) : posts.length === 0 ? (
              <Card className="text-center py-16 bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No secrets yet
                  </h3>
                  <p className="text-muted-foreground">
                    Be the first to share an anonymous secret with the community!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onUpdate={fetchPosts}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-24 border-t border-border/50 bg-muted/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-foreground">Privacy Protected</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                All posts are completely anonymous and cannot be traced back to you. 
                We use advanced encryption and IP hashing to ensure your privacy. 
                Please be respectful and avoid sharing harmful content.
              </p>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span>No tracking • No accounts • No logs</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
