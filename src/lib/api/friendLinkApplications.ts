import { supabase } from '@/integrations/supabase/client'

export interface FriendLinkApplication {
  id: string
  name: string
  url: string
  description: string | null
  logo_url: string | null
  contact_email: string
  contact_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export type CreateApplicationInput = {
  name: string
  url: string
  description?: string | null
  logo_url?: string | null
  contact_email: string
  contact_name?: string | null
}

export async function submitFriendLinkApplication(application: CreateApplicationInput): Promise<FriendLinkApplication | null> {
  const { data, error } = await supabase
    .from('friend_link_applications')
    .insert(application)
    .select()
    .single()

  if (error) {
    console.error('Error submitting application:', error)
    throw error
  }

  return data as FriendLinkApplication
}

export async function fetchApplications(): Promise<FriendLinkApplication[]> {
  const { data, error } = await supabase
    .from('friend_link_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  return data as FriendLinkApplication[]
}

export async function approveApplication(id: string, userId: string): Promise<void> {
  // First get the application data
  const { data: application, error: fetchError } = await supabase
    .from('friend_link_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) {
    throw new Error('Application not found')
  }

  // Create the friend link
  const { error: createError } = await supabase
    .from('friend_links')
    .insert({
      name: application.name,
      url: application.url,
      description: application.description,
      logo_url: application.logo_url,
      is_active: true,
      sort_order: 0
    })

  if (createError) {
    throw createError
  }

  // Update application status
  const { error: updateError } = await supabase
    .from('friend_link_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId
    })
    .eq('id', id)

  if (updateError) {
    throw updateError
  }
}

export async function rejectApplication(id: string, userId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('friend_link_applications')
    .update({
      status: 'rejected',
      reject_reason: reason || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId
    })
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from('friend_link_applications')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}
