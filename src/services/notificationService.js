import { supabase } from '../lib/supabase';

/** Create a notification for a user */
export async function createNotification(userId, type, title, message = '', meta = {}) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, message, meta })
      .select()
      .single();
    if (error) console.warn('[notificationService] create error:', error.message);
    return data;
  } catch (err) {
    console.warn('[notificationService] create catch:', err.message);
    return null;
  }
}

/** Get all notifications for a user */
export async function getNotifications(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return [];
    return data || [];
  } catch (err) {
    return [];
  }
}

/** Count unread notifications */
export async function getUnreadCount(userId) {
  if (!userId) return 0;
  try {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  } catch (err) {
    return 0;
  }
}

/** Mark a notification as read */
export async function markAsRead(notificationId) {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  } catch (err) {
    console.warn('[notificationService] markAsRead error:', err.message);
  }
}

/** Mark all notifications as read */
export async function markAllAsRead(userId) {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  } catch (err) {
    console.warn('[notificationService] markAllAsRead error:', err.message);
  }
}

/**
 * Subscribe to real-time notifications for a user.
 * Returns the subscription channel (call .unsubscribe() to clean up).
 */
export function subscribeToNotifications(userId, onNewNotification) {
  try {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onNewNotification(payload.new)
      )
      .subscribe();
    return channel;
  } catch (err) {
    console.warn('[notificationService] subscribeToNotifications error:', err.message);
    return null;
  }
}
