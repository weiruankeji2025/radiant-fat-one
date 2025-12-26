import { supabase } from '@/integrations/supabase/client'

export interface FriendLink {
  id: string
  name: string
  url: string
  description: string | null
  logo_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function fetchFriendLinks(): Promise<FriendLink[]> {
  const { data, error } = await supabase
    .from('friend_links')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching friend links:', error)
    return []
  }

  return data as FriendLink[]
}

export async function createFriendLink(link: Omit<FriendLink, 'id' | 'created_at' | 'updated_at'>): Promise<FriendLink | null> {
  const { data, error } = await supabase
    .from('friend_links')
    .insert(link)
    .select()
    .single()

  if (error) {
    console.error('Error creating friend link:', error)
    throw error
  }

  return data as FriendLink
}

export async function updateFriendLink(id: string, updates: Partial<FriendLink>): Promise<FriendLink | null> {
  const { data, error } = await supabase
    .from('friend_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating friend link:', error)
    throw error
  }

  return data as FriendLink
}

export async function deleteFriendLink(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_links')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting friend link:', error)
    throw error
  }

  return true
}
