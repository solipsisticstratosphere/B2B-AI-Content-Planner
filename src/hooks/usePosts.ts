import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Post, Platform } from '@/lib/types'
import { useAuth } from './useAuth'

interface CreatePostInput {
  content: string
  platform: Platform
  scheduled_for: string
  status?: 'draft' | 'scheduled' | 'published'
  ai_prompt?: string | null
}

interface UpdatePostInput {
  content?: string
  platform?: Platform
  scheduled_for?: string
  status?: 'draft' | 'scheduled' | 'published'
}

function sortBySchedule(arr: Post[]): Post[] {
  return [...arr].sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for))
}

export function usePosts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  // Ref kept in sync so Realtime handler never reads stale state
  const postsRef = useRef<Post[]>([])
  // IDs of mutations we initiated — Realtime echo for these won't show a toast
  const localPending = useRef(new Set<string>())

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const fetchPosts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })
    setPosts((data as Post[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Realtime: subscribe to postgres_changes for this user's posts
  useEffect(() => {
    if (!user) return

    // Unique name per mount so React StrictMode's double-invoke doesn't reuse
    // an already-subscribed channel and throw "cannot add callbacks after subscribe()".
    const channel = supabase
      .channel(`posts:${user.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const { eventType } = payload

          if (eventType === 'INSERT') {
            const incoming = payload.new as Post
            // Already in state (our own insert) — skip
            if (
              localPending.current.has(incoming.id) ||
              postsRef.current.some((p) => p.id === incoming.id)
            ) {
              localPending.current.delete(incoming.id)
              return
            }
            setPosts((prev) => sortBySchedule([...prev, incoming]))
            toast.success('Calendar updated', { id: 'realtime-change' })
          } else if (eventType === 'UPDATE') {
            const incoming = payload.new as Post
            const isLocal = localPending.current.has(incoming.id)
            localPending.current.delete(incoming.id)
            // Always sync to authoritative server value
            setPosts((prev) =>
              sortBySchedule(prev.map((p) => (p.id === incoming.id ? incoming : p)))
            )
            if (!isLocal) toast.success('Calendar updated', { id: 'realtime-change' })
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            const isLocal = localPending.current.has(deletedId)
            localPending.current.delete(deletedId)
            if (!isLocal) {
              setPosts((prev) => prev.filter((p) => p.id !== deletedId))
              toast.success('Calendar updated', { id: 'realtime-change' })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function createPost(input: CreatePostInput): Promise<Post | null> {
    if (!user) return null
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    const post = data as Post
    // Mark the ID so the incoming INSERT echo is ignored
    localPending.current.add(post.id)
    setTimeout(() => localPending.current.delete(post.id), 5000)
    setPosts((prev) => sortBySchedule([...prev, post]))
    return post
  }

  async function updatePost(id: string, input: UpdatePostInput): Promise<void> {
    localPending.current.add(id)
    const { data, error } = await supabase
      .from('posts')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      localPending.current.delete(id)
      throw error
    }
    const updated = data as Post
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  async function deletePost(id: string): Promise<void> {
    localPending.current.add(id)
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      localPending.current.delete(id)
      throw error
    }
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  // Optimistic move: updates local state immediately, rolls back on Supabase error.
  async function movePost(id: string, newScheduledFor: string): Promise<void> {
    localPending.current.add(id)
    const snapshot = posts
    setPosts((prev) =>
      sortBySchedule(prev.map((p) => (p.id === id ? { ...p, scheduled_for: newScheduledFor } : p)))
    )
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_for: newScheduledFor })
      .eq('id', id)
    if (error) {
      localPending.current.delete(id)
      setPosts(snapshot)
      throw error
    }
  }

  return { posts, loading, refetch: fetchPosts, createPost, updatePost, deletePost, movePost }
}
