import React, { useState, useEffect } from 'react';
import { Send, ArrowLeft, MoreVertical, MessageCircle, Home } from 'lucide-react';
import { SectionHeader } from '../shared/SectionHeader';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: 'Mom',
    lastMessage: 'Do not forget dinner tonight!',
    timestamp: '2:30 PM',
    unread: 2,
    avatar: '👩‍💼'
  },
  {
    id: 2,
    name: 'Alex',
    lastMessage: 'See you at the meeting',
    timestamp: '1:15 PM',
    unread: 0,
    avatar: '👨‍💻'
  },
  {
    id: 3,
    name: 'Sarah',
    lastMessage: 'Thanks for helping!',
    timestamp: '12:45 PM',
    unread: 1,
    avatar: '👩‍🎨'
  },
];

const sampleMessages: Message[] = [
  {
    id: 1,
    text: 'Hey! How are you doing?',
    sender: 'contact',
    timestamp: '2:28 PM'
  },
  {
    id: 2,
    text: 'I am good, thanks! How about you?',
    sender: 'user',
    timestamp: '2:29 PM'
  },
  {
    id: 3,
    text: 'Do not forget dinner tonight!',
    sender: 'contact',
    timestamp: '2:30 PM'
  },
];

// Pre-written message templates organized by category
const messageTemplates = [
  {
    category: 'Quick Responses',
    messages: [
      'Yes',
      'No',
      'Thanks!',
      'You too!',
      'Sounds good',
      'On my way',
      'Running late',
      'Almost there'
    ]
  },
  {
    category: 'Greetings',
    messages: [
      'Hello!',
      'Good morning',
      'Good evening',
      'How are you?',
      'Hope you are well',
      'Long time no see!'
    ]
  },
  {
    category: 'Plans & Meet Up',
    messages: [
      'What time works for you?',
      'Let us meet up soon',
      'See you later',
      'Are you free today?',
      'Rain check?',
      'Can we reschedule?'
    ]
  },
  {
    category: 'Work & Business',
    messages: [
      'Got it, thanks',
      'Will get back to you',
      'In a meeting, call later',
      'Checking now',
      'Please send details',
      'Meeting confirmed'
    ]
  },
  {
    category: 'Casual',
    messages: [
      'What is up?',
      'How is it going?',
      'Miss you!',
      'Thinking of you',
      'Have a great day!',
      'Take care'
    ]
  }
];

interface MessagesAppProps {
  navigationData?: {
    contactId?: number;
    contactName?: string;
    contactPhone?: string;
    contactAvatar?: string;
    returnTo?: string;
  } | null;
  onNavigateToHome?: () => void;
  onNavigateToApp?: (app: string, data?: any) => void;
}

export function MessagesApp({ navigationData, onNavigateToHome, onNavigateToApp }: MessagesAppProps) {
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [selectedMessageTemplate, setSelectedMessageTemplate] = useState<string | null>(null);

  const openChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('chat');
  };

  // If we have contact data, open chat with that contact immediately
  useEffect(() => {
    if (navigationData?.contactName) {
      // Check if conversation already exists for this contact
      const existingConversation = conversations.find(conv => 
        conv.name === navigationData.contactName
      );
      
      if (existingConversation) {
        openChat(existingConversation);
      } else {
        // Create new conversation for this contact
        const newConversation: Conversation = {
          id: Date.now(),
          name: navigationData.contactName,
          lastMessage: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          avatar: navigationData.contactAvatar || '👤'
        };
        openChat(newConversation);
        // Set empty messages for new conversation
        setMessages([]);
      }
    }
  }, [navigationData]);

  const sendMessage = (messageText: string) => {
    if (messageText.trim()) {
      const message: Message = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, message]);
      setSelectedMessageTemplate(null);
    }
  };

  if (currentView === 'chat' && selectedConversation) {
    return (
      <div className="h-full bg-white flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
          padding: '12px 16px'
        }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <button
              onClick={onNavigateToHome}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <Home style={{ 
                width: '24px', 
                height: '24px' 
              }} />
            </button>
            <button
              onClick={() => {
                if (navigationData?.returnTo && onNavigateToApp) {
                  // If we came from contacts, go back there
                  onNavigateToApp('contacts');
                } else {
                  setCurrentView('list');
                }
              }}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <ArrowLeft style={{ 
                width: '24px', 
                height: '24px' 
              }} />
            </button>
          </div>
          <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Messages</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ 
          padding: 'clamp(0.75rem, 4cqw, 1rem)', 
          gap: 'clamp(0.75rem, 4cqw, 1rem)',
          paddingTop: 'clamp(1rem, 5cqw, 1.5rem)',
          marginTop: '54px'
        }}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ marginTop: index > 0 ? 'clamp(0.75rem, 4cqw, 1rem)' : '0' }}
            >
              <div
                className={`rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                style={{ 
                  maxWidth: 'clamp(12rem, 75cqw, 18rem)',
                  padding: 'clamp(0.375rem, 2cqw, 0.5rem) clamp(0.75rem, 4cqw, 1rem)' 
                }}
              >
                <p style={{ fontSize: 'clamp(1rem, 4.5cqw, 1.125rem)' }}>{message.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Templates */}
        <div className="border-t bg-gray-50" style={{ 
          padding: 'clamp(0.75rem, 4cqw, 1rem)',
          maxHeight: 'clamp(12rem, 40cqh, 16rem)'
        }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle style={{ 
              width: 'clamp(0.875rem, 4cqw, 1rem)', 
              height: 'clamp(0.875rem, 4cqw, 1rem)' 
            }} className="text-gray-500" />
            <span className="text-gray-600" style={{ fontSize: '0.875em' }}>
              Choose a message to send:
            </span>
          </div>
          
          <div className="overflow-y-auto space-y-4" style={{ 
            maxHeight: 'clamp(10rem, 35cqh, 12rem)' 
          }}>
            {messageTemplates.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <SectionHeader
                  title={category.category}
                />
                <div className="grid grid-cols-1 gap-2" style={{ padding: 'clamp(0.5rem, 3cqw, 0.75rem)' }}>
                  {category.messages.map((message, messageIndex) => (
                    <button
                      key={`${categoryIndex}-${messageIndex}`}
                      onClick={() => sendMessage(message)}
                      className={`text-left rounded-lg border transition-colors ${
                        selectedMessageTemplate === message
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ 
                        padding: 'clamp(0.75rem, 4cqw, 1rem)',
                        fontSize: 'clamp(0.875rem, 4cqw, 1rem)' 
                      }}
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Navbar */}
      <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
        padding: '12px 16px'
      }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={onNavigateToHome}
            className="rounded-lg" 
            style={{ padding: '4px' }}
          >
            <Home style={{ 
              width: '24px', 
              height: '24px' 
            }} />
          </button>
        </div>
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Messages</h1>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: '54px' }}>
        <div className="divide-y">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => openChat(conversation)}
              className="w-full flex items-center text-left"
              style={{ 
                padding: 'clamp(0.75rem, 4cqw, 1rem)', 
                gap: 'clamp(0.5rem, 3cqw, 0.75rem)' 
              }}
            >
              <div className="bg-blue-500 rounded-xl flex items-center justify-center text-white" style={{ 
                width: 'clamp(2.5rem, 12cqw, 3rem)', 
                height: 'clamp(2.5rem, 12cqw, 3rem)',
                fontSize: '1.125em'
              }}>
                {conversation.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ marginBottom: 'clamp(0.125rem, 1cqw, 0.25rem)' }}>
                  <h3 className="font-medium text-gray-900">{conversation.name}</h3>
                </div>
                <p className="text-gray-600 truncate" style={{ fontSize: '0.875em' }}>{conversation.lastMessage}</p>
              </div>
              {conversation.unread > 0 && (
                <div className="bg-blue-500 rounded-xl flex items-center justify-center" style={{ 
                  width: 'clamp(1rem, 5cqw, 1.25rem)', 
                  height: 'clamp(1rem, 5cqw, 1.25rem)' 
                }}>
                  <span className="text-white" style={{ fontSize: '0.75em' }}>{conversation.unread}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}