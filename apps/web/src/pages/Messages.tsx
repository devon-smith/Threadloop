import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  ConversationWithDetails,
  Message
} from '../lib/messages';

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    async function loadConversations() {
      setLoading(true);
      const data = await fetchConversations(user.id);
      setConversations(data);
      setLoading(false);
    }

    loadConversations();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !user) return;

    async function loadMessages() {
      const data = await fetchMessages(selectedConversation);
      setMessages(data);

      // Mark messages as read
      await markMessagesAsRead(selectedConversation, user.id);

      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation ? { ...c, unreadCount: 0 } : c
        )
      );
    }

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(selectedConversation, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      if (newMsg.senderId !== user.id) {
        markMessagesAsRead(selectedConversation, user.id);
      }
    });

    return unsubscribe;
  }, [selectedConversation, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p>Please log in to view your messages</p>
          <button className="cta-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const selectedConvo = conversations.find(c => c.id === selectedConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const sent = await sendMessage(selectedConversation, user.id, newMessage.trim());
    setSending(false);

    if (sent) {
      setMessages(prev => [...prev, sent]);
      setNewMessage('');

      // Update last message in conversations list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation
            ? {
                ...c,
                lastMessage: {
                  content: sent.content,
                  timestamp: sent.timestamp,
                  isFromMe: true,
                  read: false
                },
                updatedAt: sent.timestamp
              }
            : c
        )
      );
    }
  };

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <h1>Messages {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}</h1>
          <span>Chat with buyers and sellers</span>
        </div>

        <div className="messages-container">
          {/* Conversations List */}
          <div className="conversations-list">
            {loading ? (
              <div className="empty-state-small">
                <p>Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-state-small">
                <p>No messages yet</p>
                <p className="meta">Start browsing to find items and message sellers!</p>
              </div>
            ) : (
              conversations.map(convo => (
                <div
                  key={convo.id}
                  className={`conversation-preview ${selectedConversation === convo.id ? 'selected' : ''} ${convo.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(convo.id)}
                >
                  <div className="conversation-avatar">
                    {convo.otherUser.avatarUrl ? (
                      <img src={convo.otherUser.avatarUrl} alt={convo.otherUser.displayName} />
                    ) : (
                      <span>{convo.otherUser.displayName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <span className="conversation-name">{convo.otherUser.displayName}</span>
                      {convo.lastMessage && (
                        <span className="conversation-time">
                          {formatTimestamp(convo.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="conversation-listing">
                      {convo.listing.title}
                    </div>
                    {convo.lastMessage && (
                      <div className="conversation-last-message">
                        {convo.lastMessage.isFromMe && <span className="you-prefix">You: </span>}
                        {convo.lastMessage.content}
                      </div>
                    )}
                  </div>
                  {convo.unreadCount > 0 && (
                    <div className="unread-indicator">{convo.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Message Thread */}
          <div className="message-thread">
            {selectedConvo ? (
              <>
                <div className="thread-header">
                  <div className="thread-user-info">
                    <div className="thread-avatar">
                      {selectedConvo.otherUser.avatarUrl ? (
                        <img src={selectedConvo.otherUser.avatarUrl} alt={selectedConvo.otherUser.displayName} />
                      ) : (
                        <span>{selectedConvo.otherUser.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3>{selectedConvo.otherUser.displayName}</h3>
                      <p className="meta">Usually responds within 2 hours</p>
                    </div>
                  </div>
                  <div className="thread-listing-preview">
                    {selectedConvo.listing.imageUrl && (
                      <img src={selectedConvo.listing.imageUrl} alt={selectedConvo.listing.title} />
                    )}
                    <div>
                      <p className="listing-title">{selectedConvo.listing.title}</p>
                      {selectedConvo.listing.price && (
                        <p className="listing-price">${selectedConvo.listing.price}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.length === 0 ? (
                    <div className="empty-state-small">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}
                      >
                        <p>{msg.content}</p>
                        <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-state-small">
                  <p>Select a conversation</p>
                  <p className="meta">Choose a conversation from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
