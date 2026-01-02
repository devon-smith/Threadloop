import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type MessagePreview = {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  listing: {
    id: string;
    title: string;
    imageUrl?: string;
    price?: number;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
    isFromMe: boolean;
    read: boolean;
  };
  unreadCount: number;
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
};

// Mock data for conversations
const MOCK_CONVERSATIONS: MessagePreview[] = [
  {
    id: '1',
    otherUser: {
      id: 'user1',
      displayName: 'Sarah Chen',
      avatarUrl: undefined,
    },
    listing: {
      id: 'listing1',
      title: 'Vintage Levi\'s 501 Jeans',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=100',
      price: 45,
    },
    lastMessage: {
      content: 'Hey! Are these still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      isFromMe: false,
      read: false,
    },
    unreadCount: 2,
  },
  {
    id: '2',
    otherUser: {
      id: 'user2',
      displayName: 'Marcus Williams',
      avatarUrl: undefined,
    },
    listing: {
      id: 'listing2',
      title: 'Nike Air Force 1s Size 10',
      imageUrl: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=100',
      price: 80,
    },
    lastMessage: {
      content: 'Can we meet at the Main Quad tomorrow at 3pm?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isFromMe: true,
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: '3',
    otherUser: {
      id: 'user3',
      displayName: 'Emma Rodriguez',
      avatarUrl: undefined,
    },
    listing: {
      id: 'listing3',
      title: 'Patagonia Fleece Jacket',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100',
      price: 65,
    },
    lastMessage: {
      content: 'Thanks for the swap! Left you a 5-star review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isFromMe: false,
      read: true,
    },
    unreadCount: 0,
  },
];

// Mock messages for a conversation
const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'user1',
    content: 'Hi! I saw your listing for the Levi\'s jeans',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true,
  },
  {
    id: 'm2',
    senderId: 'me',
    content: 'Hey! Yes, they\'re still available. They\'re in great condition, only worn a few times.',
    timestamp: new Date(Date.now() - 1000 * 60 * 55),
    read: true,
  },
  {
    id: 'm3',
    senderId: 'user1',
    content: 'Awesome! What\'s the waist size?',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: true,
  },
  {
    id: 'm4',
    senderId: 'me',
    content: 'They\'re a 28" waist, 30" length. Fits like a true size.',
    timestamp: new Date(Date.now() - 1000 * 60 * 40),
    read: true,
  },
  {
    id: 'm5',
    senderId: 'user1',
    content: 'Perfect! Would you do $40?',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    read: false,
  },
  {
    id: 'm6',
    senderId: 'user1',
    content: 'Hey! Are these still available?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
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
  const [conversations] = useState<MessagePreview[]>(MOCK_CONVERSATIONS);
  const [messages] = useState<Message[]>(MOCK_MESSAGES);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // In a real app, this would send to the backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
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
            {conversations.length === 0 ? (
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
                      <span className="conversation-time">{formatTimestamp(convo.lastMessage.timestamp)}</span>
                    </div>
                    <div className="conversation-listing">
                      {convo.listing.title}
                    </div>
                    <div className="conversation-last-message">
                      {convo.lastMessage.isFromMe && <span className="you-prefix">You: </span>}
                      {convo.lastMessage.content}
                    </div>
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
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.senderId === 'me' ? 'sent' : 'received'}`}
                    >
                      <p>{msg.content}</p>
                      <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                    </div>
                  ))}
                </div>

                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                  />
                  <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    Send
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
