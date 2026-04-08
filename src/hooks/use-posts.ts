'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPosts, getPost } from '@/lib/api/posts'
import type { Post, PostWithDetails, PostMedia, PostComment } from '@/types/models'
import type { PostFilters } from '@/types/api'

export function usePosts(filters?: PostFilters): {
  posts: PostWithDetails[]
  isLoading: boolean
  error: string | null
  refetch(): Promise<void>
} {
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getPosts(filters)
    if (result.ok) {
      setPosts(result.data)
    } else {
      setError(result.error.userMessage)
    }
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { posts, isLoading, error, refetch: fetch }
}

export function usePost(id: string): {
  post: (Post & { media: PostMedia[]; comments: PostComment[] }) | null
  isLoading: boolean
  error: string | null
  refetch(): Promise<void>
} {
  const [post, setPost] = useState<(Post & { media: PostMedia[]; comments: PostComment[] }) | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getPost(id)
    if (result.ok) {
      setPost(result.data)
    } else {
      setError(result.error.userMessage)
    }
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { post, isLoading, error, refetch: fetch }
}
