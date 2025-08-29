import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Plus,
  ArrowLeft,
  Home,
  Car,
  MessageCircle
} from 'lucide-react';
import { ListItem } from '../shared/ListItem';
import { SectionHeader } from '../shared/SectionHeader';
import { useFavorites } from '../shared/FavoritesContext';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  company?: string;
  address?: string;
  website?: string;
  lastContact?: string;
}

const sampleContacts: Contact[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    phone: '(555) 123-4567',
    email: 'alice.johnson@email.com',
    avatar: '👩‍💼',
    company: 'Tech Corp',
    address: '123 Main St, City',
    website: 'uber:///?client_id=YOUR_CLIENT_ID&action=setPickup&pickup=my_location&dropoff[latitude]=37.7749&dropoff[longitude]=-122.4194',
    lastContact: '2 days ago'
  },
  {
    id: 2,
    name: 'Bob Smith',
    phone: '(555) 234-5678',
    email: 'bob.smith@email.com',
    avatar: '👨‍💻',
    company: 'Design Studio',
    lastContact: '1 week ago'
  },
  {
    id: 3,
    name: 'Carol Davis',
    phone: '(555) 345-6789',
    email: 'carol.davis@email.com',
    avatar: '👩‍🎨',
    company: 'Art Gallery',
    address: '456 Oak Ave, Town',
    website: 'uber:///?client_id=YOUR_CLIENT_ID&action=setPickup&pickup=my_location&dropoff[formatted_address]=456%20Oak%20Ave%2C%20Town',
    lastContact: '3 days ago'
  },
  {
    id: 4,
    name: 'David Wilson',
    phone: '(555) 456-7890',
    avatar: '👨‍🔬',
    company: 'Research Lab',
    lastContact: '1 month ago'
  },
  {
    id: 5,
    name: 'Emma Brown',
    phone: '(555) 567-8901',
    email: 'emma.brown@email.com',
    avatar: '👩‍🏫',
    company: 'University',
    address: '789 Pine St, Village',
    lastContact: '2 weeks ago'
  },
  {
    id: 6,
    name: 'Frank Miller',
    phone: '(555) 678-9012',
    avatar: '👨‍🍳',
    company: 'Restaurant',
    website: 'uber:///?client_id=YOUR_CLIENT_ID&action=setPickup&pickup=my_location&dropoff[formatted_address]=Restaurant%20Location',
    lastContact: '5 days ago'
  }
];

interface ContactsAppProps {
  onNavigateToHome?: () => void;
  onNavigateToApp?: (app: 'phone' | 'messages', data: {
    contactId: number;
    contactName: string;
    contactPhone: string;
    contactAvatar: string;
  }) => void;
  onNavigateBack?: () => void;
}

export function ContactsApp({ onNavigateToHome, onNavigateToApp, onNavigateBack }: ContactsAppProps) {

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState(sampleContacts);
  const { isFavorite, toggleFavorite: toggleFavoriteContext } = useFavorites();

  const toggleFavorite = (contactId: number) => {
    toggleFavoriteContext('contact', contactId);
  };

  const filteredContacts = contacts;

  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const firstLetter = contact.name[0].toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);

  // Contact detail view
  if (selectedContact) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
          padding: 'clamp(0.5rem, 3cqw, 0.875rem) clamp(0.75rem, 4cqw, 1.25rem)'
        }}>
          <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 2cqw, 0.625rem)' }}>
            <button
              onClick={onNavigateToHome}
              className="rounded-lg" 
              style={{ padding: 'clamp(0.125rem, 1cqw, 0.375rem)' }}
            >
              <Home style={{ 
                width: 'clamp(1rem, 6cqw, 1.75rem)', 
                height: 'clamp(1rem, 6cqw, 1.75rem)' 
              }} />
            </button>
            <button
              onClick={() => setSelectedContact(null)}
              className="rounded-lg" 
              style={{ padding: 'clamp(0.125rem, 1cqw, 0.375rem)' }}
            >
              <ArrowLeft style={{ 
                width: 'clamp(1rem, 6cqw, 1.75rem)', 
                height: 'clamp(1rem, 6cqw, 1.75rem)' 
              }} />
            </button>
          </div>
          <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Contacts</h1>
        </div>

        {/* Contact Info - Centered */}
        <div className="flex-1 flex items-center justify-center" style={{ paddingTop: 'clamp(2.5rem, 13.5cqw, 4rem)' }}>
          {/* Profile Section */}
          <div className="flex flex-col items-center justify-center text-center w-full max-w-md" style={{ 
            paddingTop: 'clamp(2rem, 10cqw, 3rem)', 
            paddingBottom: 'clamp(2rem, 10cqw, 3rem)',
            paddingLeft: 'clamp(1rem, 5cqw, 1.5rem)',
            paddingRight: 'clamp(1rem, 5cqw, 1.5rem)'
          }}>
            <div style={{
              width: 'clamp(5rem, 20cqw, 8rem)',
              height: 'clamp(5rem, 20cqw, 8rem)',
              fontSize: 'clamp(2rem, 10cqw, 3.5rem)',
              marginBottom: 'clamp(1rem, 5cqw, 1.5rem)'
            }} className="bg-blue-500 rounded-xl flex items-center justify-center text-white">
              {selectedContact.avatar}
            </div>
            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 8cqw, 2.25rem)',
              marginBottom: 'clamp(1rem, 4cqw, 1.5rem)'
            }} className="font-medium">{selectedContact.name}</h2>
            
            <div className="flex justify-center items-center" style={{ 
              gap: 'clamp(1rem, 5cqw, 1.5rem)',
              marginBottom: 'clamp(1.5rem, 6cqw, 2rem)',
              width: '100%'
            }}>
              <button 
                onClick={() => onNavigateToApp?.('phone', {
                  contactId: selectedContact.id,
                  contactName: selectedContact.name,
                  contactPhone: selectedContact.phone,
                  contactAvatar: selectedContact.avatar
                })}
                style={{
                  width: 'clamp(3.5rem, 12cqw, 4.5rem)',
                  height: 'clamp(3.5rem, 12cqw, 4.5rem)'
                }}
                className="bg-green-500 rounded-xl flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              >
                <Phone style={{ 
                  width: 'clamp(1.5rem, 6cqw, 2rem)', 
                  height: 'clamp(1.5rem, 6cqw, 2rem)' 
                }} />
              </button>

              <button 
                onClick={() => {
                  if (selectedContact.email) {
                    window.location.href = `mailto:${selectedContact.email}`;
                  }
                }}
                style={{
                  width: 'clamp(3.5rem, 12cqw, 4.5rem)',
                  height: 'clamp(3.5rem, 12cqw, 4.5rem)'
                }}
                className="bg-blue-500 rounded-xl flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              >
                <Mail style={{ 
                  width: 'clamp(1.5rem, 6cqw, 2rem)', 
                  height: 'clamp(1.5rem, 6cqw, 2rem)' 
                }} />
              </button>

              <button
                onClick={() => toggleFavorite(selectedContact.id)}
                style={{
                  width: 'clamp(3.5rem, 12cqw, 4.5rem)',
                  height: 'clamp(3.5rem, 12cqw, 4.5rem)'
                }}
                className={`rounded-xl flex items-center justify-center transition-colors ${
                  isFavorite('contact', selectedContact.id) 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Star style={{ 
                  width: 'clamp(1.5rem, 6cqw, 2rem)', 
                  height: 'clamp(1.5rem, 6cqw, 2rem)' 
                }} className={isFavorite('contact', selectedContact.id) ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Uber Button - Now below the 3 action buttons */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-sm">
                <button 
                onClick={() => {
                  // In a real app, this would open the Uber app or website
                  console.log('Opening Uber to:', selectedContact.name);
                }}
                style={{
                  padding: 'clamp(0.75rem, 4cqw, 1rem)',
                  gap: 'clamp(0.5rem, 3cqw, 0.75rem)'
                }}
                className="w-full flex items-center bg-black text-white hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Car style={{ 
                  width: 'clamp(1rem, 4cqw, 1.5rem)', 
                  height: 'clamp(1rem, 4cqw, 1.5rem)' 
                }} className="text-white" />
                <div className="flex-1 text-left">
                  <p style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)' }} className="font-medium text-white">Uber to Contact</p>
                  <p style={{ fontSize: 'clamp(0.75rem, 3.5cqw, 0.875rem)' }} className="text-gray-300">teleport to the user in-game</p>
                </div>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Contacts list view
  return (
    <div className="h-full flex flex-col" style={{ paddingTop: 'clamp(2.5rem, 13.5cqw, 4rem)' }}>
      {/* Navbar */}
      <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
        padding: 'clamp(0.5rem, 3cqw, 0.875rem) clamp(0.75rem, 4cqw, 1.25rem)'
      }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 2cqw, 0.625rem)' }}>
          <button
            onClick={onNavigateToHome}
            className="rounded-lg" 
            style={{ padding: 'clamp(0.125rem, 1cqw, 0.375rem)' }}
          >
            <Home style={{ 
              width: 'clamp(1rem, 6cqw, 1.75rem)', 
              height: 'clamp(1rem, 6cqw, 1.75rem)' 
            }} />
          </button>
        </div>
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Contacts</h1>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedContacts).sort().map(letter => (
          <div key={letter}>
            {/* Section Header */}
            <div className="sticky top-0">
              <SectionHeader
                title={letter}
              />
            </div>
            
            {/* Contacts in Section */}
            {groupedContacts[letter].map(contact => (
              <ListItem
                key={contact.id}
                leftContent={contact.avatar}
                title={contact.name}
                subtitle={contact.company || contact.phone}
                rightContent={(
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(contact.id);
                    }}
                    className="rounded-lg"
                    style={{ padding: 'clamp(0.5rem, 3cqw, 0.75rem)' }}
                  >
                    <Star 
                      className={isFavorite('contact', contact.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                      style={{ 
                        width: 'clamp(1.25rem, 6cqw, 1.5rem)', 
                        height: 'clamp(1.25rem, 6cqw, 1.5rem)' 
                      }} 
                    />
                  </button>
                )}
                onClick={() => {
                  setSelectedContact(contact);
                }}
                className="border-b border-gray-100"
              />
            ))}
          </div>
        ))}
        
        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500" style={{ 
            height: 'clamp(12rem, 30cqh, 16rem)',
            gap: 'clamp(0.5rem, 3cqw, 1rem)'
          }}>
            <Star style={{ 
              width: 'clamp(3rem, 10cqw, 4rem)', 
              height: 'clamp(3rem, 10cqw, 4rem)' 
            }} className="text-gray-300" />
            <p style={{ fontSize: 'clamp(1rem, 5cqw, 1.25rem)' }}>
              No contacts
            </p>
            <p style={{ fontSize: 'clamp(0.75rem, 3.5cqw, 0.875rem)' }}>
              Add contacts to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}