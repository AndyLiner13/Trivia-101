export interface Contact {
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

export const sampleContacts: Contact[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    phone: '(555) 123-4567',
    email: 'alice.johnson@email.com',
    avatar: '👩‍💼',
    company: 'Tech Corp',
    address: '123 Main St, City',
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
    lastContact: '5 days ago'
  }
];

export function groupContactsByLetter(contacts: Contact[]): Record<string, Contact[]> {
  return contacts.reduce((groups, contact) => {
    const firstLetter = contact.name[0].toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);
}
