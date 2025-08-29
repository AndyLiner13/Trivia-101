import React, { useState } from 'react';
import { Mail, Trash2, Star, ArrowLeft, Home } from 'lucide-react';
import { ListItem } from '../shared/ListItem';
import { SectionHeader } from '../shared/SectionHeader';
import { useFavorites } from '../shared/FavoritesContext';
import { useNotifications } from '../shared/NotificationsContext';

interface Email {
  id: number;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
}

// Simple markdown renderer component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    // Convert markdown to HTML-like structure using React elements
    const lines = text.split('\\\\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Empty lines create line breaks
      if (line.trim() === '') {
        elements.push(<br key={key++} />);
        continue;
      }
      
      // Headers
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={key++} className="font-medium text-lg mt-3 mb-1">
            {line.substring(3)}
          </h3>
        );
        continue;
      }
      
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={key++} className="font-medium text-xl mt-3 mb-1">
            {line.substring(2)}
          </h2>
        );
        continue;
      }
      
      // List items
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const content = line.substring(2);
        elements.push(
          <div key={key++} className="flex items-start mb-0.5">
            <span className="mr-2">•</span>
            <span>{processInlineMarkdown(content)}</span>
          </div>
        );
        continue;
      }
      
      // Regular paragraphs
      elements.push(
        <p key={key++} className="mb-1">
          {processInlineMarkdown(line)}
        </p>
      );
    }
    
    return elements;
  };
  
  const processInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let key = 0;
    
    // Process bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(processItalics(beforeText, key++));
      }
      
      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-medium">
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      parts.push(processItalics(remainingText, key++));
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  const processItalics = (text: string, key: number): React.ReactNode => {
    const italicRegex = /\*(.*?)\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = italicRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add italic text
      parts.push(
        <em key={`italic-${key}-${match.index}`} className="italic">
          {match[1]}
        </em>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? <span key={key}>{parts}</span> : text;
  };
  
  return <div className="leading-snug">{renderMarkdown(content)}</div>;
};

const initialEmails: Email[] = [
  {
    id: 1,
    sender: 'Sarah Wilson',
    senderEmail: 'sarah.wilson@company.com',
    subject: 'Project Update - Q4 Review',
    preview: 'Hi team, I wanted to share the latest updates on our Q4 review process...',
    body: 'Hi team,\\\\n**I wanted to share the latest updates on our Q4 review process.** We have made significant progress on all major milestones and I am pleased to report that we are **on track to meet our goals**.\\\\n## Key highlights:\\\\n- Revenue targets exceeded by **15%**\\\\n- Customer satisfaction up **23%**\\\\n- New feature rollout completed successfully\\\\nPlease let me know if you have any questions.\\\\n*Best regards,*\\\\nSarah',
    timestamp: '10:30 AM',
    isRead: false,
    avatar: '👩‍💼'
  },
  {
    id: 2,
    sender: 'Alex Chen',
    senderEmail: 'alex.chen@design.co',
    subject: 'Design System Documentation',
    preview: 'Hey! I have finished updating the design system docs. The new components...',
    body: '**Hey!**\\\\nI have finished updating the design system docs. The new components are now fully documented with examples and usage guidelines.\\\\n## What is new:\\\\n- **Button component** variants\\\\n- **Form input** specifications\\\\n- **Color palette** updates\\\\n- **Typography** scale\\\\nThe documentation is *live and ready* for the team to use. Let me know if you need any clarifications!\\\\n*Cheers,*\\\\nAlex',
    timestamp: '9:15 AM',
    isRead: false,
    avatar: '👨‍🎨'
  },
  {
    id: 3,
    sender: 'Netflix',
    senderEmail: 'info@netflix.com',
    subject: 'New shows added to your list',
    preview: 'Check out the latest additions to Netflix. We think you will love these...',
    body: 'Check out the latest additions to Netflix. We think you will love these **new shows and movies!**\\\\n## New This Week:\\\\n- **The Crown** - Season 6\\\\n- **Stranger Things** - Behind the Scenes\\\\n- **Documentary:** Ocean Mysteries\\\\n- **Comedy Special:** Stand-up Night\\\\n*Happy watching!*\\\\nThe Netflix Team',
    timestamp: 'Yesterday',
    isRead: true,
    avatar: '🎬'
  },
  {
    id: 4,
    sender: 'Mom',
    senderEmail: 'mom@family.com',
    subject: 'Dinner this Sunday?',
    preview: 'Hi honey! Are you free for dinner this Sunday? Dad and I were thinking...',
    body: '**Hi honey!**\\\\nAre you free for dinner this Sunday? Dad and I were thinking of making your **favorite lasagna** and would love to have you over.\\\\nWe could eat around **6 PM** if that works for you. Let me know!\\\\nAlso, do not forget to bring that *book you mentioned* last time.\\\\n*Love you!*\\\\nMom ❤️',
    timestamp: 'Yesterday',
    isRead: true,
    avatar: '👩‍🦳'
  },
  {
    id: 5,
    sender: 'GitHub',
    senderEmail: 'noreply@github.com',
    subject: '[Security] New sign-in from MacBook Pro',
    preview: 'We noticed a new sign-in to your account from a MacBook Pro...',
    body: 'We noticed a **new sign-in** to your account from a MacBook Pro.\\\\n## Details:\\\\n- **Device:** MacBook Pro\\\\n- **Location:** San Francisco, CA\\\\n- **Time:** Dec 28, 2024 at 8:42 AM PST\\\\n- **IP Address:** 192.168.1.100\\\\nIf this was you, *no action is needed*. If you do not recognize this activity, please **secure your account immediately**.\\\\nThanks,\\\\nThe GitHub Team',
    timestamp: '2 days ago',
    isRead: false,
    avatar: '🐙'
  },
  {
    id: 6,
    sender: 'John Davis',
    senderEmail: 'john.davis@client.com',
    subject: 'Meeting Rescheduled',
    preview: 'Hope you are doing well! I need to reschedule our meeting...',
    body: '**Hope you are doing well!**\\\\nI need to reschedule our meeting originally planned for **Friday**. Something urgent came up and I will not be available.\\\\nWould **Monday** or **Tuesday** next week work for you? I am flexible with the time.\\\\n*Sorry for the short notice!*\\\\nBest,\\\\nJohn',
    timestamp: '3 days ago',
    isRead: true,
    avatar: '👨‍💼'
  }
];

interface MailAppProps {
  onNavigateToHome?: () => void;
  onNavigateBack?: () => void;
}

export function MailApp({ onNavigateToHome, onNavigateBack }: MailAppProps) {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { notificationsEnabled } = useNotifications();

  const markAsRead = (id: number) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === id ? { ...email, isRead: true } : email
      )
    );
  };

  const toggleStar = (id: number) => {
    toggleFavorite('email', id);
  };

  const deleteEmail = (id: number) => {
    setEmails(prev => prev.filter(email => email.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const openEmail = (email: Email) => {
    markAsRead(email.id);
    setSelectedEmail(email);
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (selectedEmail) {
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
            <button
              onClick={() => setSelectedEmail(null)}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <ArrowLeft style={{ 
                width: '24px', 
                height: '24px' 
              }} />
            </button>
          </div>
          <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>MeMail</h1>
        </div>

        {/* Email Header */}
        <div className="bg-white border-b" style={{ 
          padding: 'clamp(0.75rem, 4cqw, 1rem)',
          marginTop: '54px'
        }}>
          {/* Subject and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 style={{ fontSize: 'clamp(1rem, 5cqw, 1.25rem)' }} className="font-medium">
                {selectedEmail.subject}
              </h2>
            </div>
            <div className="flex" style={{ gap: 'clamp(0.25rem, 2cqw, 0.5rem)' }}>
              <button
                onClick={() => toggleStar(selectedEmail.id)}
                className="hover:bg-gray-100 rounded-lg"
                style={{ padding: 'clamp(0.25rem, 2cqw, 0.5rem)' }}
              >
                <Star 
                  className={isFavorite('email', selectedEmail.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                  style={{ 
                    width: 'clamp(1rem, 5cqw, 1.25rem)', 
                    height: 'clamp(1rem, 5cqw, 1.25rem)' 
                  }} 
                />
              </button>
              <button
                onClick={() => deleteEmail(selectedEmail.id)}
                className="text-red-500 hover:bg-gray-100 rounded-lg"
                style={{ padding: 'clamp(0.25rem, 2cqw, 0.5rem)' }}
              >
                <Trash2 style={{ 
                  width: 'clamp(1rem, 5cqw, 1.25rem)', 
                  height: 'clamp(1rem, 5cqw, 1.25rem)' 
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto" style={{ 
          padding: 'clamp(1rem, 6cqw, 1.5rem)' 
        }}>
          {/* Sender Info - Now above content */}
          <div className="flex items-center" style={{ 
            gap: 'clamp(0.5rem, 3cqw, 0.75rem)',
            marginBottom: 'clamp(1rem, 5cqw, 1.5rem)'
          }}>
            <div className="bg-blue-500 rounded-xl flex items-center justify-center text-white" style={{ 
              width: 'clamp(1.5rem, 8cqw, 2rem)', 
              height: 'clamp(1.5rem, 8cqw, 2rem)' 
            }}>
              {selectedEmail.avatar || selectedEmail.sender.charAt(0)}
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)' }}>
                {selectedEmail.sender}
              </p>
            </div>
          </div>

          <div style={{ fontSize: 'clamp(1rem, 5cqw, 1.125rem)' }}>
            <MarkdownRenderer content={selectedEmail.body} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col" style={{ paddingTop: '54px' }}>
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
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>MeMail</h1>
      </div>

      {/* Header */}
      <SectionHeader
        title={notificationsEnabled ? `${unreadCount} Unread MeMails` : `${unreadCount} Unread MeMails (Notifications Off)`}
      />
      
      {!notificationsEnabled && (
        <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-700" style={{ padding: 'clamp(0.75rem, 4cqw, 1rem)' }}>
          <p style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)' }}>
            📵 Email notifications are disabled. You won't receive alerts for new emails.
          </p>
        </div>
      )}

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500" style={{ 
            padding: 'clamp(1rem, 6cqw, 2rem)' 
          }}>
            <Mail className="mx-auto text-gray-300" style={{ 
              width: 'clamp(3rem, 16cqw, 4rem)', 
              height: 'clamp(3rem, 16cqw, 4rem)',
              marginBottom: 'clamp(1rem, 6cqw, 1.5rem)'
            }} />
            <h3 style={{ 
              fontSize: 'clamp(1rem, 6cqw, 1.25rem)',
              marginBottom: 'clamp(0.5rem, 3cqw, 0.75rem)'
            }}>No Emails</h3>
            <p className="text-center" style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)' }}>
              Your inbox is empty. New emails will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y">
            {emails.map((email) => (
              <ListItem
                key={email.id}
                leftContent={email.avatar || email.sender.charAt(0)}
                title={
                  <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 2cqw, 0.75rem)' }}>
                    <span>{email.sender}</span>
                    {!email.isRead && (
                      <div 
                        className="bg-blue-500 rounded-full flex-shrink-0"
                        style={{ 
                          width: 'clamp(0.375rem, 2cqw, 0.5rem)', 
                          height: 'clamp(0.375rem, 2cqw, 0.5rem)' 
                        }}
                      />
                    )}
                  </div>
                }
                subtitle={email.subject}
                rightContent={(
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email.id);
                    }}
                    className="rounded-lg"
                    style={{ padding: 'clamp(0.5rem, 3cqw, 0.75rem)' }}
                  >
                    <Star 
                      className={isFavorite('email', email.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                      style={{ 
                        width: 'clamp(1.25rem, 6cqw, 1.5rem)', 
                        height: 'clamp(1.25rem, 6cqw, 1.5rem)' 
                      }} 
                    />
                  </button>
                )}
                onClick={() => openEmail(email)}
                isUnread={!email.isRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}