import { supabase, DbConversation, DbMessage } from './supabase';

export type ConversationWithDetails = {
  id: string;
  listing: {
    id: string;
    title: string;
    imageUrl?: string;
    price?: number;
  };
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    timestamp: Date;
    isFromMe: boolean;
    read: boolean;
  };
  unreadCount: number;
  updatedAt: Date;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
};

// Fetch all conversations for a user
export async function fetchConversations(userId: string): Promise<ConversationWithDetails[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings (
        id,
        title,
        price,
        listing_images (storage_url, position)
      ),
      buyer:users!conversations_buyer_id_fkey (id, display_name, avatar_url),
      seller:users!conversations_seller_id_fkey (id, display_name, avatar_url),
      messages (
        id,
        sender_id,
        content,
        read,
        created_at
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return (data || []).map(conv => {
    const isBuyer = conv.buyer_id === userId;
    const otherUser = isBuyer ? conv.seller : conv.buyer;
    const messages = conv.messages || [];
    const lastMsg = messages.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const unreadCount = messages.filter((m: any) =>
      !m.read && m.sender_id !== userId
    ).length;

    const listingImage = (conv.listing?.listing_images || [])
      .sort((a: any, b: any) => a.position - b.position)[0];

    return {
      id: conv.id,
      listing: {
        id: conv.listing?.id || '',
        title: conv.listing?.title || 'Unknown Listing',
        imageUrl: listingImage?.storage_url,
        price: conv.listing?.price || undefined
      },
      otherUser: {
        id: otherUser?.id || '',
        displayName: otherUser?.display_name || 'Unknown User',
        avatarUrl: otherUser?.avatar_url || undefined
      },
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        timestamp: new Date(lastMsg.created_at),
        isFromMe: lastMsg.sender_id === userId,
        read: lastMsg.read
      } : undefined,
      unreadCount,
      updatedAt: new Date(conv.updated_at)
    };
  });
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).map(msg => ({
    id: msg.id,
    senderId: msg.sender_id,
    content: msg.content,
    timestamp: new Date(msg.created_at),
    read: msg.read
  }));
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      read: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  // Update conversation's updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: data.id,
    senderId: data.sender_id,
    content: data.content,
    timestamp: new Date(data.created_at),
    read: data.read
  };
}

// Start a new conversation (when contacting seller)
export async function startConversation(
  listingId: string,
  buyerId: string,
  sellerId: string,
  initialMessage: string
): Promise<{ conversationId: string; message: Message } | null> {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (existing) {
    // Add message to existing conversation
    const message = await sendMessage(existing.id, buyerId, initialMessage);
    if (message) {
      return { conversationId: existing.id, message };
    }
    return null;
  }

  // Create new conversation
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      status: 'active'
    })
    .select()
    .single();

  if (convError) {
    console.error('Error creating conversation:', convError);
    return null;
  }

  // Add the initial message
  const message = await sendMessage(conv.id, buyerId, initialMessage);
  if (!message) {
    return null;
  }

  return { conversationId: conv.id, message };
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);
}

// Subscribe to new messages (real-time)
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        const msg = payload.new as DbMessage;
        onMessage({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          read: msg.read
        });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
