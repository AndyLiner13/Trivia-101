import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Contact interface
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

// Message interfaces
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

interface MessageTemplate {
  category: string;
  messages: string[];
}

// Banking interfaces
type BankPage = 'home' | 'send-money' | 'request-money' | 'pay-bills';

interface Bill {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  description: string;
}

// Settings interfaces
interface SettingItem {
  id: string;
  label: string;
  icon: BigInt;
  hasToggle?: boolean;
  toggleValue?: boolean;
  hasArrow?: boolean;
  hasCheck?: boolean;
  isSelected?: boolean;
}

interface Ringtone {
  id: string;
  name: string;
  category: string;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'bill' | 'deposit';
  description: string;
  amount: number;
  date: string;
  recipient?: string;
  category: string;
}

interface MePayContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  company?: string;
}

class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // State management for current app
  private currentAppBinding = new ui.Binding('home');
  
  // Phone app state - MINIMAL bindings like PhoneApp.ts
  private phoneNumberBinding = new ui.Binding('');
  private isDialingBinding = new ui.Binding(false);
  
  // Calculator app state
  private calcDisplayBinding = new ui.Binding('0');
  private calcPreviousValueBinding = new ui.Binding('');
  private calcOperationBinding = new ui.Binding('');
  private calcWaitingForOperandBinding = new ui.Binding(false);

  // Internal calculator state tracking
  private calcDisplay = '0';
  private calcPreviousValue = '';
  private calcOperation = '';
  private calcWaitingForOperand = false;

  // Contacts app state
  private selectedContactBinding = new ui.Binding<Contact | null>(null);
  private favoritesBinding = new ui.Binding<Set<number>>(new Set());

  // Internal tracking for current messages
  private currentMessages: Message[] = [];

  // Messages app state
  private selectedConversationBinding = new ui.Binding<Conversation | null>(null);
  private currentMessagesViewBinding = new ui.Binding<'list' | 'chat'>('list');
  private messagesBinding = new ui.Binding<Message[]>([]);
  private selectedMessageTemplateBinding = new ui.Binding<string | null>(null);
  private currentConversation: Conversation | null = null; // Track current conversation

  // Bank app state
  private currentBankPageBinding = new ui.Binding<BankPage>('home');
  private selectedBillBinding = new ui.Binding<string>('');
  private paidBillsBinding = new ui.Binding<string[]>([]);

  // Internal MeBank state tracking
  private currentBankPage: BankPage = 'home';
  private selectedBill = '';
  private paidBills: string[] = [];

  // MePay app state
  private currentMePayPageBinding = new ui.Binding<'home' | 'send' | 'request' | 'sent' | 'requested'>('home');
  private mePayBalanceBinding = new ui.Binding(12847.92);
  private selectedMePayContactBinding = new ui.Binding<MePayContact | null>(null);
  private selectedRequestContactBinding = new ui.Binding<MePayContact | null>(null);
  private sendAmountBinding = new ui.Binding('');
  private requestAmountBinding = new ui.Binding('');
  private showSendNumpadBinding = new ui.Binding(false);
  private showRequestNumpadBinding = new ui.Binding(false);
  private selectedSendNoteBinding = new ui.Binding('');
  private selectedRequestNoteBinding = new ui.Binding('');
  private lastTransactionBinding = new ui.Binding<{
    type: 'sent' | 'requested';
    amount: string;
    contact: MePayContact | null;
    note: string;
  } | null>(null);

  // Internal MePay state tracking
  private currentMePayPage: 'home' | 'send' | 'request' | 'sent' | 'requested' = 'home';
  private mePayBalance = 12847.92;
  private selectedMePayContact: MePayContact | null = null;
  private selectedRequestContact: MePayContact | null = null;
  private sendAmount = '';
  private requestAmount = '';
  private showSendNumpad = false;
  private showRequestNumpad = false;
  private selectedSendNote = '';
  private selectedRequestNote = '';
  private lastTransaction: {
    type: 'sent' | 'requested';
    amount: string;
    contact: MePayContact | null;
    note: string;
  } | null = null;

  // Sample conversations data
  private conversations: Conversation[] = [
    {
      id: 1,
      name: 'Mom',
      lastMessage: 'Don\'t forget dinner tonight!',
      timestamp: '2:30 PM',
      unread: 2,
      avatar: '👩'
    },
    {
      id: 2,
      name: 'Alex',
      lastMessage: 'See you at the meeting',
      timestamp: '1:15 PM',
      unread: 0,
      avatar: '👨'
    },
    {
      id: 3,
      name: 'Sarah',
      lastMessage: 'Thanks for helping!',
      timestamp: '12:45 PM',
      unread: 1,
      avatar: '👩'
    },
    {
      id: 4,
      name: 'David',
      lastMessage: 'Project update attached',
      timestamp: '11:20 AM',
      unread: 0,
      avatar: '👨'
    },
    {
      id: 5,
      name: 'Emma',
      lastMessage: 'Coffee later?',
      timestamp: '10:05 AM',
      unread: 3,
      avatar: '👩'
    },
    {
      id: 6,
      name: 'Work Group',
      lastMessage: 'Meeting moved to 3 PM',
      timestamp: 'Yesterday',
      unread: 0,
      avatar: '👥'
    }
  ];

  // Message threads for each conversation
  private messageThreads: Record<number, Message[]> = {
    1: [ // Mom
      { id: 1, text: 'Hi honey! How was your day?', sender: 'contact', timestamp: '2:25 PM' },
      { id: 2, text: 'It was good! Just finished work', sender: 'user', timestamp: '2:26 PM' },
      { id: 3, text: 'That\'s great! Don\'t forget we have dinner tonight at 7', sender: 'contact', timestamp: '2:28 PM' },
      { id: 4, text: 'Don\'t forget dinner tonight!', sender: 'contact', timestamp: '2:30 PM' }
    ],
    2: [ // Alex
      { id: 1, text: 'Hey, are you ready for tomorrow\'s presentation?', sender: 'contact', timestamp: '1:10 PM' },
      { id: 2, text: 'Yes, just finished the slides', sender: 'user', timestamp: '1:12 PM' },
      { id: 3, text: 'Awesome! See you at the meeting', sender: 'contact', timestamp: '1:15 PM' }
    ],
    3: [ // Sarah
      { id: 1, text: 'Could you help me with the design review?', sender: 'contact', timestamp: '12:40 PM' },
      { id: 2, text: 'Of course! I\'ll take a look now', sender: 'user', timestamp: '12:42 PM' },
      { id: 3, text: 'Thanks for helping!', sender: 'contact', timestamp: '12:45 PM' }
    ]
  };

  // Pre-written message templates
  private messageTemplates: MessageTemplate[] = [
    {
      category: 'Quick Responses',
      messages: ['Yes', 'No', 'Thanks!', 'You too!', 'Sounds good', 'On my way', 'Running late', 'Almost there']
    },
    {
      category: 'Greetings',
      messages: ['Hello!', 'Good morning', 'Good evening', 'How are you?', 'Hope you are well', 'Long time no see!']
    },
    {
      category: 'Plans & Meet Up',
      messages: ['What time works for you?', 'Let us meet up soon', 'See you later', 'Are you free today?', 'Rain check?', 'Can we reschedule?']
    },
    {
      category: 'Work & Business',
      messages: ['Got it, thanks', 'Will get back to you', 'In a meeting, call later', 'Checking now', 'Please send details', 'Meeting confirmed']
    }
  ];

  // Sample contacts data
  private contacts: Contact[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      phone: '(555) 123-4567',
      email: 'alice.johnson@email.com',
      avatar: '👩',
      company: 'Tech Corp',
      address: '123 Main St, City',
      lastContact: '2 days ago'
    },
    {
      id: 2,
      name: 'Bob Smith',
      phone: '(555) 234-5678',
      email: 'bob.smith@email.com',
      avatar: '👨',
      company: 'Design Studio',
      lastContact: '1 week ago'
    },
    {
      id: 3,
      name: 'Carol Davis',
      phone: '(555) 345-6789',
      email: 'carol.davis@email.com',
      avatar: '👩',
      company: 'Art Gallery',
      address: '456 Oak Ave, Town',
      lastContact: '3 days ago'
    },
    {
      id: 4,
      name: 'David Wilson',
      phone: '(555) 456-7890',
      avatar: '👨',
      company: 'Research Lab',
      lastContact: '1 month ago'
    },
    {
      id: 5,
      name: 'Emma Brown',
      phone: '(555) 567-8901',
      email: 'emma.brown@email.com',
      avatar: '👩',
      company: 'University',
      address: '789 Pine St, Village',
      lastContact: '2 weeks ago'
    },
    {
      id: 6,
      name: 'Frank Miller',
      phone: '(555) 678-9012',
      avatar: '👨',
      company: 'Restaurant',
      lastContact: '5 days ago'
    }
  ];

  // Settings app state
  private currentSettingsViewBinding = new ui.Binding<'main' | 'ringtones'>('main');
  private notificationsEnabledBinding = new ui.Binding<boolean>(true);
  private selectedRingtoneBinding = new ui.Binding<string>('classic-ring');
  private notificationsEnabled = true; // Track the current state

  private ringtones: Ringtone[] = [
    { id: 'classic-ring', name: 'Classic Ring', category: 'Default' },
    { id: 'digital-bell', name: 'Digital Bell', category: 'Default' },
    { id: 'modern-chime', name: 'Modern Chime', category: 'Default' },
    { id: 'my-recording', name: 'My Recording', category: 'Custom' },
    { id: 'uploaded-song', name: 'Uploaded Song', category: 'Custom' },
    { id: 'custom-tone', name: 'Custom Tone', category: 'Custom' }
  ];

  // MePay data
  private mePayContacts: MePayContact[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      phone: '(555) 123-4567',
      email: 'alice.johnson@email.com',
      avatar: '👩‍💼',
      company: 'Tech Corp'
    },
    {
      id: 2,
      name: 'Bob Smith',
      phone: '(555) 234-5678',
      email: 'bob.smith@email.com',
      avatar: '👨‍💻',
      company: 'Design Studio'
    },
    {
      id: 3,
      name: 'Carol Davis',
      phone: '(555) 345-6789',
      email: 'carol.davis@email.com',
      avatar: '👩‍🎨',
      company: 'Art Gallery'
    },
    {
      id: 4,
      name: 'David Wilson',
      phone: '(555) 456-7890',
      avatar: '👨‍🔬',
      company: 'Research Lab'
    },
    {
      id: 5,
      name: 'Emma Brown',
      phone: '(555) 567-8901',
      email: 'emma.brown@email.com',
      avatar: '👩‍🏫',
      company: 'University'
    },
    {
      id: 6,
      name: 'Frank Miller',
      phone: '(555) 678-9012',
      avatar: '👨‍🍳',
      company: 'Restaurant'
    }
  ];

  private mePayNoteReasons = [
    'Lunch',
    'Coffee',
    'Rent',
    'Utilities',
    'Gas money',
    'Groceries',
    'Movie tickets',
    'Dinner',
    'Birthday gift',
    'Thank you',
    'Freelance work',
    'Invoice payment',
    'Other'
  ];

  private recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'sent',
      description: 'Coffee with Sarah',
      amount: -12.50,
      date: 'Today',
      recipient: 'Sarah',
      category: 'Food & Drink'
    },
    {
      id: '2',
      type: 'received',
      description: 'Payment from Alex',
      amount: 45.00,
      date: 'Today',
      recipient: 'Alex',
      category: 'Personal'
    },
    {
      id: '3',
      type: 'sent',
      description: 'Lunch Split',
      amount: -28.75,
      date: 'Today',
      recipient: 'Mike',
      category: 'Food & Drink'
    },
    {
      id: '4',
      type: 'bill',
      description: 'Electric Company',
      amount: -89.47,
      date: 'Yesterday',
      category: 'Utilities'
    },
    {
      id: '5',
      type: 'received',
      description: 'Rent Split from Jake',
      amount: 425.00,
      date: 'Yesterday',
      recipient: 'Jake',
      category: 'Personal'
    },
    {
      id: '6',
      type: 'sent',
      description: 'Gas Station',
      amount: -45.20,
      date: 'Dec 2',
      category: 'Transportation'
    },
    {
      id: '7',
      type: 'deposit',
      description: 'Salary Deposit',
      amount: 2850.00,
      date: 'Dec 1',
      category: 'Income'
    },
    {
      id: '8',
      type: 'sent',
      description: 'Online Shopping',
      amount: -156.99,
      date: 'Nov 30',
      category: 'Shopping'
    },
    {
      id: '9',
      type: 'received',
      description: 'Freelance Payment',
      amount: 350.00,
      date: 'Nov 29',
      category: 'Income'
    },
    {
      id: '10',
      type: 'sent',
      description: 'Grocery Store',
      amount: -87.43,
      date: 'Nov 28',
      category: 'Shopping'
    }
  ];
  
  // Create minimal derived bindings once
  private isHomeBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'home');
  private isPhoneAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'phone');
  private isCalculatorAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'calculator');
  private isContactsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'contacts');
  private isMessagesAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'messages');
  private isSettingsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'settings');
  private isMePayAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'mepay');
  private isDialerBinding = ui.Binding.derive([this.isDialingBinding], (isDialing) => !isDialing);

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
  }

  start() {
    super.start();
  }

  private renderPhoneFrame(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
      },
      children: [
        // Phone container
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 20,
            padding: 6,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Use UINode.if for proper conditional rendering - only renders active app
                ui.UINode.if(this.isHomeBinding, this.renderHomeScreen()),
                ui.UINode.if(this.isPhoneAppBinding, this.renderPhoneApp()),
                ui.UINode.if(this.isCalculatorAppBinding, this.renderCalculatorApp()),
                ui.UINode.if(this.isContactsAppBinding, this.renderContactsApp()),
                ui.UINode.if(this.isMessagesAppBinding, this.renderMessagesApp()),
                ui.UINode.if(this.isSettingsAppBinding, this.renderSettingsApp()),
                ui.UINode.if(this.isMePayAppBinding, this.renderMePayApp())
              ]
            })
          ]
        })
      ]
    });
  }

  private renderHomeScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        gradientColorA: '#60A5FA', // blue-400
        gradientColorB: '#2563EB', // blue-600
        gradientAngle: '180deg', // top to bottom gradient
        borderRadius: 14, // Match the screen border radius
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '10%',
        paddingRight: '10%',
        overflow: 'hidden' // Ensure gradient doesn't bleed
      },
      children: [
        // App Grid Container - 2x3 grid layout like reference
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 16
          },
          children: [
            // First row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Phone', '#00c951', BigInt("24322726084045822"), 'phone'), // Updated green color
                this.createAppIcon('Messages', '#fb2c36', BigInt("1480228839964364"), 'messages') // Updated to Messages app
              ]
            }),
            
            // Second row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Contacts', '#ff6900', BigInt("1328787472168292"), 'contacts'), // Updated orange color
                this.createAppIcon('MePay', '#10b981', BigInt("769107079414002"), 'mepay') // Updated to MePay with credit-card icon
              ]
            }),
            
            // Third row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Calculator', '#2b7fff', BigInt("2175040452971461"), 'calculator'), // Updated blue color
                this.createAppIcon('Settings', '#6a7282', BigInt("1342398257464986"), 'settings') // Updated gray color
              ]
            })
          ]
        })
      ]
    });
  }

  private createAppIcon(appName: string, color: string, assetId: bigint, appId: string): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%'
      },
      onPress: () => {
        this.currentAppBinding.set(appId);
      },
      children: [
        // App icon background
        ui.View({
          style: {
            width: 68,
            height: 68,
            backgroundColor: color,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4
          },
          children: [
            // App icon symbol
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(assetId)),
              style: {
                width: 34,
                height: 34,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),
        
        // App name label
        ui.Text({
          text: appName,
          style: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }

  // Phone number formatting utility
  private formatPhoneNumber(num: string): string {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  }

  // Calculator display formatting utility
  private formatCalculatorDisplay(value: string): string {
    if (value.length > 12) {
      const num = parseFloat(value);
      if (num > 999999999999) {
        return num.toExponential(5);
      }
      return num.toFixed(8).replace(/\.?0+$/, '');
    }
    return value;
  }

  // Standardized Header Component
  private createAppHeader(props: {
    appName: string;
    onHomePress: () => void;
    onBackPress?: () => void;
    showBackButton?: boolean;
    rightElement?: ui.UINode;
  }): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 36, // Fixed height, smaller than before
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      },
      children: [
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            // Home button
            ui.Pressable({
              style: {
                padding: 2
              },
              onPress: props.onHomePress,
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 20,
                    height: 20,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            // Back button (conditional)
            ...(props.showBackButton && props.onBackPress ? [
              ui.Pressable({
                style: {
                  marginLeft: 0,
                  padding: 2
                },
                onPress: props.onBackPress,
                children: [
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1083116303985907"))), // arrow-left icon
                    style: {
                      width: 20,
                      height: 20,
                      tintColor: '#9CA3AF'
                    }
                  })
                ]
              })
            ] : [])
          ]
        }),
        // Right side container with text and optional right element
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: props.appName,
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            // Right element (if provided)
            ...(props.rightElement ? [
              ui.View({
                style: {
                  marginLeft: 8
                },
                children: [props.rightElement]
              })
            ] : [])
          ]
        })
      ]
    });
  }

  // Contacts utility function
  private groupContactsByLetter(contacts: Contact[]): Record<string, Contact[]> {
    return contacts.reduce((groups, contact) => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
      return groups;
    }, {} as Record<string, Contact[]>);
  }

  private renderPhoneApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Use UINode.if for conditional rendering - only render active screen
        ui.UINode.if(this.isDialerBinding, this.renderDialerScreen()),
        ui.UINode.if(this.isDialingBinding, this.renderDialingScreen())
      ]
    });
  }

  private renderDialerScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Phone',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            // Reset phone state
            this.phoneNumberBinding.set('');
            this.isDialingBinding.set(false);
          }
        }),
        
        // Number Display - larger and more prominent
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 36, // Account for fixed header
            minHeight: 60
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                phoneNumber ? this.formatPhoneNumber(phoneNumber) : 'Enter phone #'
              ),
              numberOfLines: 1, // Prevent text wrapping
              style: {
                color: '#FFFFFF',
                fontSize: 18, // Match the size of the numbers
                fontWeight: '300',
                textAlign: 'center'
              }
            })
          ]
        }),
        
        // Dial Pad - improved spacing and sizing
        ui.View({
          style: {
            flex: 1,
            padding: 8,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: 1, 2, 3
            this.createDialPadRow(['1', '2', '3']),
            // Row 2: 4, 5, 6
            this.createDialPadRow(['4', '5', '6']),
            // Row 3: 7, 8, 9
            this.createDialPadRow(['7', '8', '9']),
            // Row 4: *, 0, #
            this.createDialPadRow(['*', '0', '#']),
            // Action buttons row
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                marginTop: 2
              },
              children: [
                // Delete button - static styling for performance
                ui.Pressable({
                  style: {
                    backgroundColor: '#E5E7EB', // Static gray
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.phoneNumberBinding.set(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("802575082453612"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#6B7280' // Static gray
                      }
                    })
                  ]
                }),
                // Call button - static styling for performance
                ui.Pressable({
                  style: {
                    backgroundColor: '#00c951', // Static green
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.handleCallPress();
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1127859349222459"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#FFFFFF' // Static white
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderDialingScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#00c951', // green-500
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
      },
      children: [
        // Phone icon container
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24322726084045822"))),
              style: {
                width: 24,
                height: 24,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),
        
        // Calling text
        ui.Text({
          text: 'Calling...',
          style: {
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: '500',
            marginBottom: 4,
            textAlign: 'center'
          }
        }),
        
        // Phone number
        ui.Text({
          text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
            this.formatPhoneNumber(phoneNumber)
          ),
          style: {
            color: '#FFFFFF',
            fontSize: 14,
            opacity: 0.9,
            marginBottom: 24,
            textAlign: 'center'
          }
        }),
        
        // End call button
        ui.Pressable({
          style: {
            backgroundColor: '#fb2c36', // red-500
            borderRadius: 20,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.isDialingBinding.set(false);
            this.phoneNumberBinding.set('');
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24322726084045822"))),
              style: {
                width: 20,
                height: 20,
                tintColor: '#FFFFFF',
                transform: [{ rotate: '135deg' }] // Rotate phone icon to face down at proper angle
              }
            })
          ]
        })
      ]
    });
  }

  private createDialPadRow(digits: string[]): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginVertical: 3
      },
      children: digits.map(digit => 
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 46,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.phoneNumberBinding.set(prev => 
              prev.length < 10 ? prev + digit : prev
            );
          },
          children: [
            ui.Text({
              text: digit,
              style: {
                fontSize: 22,
                color: '#374151',
                fontWeight: '400'
              }
            })
          ]
        })
      )
    });
  }

  private handleCallPress(): void {
    this.isDialingBinding.set(true);
  }

  private renderCalculatorApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Calculator',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            // Reset calculator state
            this.calcClear();
          }
        }),
        
        // Display
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginTop: 36, // Account for header
            minHeight: 60
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.calcDisplayBinding], (display) => 
                this.formatCalculatorDisplay(display)
              ),
              style: {
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: '300',
                textAlign: 'right'
              }
            })
          ]
        }),
        
        // Button Grid
        ui.View({
          style: {
            flex: 1,
            padding: 6,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: C, ±, ⌫, ÷
            this.createCalculatorRow([
              { label: 'C', type: 'function', action: () => this.calcClear(), bg: '#d1d5dc' },
              { label: '±', type: 'function', action: () => this.calcToggleSign(), bg: '#d1d5dc' },
              { label: '⌫', type: 'function', action: () => this.calcDeleteDigit(), bg: '#d1d5dc' },
              { label: '÷', type: 'operation', action: () => this.calcInputOperation('÷'), bg: '#F97316' }
            ]),
            // Row 2: 7, 8, 9, ×
            this.createCalculatorRow([
              { label: '7', type: 'number', action: () => this.calcInputNumber('7'), bg: '#FFFFFF' },
              { label: '8', type: 'number', action: () => this.calcInputNumber('8'), bg: '#FFFFFF' },
              { label: '9', type: 'number', action: () => this.calcInputNumber('9'), bg: '#FFFFFF' },
              { label: '×', type: 'operation', action: () => this.calcInputOperation('×'), bg: '#F97316' }
            ]),
            // Row 3: 4, 5, 6, -
            this.createCalculatorRow([
              { label: '4', type: 'number', action: () => this.calcInputNumber('4'), bg: '#FFFFFF' },
              { label: '5', type: 'number', action: () => this.calcInputNumber('5'), bg: '#FFFFFF' },
              { label: '6', type: 'number', action: () => this.calcInputNumber('6'), bg: '#FFFFFF' },
              { label: '-', type: 'operation', action: () => this.calcInputOperation('-'), bg: '#F97316' }
            ]),
            // Row 4: 1, 2, 3, +
            this.createCalculatorRow([
              { label: '1', type: 'number', action: () => this.calcInputNumber('1'), bg: '#FFFFFF' },
              { label: '2', type: 'number', action: () => this.calcInputNumber('2'), bg: '#FFFFFF' },
              { label: '3', type: 'number', action: () => this.calcInputNumber('3'), bg: '#FFFFFF' },
              { label: '+', type: 'operation', action: () => this.calcInputOperation('+'), bg: '#F97316' }
            ]),
            // Row 5: 0 (wide), ., =
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 0,
                marginVertical: 3
              },
              children: [
                // 0 button (double width)
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 2,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputNumber('0'),
                  children: [
                    ui.Text({
                      text: '0',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // . button
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputDecimal(),
                  children: [
                    ui.Text({
                      text: '.',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // = button
                ui.Pressable({
                  style: {
                    backgroundColor: '#F97316', // orange-500
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcPerformCalculation(),
                  children: [
                    ui.Text({
                      text: '=',
                      style: {
                        fontSize: 22,
                        color: '#FFFFFF',
                        fontWeight: '400'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createCalculatorRow(buttons: Array<{label: string, type: string, action: () => void, bg: string}>): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginVertical: 3
      },
      children: buttons.map(button => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 46,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: button.action,
          children: [
            button.label === '⌫' ? 
              ui.Image({
                source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("645495034835211"))),
                style: {
                  width: 22,
                  height: 22,
                  tintColor: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF'
                }
              }) :
              ui.Text({
                text: button.label,
                style: {
                  fontSize: button.label === '-' ? 28 : 22, // Make minus symbol bigger
                  color: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF',
                  fontWeight: '400'
                }
              })
          ]
        })
      )
    });
  }

  // Calculator logic methods
  private calcInputNumber(num: string): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = num;
      this.calcWaitingForOperand = false;
    } else {
      this.calcDisplay = this.calcDisplay === '0' ? num : this.calcDisplay + num;
    }
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcInputOperation(nextOperation: string): void {
    const inputValue = parseFloat(this.calcDisplay);

    if (this.calcPreviousValue === '') {
      this.calcPreviousValue = this.calcDisplay;
    } else if (this.calcOperation) {
      const currentValue = this.calcPreviousValue || '0';
      const newValue = this.calcCalculate(parseFloat(currentValue), inputValue, this.calcOperation);
      
      this.calcDisplay = String(newValue);
      this.calcPreviousValue = String(newValue);
      this.calcDisplayBinding.set(this.calcDisplay);
    }

    this.calcWaitingForOperand = true;
    this.calcOperation = nextOperation;
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcCalculate(firstOperand: number, secondOperand: number, operation: string): number {
    switch (operation) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '×':
        return firstOperand * secondOperand;
      case '÷':
        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
      default:
        return secondOperand;
    }
  }

  private calcPerformCalculation(): void {
    if (this.calcPreviousValue && this.calcOperation) {
      const inputValue = parseFloat(this.calcDisplay);
      const currentValue = parseFloat(this.calcPreviousValue);
      const newValue = this.calcCalculate(currentValue, inputValue, this.calcOperation);

      this.calcDisplay = String(newValue);
      this.calcPreviousValue = '';
      this.calcOperation = '';
      this.calcWaitingForOperand = true;
      
      this.calcDisplayBinding.set(this.calcDisplay);
      this.calcPreviousValueBinding.set(this.calcPreviousValue);
      this.calcOperationBinding.set(this.calcOperation);
      this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
    }
  }

  private calcClear(): void {
    this.calcDisplay = '0';
    this.calcPreviousValue = '';
    this.calcOperation = '';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcClearEntry(): void {
    this.calcDisplay = '0';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcToggleSign(): void {
    if (this.calcDisplay !== '0') {
      if (this.calcDisplay.startsWith('-')) {
        this.calcDisplay = this.calcDisplay.slice(1);
      } else {
        this.calcDisplay = '-' + this.calcDisplay;
      }
      this.calcDisplayBinding.set(this.calcDisplay);
    }
  }

  private calcInputDecimal(): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = '0.';
      this.calcWaitingForOperand = false;
    } else if (this.calcDisplay.indexOf('.') === -1) {
      this.calcDisplay = this.calcDisplay + '.';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcDeleteDigit(): void {
    if (this.calcDisplay.length > 1 && this.calcDisplay !== '0') {
      this.calcDisplay = this.calcDisplay.slice(0, -1);
    } else {
      this.calcDisplay = '0';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
  }

  private renderContactsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Contact Detail View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactBinding], (contact) => contact !== null),
          this.renderContactDetail()
        ),
        // Contacts List View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactBinding], (contact) => contact === null),
          this.renderContactsList()
        )
      ]
    });
  }

  private renderContactDetail(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Contact',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.selectedContactBinding.set(null);
          },
          onBackPress: () => {
            this.selectedContactBinding.set(null);
          },
          showBackButton: true
        }),
        
        // Contact Info - Top aligned
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginTop: 36 // Account for fixed header
          },
          children: [
            // Avatar
            ui.View({
              style: {
                width: 60,
                height: 60,
                backgroundColor: '#3B82F6',
                borderRadius: 15,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact ? contact.avatar : ''
                  ),
                  style: {
                    fontSize: 32
                  }
                })
              ]
            }),
            
            // Name
            ui.Text({
              text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                contact ? contact.name : ''
              ),
              style: {
                fontSize: 16,
                fontWeight: '500',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 16
              }
            }),
            
            // Action buttons row
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              },
              children: [
                // Call button
                ui.Pressable({
                  style: {
                    backgroundColor: '#00c951',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    // Switch to phone app and pre-fill the number
                    // Note: In a real implementation, we'd need to access the current contact
                    // For now, we'll use a simplified approach
                    this.currentAppBinding.set('phone');
                    this.selectedContactBinding.set(null);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1127859349222459"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                }),
                
                // Message button
                ui.Pressable({
                  style: {
                    backgroundColor: '#fb2c36',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    console.log('Message button pressed');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1480228839964364"))), // message-bubble icon
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                }),
                
                // Favorite button
                ui.Pressable({
                  style: {
                    backgroundColor: '#E5E7EB',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    // Toggle favorite status
                    // Note: We need to access the current selected contact differently
                    // For now, we'll handle this in a simplified way
                    this.favoritesBinding.set(prev => {
                      const newFavorites = new Set(prev);
                      // For this implementation, we'll just toggle a placeholder
                      return newFavorites;
                    });
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("787034810502774"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),
            
            // Uber Button - replacing contact details
            ui.View({
              style: {
                width: '100%',
                alignItems: 'center'
              },
              children: [
                ui.View({
                  style: {
                    width: '100%',
                    maxWidth: 300
                  },
                  children: [
                    ui.Pressable({
                      style: {
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000000',
                        borderRadius: 12,
                        padding: 12
                      },
                      onPress: () => {
                        // In a real app, this would open the Uber app or teleport to the contact
                        console.log('Opening Uber to contact');
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("662001530262929"))), // car icon
                          style: {
                            width: 20,
                            height: 20,
                            tintColor: '#FFFFFF',
                            marginRight: 8
                          }
                        }),
                        ui.View({
                          style: {
                            flex: 1,
                            alignItems: 'flex-start'
                          },
                          children: [
                            ui.Text({
                              text: 'Uber to Contact',
                              style: {
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#FFFFFF'
                              }
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderContactsList(): ui.UINode {
    const groupedContacts = this.groupContactsByLetter(this.contacts);
    const sortedLetters = Object.keys(groupedContacts).sort();
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Contacts',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.selectedContactBinding.set(null);
          },
          showBackButton: false
        }),
        
        // Contacts List
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            backgroundColor: '#FFFFFF'
          },
          children: [
            // Scrollable contacts list
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    paddingBottom: 20
                  },
                  children: sortedLetters.map(letter => 
                    ui.View({
                      style: {
                        width: '100%'
                      },
                      children: [
                        // Section header
                        this.createSectionHeader(letter),
                        
                        // Contacts in this section
                        ...groupedContacts[letter].map(contact =>
                          this.createContactListItem(contact)
                        )
                      ]
                    })
                  )
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB', // gray-50
        paddingHorizontal: 16,
        paddingVertical: 4,
        width: '100%'
      },
      children: [
        ui.Text({
          text: title.toUpperCase(),
          style: {
            fontSize: 12,
            color: '#6B7280',
            fontWeight: '500'
          }
        })
      ]
    });
  }

  private createContactListItem(contact: Contact): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: '100%'
      },
      onPress: () => {
        this.selectedContactBinding.set(contact);
      },
      children: [
        // Left content (avatar)
        ui.View({
          style: {
            width: 32,
            height: 32,
            backgroundColor: '#3B82F6', // blue-500
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          },
          children: [
            ui.Text({
              text: contact.avatar,
              style: {
                fontSize: 16,
                color: '#FFFFFF'
              }
            })
          ]
        }),
        
        // Main content
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 6
          },
          children: [
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 12,
                fontWeight: '400',
                color: '#111827',
                marginBottom: contact.company || contact.phone ? 1 : 0
              }
            }),
            ...(contact.company || contact.phone ? [
              ui.Text({
                text: contact.company || contact.phone,
                style: {
                  fontSize: 10,
                  color: '#6B7280',
                  fontWeight: '400'
                }
              })
            ] : [])
          ]
        }),
        
        // Right content (favorite star)
        ui.Pressable({
          style: {
            padding: 4,
            borderRadius: 6
          },
          onPress: () => {
            this.favoritesBinding.set(prev => {
              const newFavorites = new Set(prev);
              if (newFavorites.has(contact.id)) {
                newFavorites.delete(contact.id);
              } else {
                newFavorites.add(contact.id);
              }
              return newFavorites;
            });
          },
          children: [
            ui.Image({
              source: ui.Binding.derive([this.favoritesBinding], (favorites) => 
                favorites.has(contact.id) 
                  ? ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24150527294650016")))
                  : ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("787034810502774")))
              ),
              style: {
                width: 14,
                height: 14,
                tintColor: ui.Binding.derive([this.favoritesBinding], (favorites) => 
                  favorites.has(contact.id) ? '#F59E0B' : '#9CA3AF'
                )
              }
            })
          ]
        })
      ]
    });
  }

  private renderMessagesApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Conversations List View
        ui.UINode.if(
          ui.Binding.derive([this.currentMessagesViewBinding], (view) => view === 'list'),
          this.renderConversationsList()
        ),
        // Chat View
        ui.UINode.if(
          ui.Binding.derive([this.currentMessagesViewBinding], (view) => view === 'chat'),
          this.renderChatView()
        )
      ]
    });
  }

  private renderConversationsList(): ui.UINode {
    const unreadCount = this.conversations.filter(c => c.unread > 0).length;
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Messages',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            // Reset messages state
            this.selectedConversationBinding.set(null);
            this.currentMessagesViewBinding.set('list');
            this.messagesBinding.set([]);
            this.selectedMessageTemplateBinding.set(null);
          },
          showBackButton: false
        }),
        
        // Conversations List
        ui.View({
          style: {
            flex: 1,
            backgroundColor: '#FFFFFF',
            marginTop: 36
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    backgroundColor: '#FFFFFF'
                  },
                  children: this.conversations.map(conversation => this.createConversationItem(conversation))
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderChatView(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        flexDirection: 'column'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Messages',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.selectedConversationBinding.set(null);
            this.currentMessagesViewBinding.set('list');
            this.messagesBinding.set([]);
          },
          onBackPress: () => {
            this.currentMessagesViewBinding.set('list');
            this.selectedConversationBinding.set(null);
            this.messagesBinding.set([]);
          },
          showBackButton: true
        }),
        
        // Messages
        ui.View({
          style: {
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginTop: 36
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'column',
                    padding: 8
                  },
                  children: [
                    // Show sample messages for now
                    this.createMessageBubble({ id: 1, text: 'Hi there!', sender: 'contact', timestamp: '2:25 PM' }, 0),
                    this.createMessageBubble({ id: 2, text: 'Hello! How are you?', sender: 'user', timestamp: '2:26 PM' }, 1),
                    this.createMessageBubble({ id: 3, text: 'I\'m good, thanks for asking!', sender: 'contact', timestamp: '2:27 PM' }, 2)
                  ]
                })
              ]
            })
          ]
        }),
        
        // Message Templates Section
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            borderTopWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            maxHeight: 160
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1480228839964364"))),
                  style: {
                    width: 14,
                    height: 14,
                    tintColor: '#6B7280',
                    marginRight: 6
                  }
                }),
                ui.Text({
                  text: 'Choose a message to send:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280'
                  }
                })
              ]
            }),
            ui.ScrollView({
              style: {
                flex: 1,
                maxHeight: 120
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'column'
                  },
                  children: this.messageTemplates.map((category, categoryIndex) => 
                    ui.View({
                      style: {
                        marginBottom: 8
                      },
                      children: [
                        ui.Text({
                          text: category.category,
                          style: {
                            fontSize: 10,
                            color: '#6B7280',
                            fontWeight: '500',
                            marginBottom: 4
                          }
                        }),
                        ui.View({
                          style: {
                            flexDirection: 'column'
                          },
                          children: category.messages.map((message, messageIndex) =>
                            ui.Pressable({
                              style: {
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                marginBottom: 4
                              },
                              onPress: () => {
                                this.sendMessage(message);
                              },
                              children: [
                                ui.Text({
                                  text: message,
                                  style: {
                                    fontSize: 12,
                                    color: '#374151'
                                  }
                                })
                              ]
                            })
                          )
                        })
                      ]
                    })
                  )
                })
              ]
            })
          ]
        })
      ]
    });
  }

  /* OLD MEMAIL METHOD - DISABLED
  private createEmailItem(email: Email): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48
      },
      onPress: () => {
        this.selectedEmailBinding.set(email);
      },
      children: [
        // Avatar
        ui.View({
          style: {
            width: 24,
            height: 24,
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: email.from.charAt(0),
              style: {
                fontSize: 10,
                color: '#FFFFFF',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Content - Fixed width area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            paddingRight: 8
          },
          children: [
            // Sender row with consistent spacing
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 2,
                height: 14
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 0
                  },
                  children: [
                    ui.Text({
                      text: email.from,
                      style: {
                        fontSize: 11,
                        fontWeight: email.isRead ? '400' : '600',
                        color: '#111827'
                      }
                    }),
                    // Fixed space for unread dot
                    ui.View({
                      style: {
                        width: 10,
                        height: 14,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingLeft: 4
                      },
                      children: [
                        ui.View({
                          style: {
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: email.isRead ? 'transparent' : '#3B82F6'
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            // Subject row
            ui.View({
              style: {
                height: 12,
                justifyContent: 'center'
              },
              children: [
                ui.Text({
                  text: email.subject,
                  style: {
                    fontSize: 9,
                    color: '#6B7280',
                    fontWeight: '400'
                  }
                })
              ]
            })
          ]
        }),
        
        // Timestamp - Fixed width
        ui.View({
          style: {
            width: 48,
            height: 24,
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: email.timestamp,
              style: {
                fontSize: 8,
                color: '#9CA3AF'
              }
            })
          ]
        })
      ]
    });
  }
  */

  private createConversationItem(conversation: Conversation): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
      },
      onPress: () => {
        this.openChat(conversation);
      },
      children: [
        // Avatar
        ui.View({
          style: {
            width: 40,
            height: 40,
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: conversation.avatar,
              style: {
                fontSize: 18
              }
            })
          ]
        }),
        
        // Content
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 8
          },
          children: [
            ui.Text({
              text: conversation.name,
              style: {
                fontSize: 12,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: conversation.lastMessage,
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Right side info
        ui.View({
          style: {
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center'
          },
          children: [
            ...(conversation.unread > 0 ? [
              ui.View({
                style: {
                  backgroundColor: '#3B82F6',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6
                },
                children: [
                  ui.Text({
                    text: conversation.unread.toString(),
                    style: {
                      fontSize: 10,
                      color: '#FFFFFF',
                      fontWeight: '500'
                    }
                  })
                ]
              })
            ] : [])
          ]
        })
      ]
    });
  }

  private renderMessagesList(): ui.UINode[] {
    return this.currentMessages.map((message, index) => this.createMessageBubble(message, index));
  }

  private createMessageBubble(message: Message, index: number): ui.UINode {
    const isUser = message.sender === 'user';
    
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 4
      },
      children: [
        ui.View({
          style: {
            backgroundColor: isUser ? '#3B82F6' : '#F3F4F6',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            maxWidth: 140
          },
          children: [
            ui.Text({
              text: message.text,
              style: {
                fontSize: 12,
                color: isUser ? '#FFFFFF' : '#111827'
              }
            })
          ]
        })
      ]
    });
  }

  private openChat(conversation: Conversation): void {
    this.currentConversation = conversation;
    this.selectedConversationBinding.set(conversation);
    this.currentMessagesViewBinding.set('chat');
    
    // Load messages for this conversation
    const conversationMessages = this.messageThreads[conversation.id] || [];
    this.currentMessages = conversationMessages;
    this.messagesBinding.set(conversationMessages);
  }

  private sendMessage(messageText: string): void {
    if (messageText.trim() && this.currentConversation) {
      const conversationMessages = this.messageThreads[this.currentConversation.id] || [];
      const message: Message = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedMessages = [...conversationMessages, message];
      this.messageThreads[this.currentConversation.id] = updatedMessages;
      this.currentMessages = updatedMessages;
      this.messagesBinding.set(updatedMessages);
      this.selectedMessageTemplateBinding.set(null);
    }
  }

  private renderSettingsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Main Settings View
        ui.UINode.if(
          ui.Binding.derive([this.currentSettingsViewBinding], (view) => view === 'main'),
          this.renderMainSettings()
        ),
        // Ringtones View
        ui.UINode.if(
          ui.Binding.derive([this.currentSettingsViewBinding], (view) => view === 'ringtones'),
          this.renderRingtones()
        )
      ]
    });
  }

  private renderMainSettings(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Settings',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            // Reset settings state
            this.currentSettingsViewBinding.set('main');
          },
          showBackButton: false
        }),

        // Device Section
        ui.View({
          style: {
            marginTop: 36
          },
          children: [
            this.createSettingsSectionHeader('Device'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'ringtones',
                  label: 'Ringtones',
                  icon: BigInt("1288271619346253"),
                  hasArrow: true
                })
              ]
            })
          ]
        }),

        // Preferences Section
        ui.View({
          style: {
            marginTop: 16
          },
          children: [
            this.createSettingsSectionHeader('Preferences'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'notifications',
                  label: 'Notifications',
                  icon: BigInt("1060423696117146"),
                  hasToggle: true
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderRingtones(): ui.UINode {
    const categories = Array.from(new Set(this.ringtones.map(r => r.category)));

    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Ringtones',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.currentSettingsViewBinding.set('main');
          },
          onBackPress: () => {
            this.currentSettingsViewBinding.set('main');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 36
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    paddingBottom: 20
                  },
                  children: [
                    // Current Ringtone Section
                    this.createSettingsSectionHeader('CURRENT RINGTONE'),
                    ui.View({
                      style: {
                        backgroundColor: '#FFFFFF',
                        marginBottom: 16
                      },
                      children: [
                        this.createRingtoneItem(this.ringtones[0], true)
                      ]
                    }),

                    // Ringtone Categories
                    ...categories.map(category => 
                      ui.View({
                        style: {
                          marginBottom: 16
                        },
                        children: [
                          this.createSettingsSectionHeader(category.toUpperCase()),
                          ui.View({
                            style: {
                              backgroundColor: '#FFFFFF'
                            },
                            children: this.ringtones
                              .filter(r => r.category === category)
                              .map(ringtone => this.createRingtoneItem(ringtone, false))
                          })
                        ]
                      })
                    )
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createSettingsSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 2
      },
      children: [
        ui.Text({
          text: title,
          style: {
            fontSize: 9,
            color: '#6B7280',
            fontWeight: '500'
          }
        })
      ]
    });
  }

  private createSettingItem(item: SettingItem): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40
      },
      onPress: () => {
        if (item.id === 'ringtones') {
          this.currentSettingsViewBinding.set('ringtones');
        } else if (item.id === 'notifications' && item.hasToggle) {
          // Toggle the notifications state
          this.notificationsEnabledBinding.set(!this.notificationsEnabled);
          this.notificationsEnabled = !this.notificationsEnabled;
        }
      },
      children: [
        // Icon container (matching ListItem pattern)
        ui.View({
          style: {
            width: 28,
            height: 28,
            backgroundColor: '#3B82F6',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            flexShrink: 0
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(item.icon.toString()))),
              style: {
                width: 14,
                height: 14,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Content area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            paddingRight: 6
          },
          children: [
            ui.Text({
              text: item.label,
              style: {
                fontSize: 12,
                fontWeight: '400',
                color: '#111827'
              }
            })
          ]
        }),

        // Right content area
        ui.View({
          style: {
            flexShrink: 0,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            item.hasToggle ? ui.Pressable({
              style: {
                padding: 6
              },
              onPress: () => {
                this.notificationsEnabledBinding.set(!this.notificationsEnabled);
                this.notificationsEnabled = !this.notificationsEnabled;
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => 
                    enabled ? '🟢' : '⚪'
                  ),
                  style: {
                    fontSize: 16
                  }
                })
              ]
            }) : item.hasArrow ? ui.Text({
              text: '›',
              style: {
                fontSize: 16,
                color: '#9CA3AF',
                paddingHorizontal: 6
              }
            }) : null
          ].filter(Boolean) as ui.UINode[]
        })
      ]
    });
  }

  private createRingtoneItem(ringtone: Ringtone, isCurrent: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40
      },
      onPress: () => {
        this.selectedRingtoneBinding.set(ringtone.id);
      },
      children: [
        // Icon
        ui.View({
          style: {
            width: 22,
            height: 22,
            backgroundColor: isCurrent ? '#00c951' : '#3B82F6',
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1060423696117146"))), // bell icon
              style: {
                width: 9,
                height: 9,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center'
          },
          children: [
            ui.Text({
              text: ringtone.name,
              style: {
                fontSize: 10,
                fontWeight: '400',
                color: '#111827'
              }
            })
          ]
        }),

        // Right content
        isCurrent ? ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1131016642456733"))), // play icon
          style: {
            width: 10,
            height: 10,
            tintColor: '#3B82F6'
          }
        }) : ui.View({
          style: {
            width: 10,
            height: 10
          },
          children: [
            // Check icon (when selected)
            ui.View({
              style: {
                position: 'absolute',
                width: 10,
                height: 10,
                opacity: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                  selected === ringtone.id ? 1 : 0
                )
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24270584229301990"))), // check icon
                  style: {
                    width: 10,
                    height: 10,
                    tintColor: '#00c951'
                  }
                })
              ]
            }),
            // Play icon (when not selected)
            ui.View({
              style: {
                position: 'absolute',
                width: 10,
                height: 10,
                opacity: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                  selected === ringtone.id ? 0 : 1
                )
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1131016642456733"))), // play icon
                  style: {
                    width: 10,
                    height: 10,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderMePayApp(): ui.UINode {
    // Handle success screens first
    if (this.currentMePayPage === 'sent' && this.lastTransaction) {
      return this.renderPaymentSentScreen();
    }
    
    if (this.currentMePayPage === 'requested' && this.lastTransaction) {
      return this.renderRequestSentScreen();
    }

    // Main pages
    switch (this.currentMePayPage) {
      case 'home':
        return this.renderMePayHome();
      case 'send':
        return this.renderMePaySend();
      case 'request':
        return this.renderMePayRequest();
      default:
        return this.renderMePayHome();
    }
  }

  private renderMePayHome(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'MePay',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.resetMePayState();
          }
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            padding: 16
          },
          children: [
            // Balance Card
            ui.View({
              style: {
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                padding: 20,
                marginBottom: 20
              },
              children: [
                ui.Text({
                  text: 'Account Balance',
                  style: {
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 8
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.mePayBalanceBinding], (balance) => 
                    `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ),
                  style: {
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#FFFFFF'
                  }
                })
              ]
            }),

            // Quick Actions
            ui.View({
              style: {
                flexDirection: 'row',
                marginBottom: 20
              },
              children: [
                // Send Button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#3B82F6',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: 8
                  },
                  onPress: () => {
                    this.navigateToMePayPage('send');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("2808780245977101"))), // arrow-up-right
                      style: {
                        width: 20,
                        height: 20,
                        tintColor: '#FFFFFF',
                        marginBottom: 8
                      }
                    }),
                    ui.Text({
                      text: 'Send',
                      style: {
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Request Button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.navigateToMePayPage('request');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("2521912731541281"))), // arrow-down-left
                      style: {
                        width: 20,
                        height: 20,
                        tintColor: '#FFFFFF',
                        marginBottom: 8
                      }
                    }),
                    ui.Text({
                      text: 'Request',
                      style: {
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            }),

            // Recent Activity Section
            ui.Text({
              text: 'Recent Activity',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 12
              }
            }),

            // Transactions List
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  children: this.recentTransactions.slice(0, 8).map(transaction => this.createTransactionItem(transaction))
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderMePaySend(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Send Money',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.resetMePayState();
          },
          onBackPress: () => {
            this.navigateToMePayPage('home');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            padding: this.showSendNumpad ? 0 : 16
          },
          children: [
            // Form Fields
            ui.View({
              style: {
                padding: this.showSendNumpad ? 16 : 0,
                paddingBottom: this.showSendNumpad ? 12 : 0
              },
              children: [
                // Recipient Field
                this.createMePayContactField(
                  'To',
                  this.selectedMePayContact,
                  this.mePayContacts,
                  (contact) => {
                    this.selectedMePayContact = contact;
                    this.selectedMePayContactBinding.set(contact);
                  }
                ),

                // Amount Field
                ui.View({
                  style: {
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16
                  },
                  children: [
                    ui.Text({
                      text: 'Amount',
                      style: {
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: 8
                      }
                    }),
                    ui.Pressable({
                      style: {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 8,
                        padding: 12,
                        minHeight: 44
                      },
                      onPress: () => {
                        this.showSendNumpad = true;
                        this.showSendNumpadBinding.set(true);
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.sendAmountBinding], (amount) => 
                            amount ? this.formatMePayAmount(amount) : '0'
                          ),
                          style: {
                            fontSize: 18,
                            color: '#111827',
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  ]
                }),

                // Note Field (only when numpad is not shown)
                ...(this.showSendNumpad ? [] : [
                  this.createMePayNoteField(
                    'Note (Optional)',
                    this.selectedSendNote,
                    (note) => {
                      this.selectedSendNote = note;
                      this.selectedSendNoteBinding.set(note);
                    }
                  )
                ])
              ]
            }),

            // Send Button (only when numpad is not shown)
            ...(this.showSendNumpad ? [] : [
              ui.Pressable({
                style: {
                  backgroundColor: this.selectedMePayContact && this.sendAmount ? '#3B82F6' : '#9CA3AF',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 'auto'
                },
                onPress: () => {
                  if (this.selectedMePayContact && this.sendAmount) {
                    this.handleSendMoney();
                  }
                },
                children: [
                  ui.Text({
                    text: 'Send Money',
                    style: {
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ])
          ]
        }),

        // Numpad (when active)
        ...(this.showSendNumpad ? [this.renderMePayNumpad(false)] : [])
      ]
    });
  }

  private renderMePayRequest(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Request Money',
          onHomePress: () => {
            this.currentAppBinding.set('home');
            this.resetMePayState();
          },
          onBackPress: () => {
            this.navigateToMePayPage('home');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            padding: this.showRequestNumpad ? 0 : 16
          },
          children: [
            // Form Fields
            ui.View({
              style: {
                padding: this.showRequestNumpad ? 16 : 0,
                paddingBottom: this.showRequestNumpad ? 12 : 0
              },
              children: [
                // Recipient Field
                this.createMePayContactField(
                  'From',
                  this.selectedRequestContact,
                  this.mePayContacts,
                  (contact) => {
                    this.selectedRequestContact = contact;
                    this.selectedRequestContactBinding.set(contact);
                  }
                ),

                // Amount Field
                ui.View({
                  style: {
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16
                  },
                  children: [
                    ui.Text({
                      text: 'Amount',
                      style: {
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: 8
                      }
                    }),
                    ui.Pressable({
                      style: {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 8,
                        padding: 12,
                        minHeight: 44
                      },
                      onPress: () => {
                        this.showRequestNumpad = true;
                        this.showRequestNumpadBinding.set(true);
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.requestAmountBinding], (amount) => 
                            amount ? this.formatMePayAmount(amount) : '0'
                          ),
                          style: {
                            fontSize: 18,
                            color: '#111827',
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  ]
                }),

                // Note Field (only when numpad is not shown)
                ...(this.showRequestNumpad ? [] : [
                  this.createMePayNoteField(
                    'Note (Optional)',
                    this.selectedRequestNote,
                    (note) => {
                      this.selectedRequestNote = note;
                      this.selectedRequestNoteBinding.set(note);
                    }
                  )
                ])
              ]
            }),

            // Request Button (only when numpad is not shown)
            ...(this.showRequestNumpad ? [] : [
              ui.Pressable({
                style: {
                  backgroundColor: this.selectedRequestContact && this.requestAmount ? '#10B981' : '#9CA3AF',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 'auto'
                },
                onPress: () => {
                  if (this.selectedRequestContact && this.requestAmount) {
                    this.handleRequestMoney();
                  }
                },
                children: [
                  ui.Text({
                    text: 'Send Request',
                    style: {
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ])
          ]
        }),

        // Numpad (when active)
        ...(this.showRequestNumpad ? [this.renderMePayNumpad(true)] : [])
      ]
    });
  }

  private navigateToBankPage(page: BankPage): void {
    // Reset pay-bills state when navigating away from that page
    if (this.currentBankPage === 'pay-bills' && page !== 'pay-bills') {
      this.selectedBill = '';
      this.selectedBillBinding.set('');
      this.paidBills = [];
      this.paidBillsBinding.set([]);
    }
    
    this.currentBankPage = page;
    this.currentBankPageBinding.set(page);
  }

  private renderBankHeader(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#2563EB',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#1E40AF'
      },
      children: [
        ui.Text({
          text: '🏦 MeBank',
          style: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 2
          }
        }),
        ui.Text({
          text: 'Secure Online Banking',
          style: {
            fontSize: 10,
            color: '#BFDBFE'
          }
        })
      ]
    });
  }

  private renderBankAccountBalance(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#059669'
      },
      children: [
        ui.Text({
          text: 'Account Balance:',
          style: {
            fontSize: 11,
            fontWeight: '600',
            color: '#065F46',
            marginBottom: 4
          }
        }),
        ui.Text({
          text: '$12,847.92',
          style: {
            fontSize: 18,
            fontWeight: '700',
            color: '#059669'
          }
        })
      ]
    });
  }

  private renderBankHomePage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderBankHeader(),
        this.renderBankAccountBalance(),
        
        // Quick Actions
        ui.View({
          style: {
            marginBottom: 12
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              onPress: () => {
                this.navigateToBankPage('send-money');
              },
              children: [
                ui.Text({
                  text: 'SEND MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#1E40AF',
                    textAlign: 'center'
                  }
                })
              ]
            }),
            
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              onPress: () => {
                this.navigateToBankPage('request-money');
              },
              children: [
                ui.Text({
                  text: 'REQUEST MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#065F46',
                    textAlign: 'center'
                  }
                })
              ]
            }),
            
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12
              },
              onPress: () => {
                this.navigateToBankPage('pay-bills');
              },
              children: [
                ui.Text({
                  text: 'PAY BILLS',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#5B21B6',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBankSendMoneyPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderBankHeader(),
        this.renderBankAccountBalance(),
        
        // Send Money Form
        ui.View({
          children: [
            // Recipient
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'TO:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E40AF',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: "Enter recipient's email or phone",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Amount
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'AMOUNT:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: '$0.00',
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Note
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'NOTE (Optional):',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#5B21B6',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8,
                    minHeight: 40
                  },
                  children: [
                    ui.Text({
                      text: "What's this for?",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Send Button
            ui.Pressable({
              style: {
                backgroundColor: '#2563EB',
                borderWidth: 2,
                borderColor: '#1E40AF',
                borderRadius: 6,
                padding: 12
              },
              children: [
                ui.Text({
                  text: 'SEND MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBankRequestMoneyPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderBankHeader(),
        this.renderBankAccountBalance(),
        
        // Request Money Form
        ui.View({
          children: [
            // From
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'FROM:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: "Enter sender's email or phone",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Amount
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'AMOUNT:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E40AF',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: '$0.00',
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Note
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'NOTE (Optional):',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#5B21B6',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8,
                    minHeight: 40
                  },
                  children: [
                    ui.Text({
                      text: "What's this for?",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Request Button
            ui.Pressable({
              style: {
                backgroundColor: '#059669',
                borderWidth: 2,
                borderColor: '#065F46',
                borderRadius: 6,
                padding: 12
              },
              children: [
                ui.Text({
                  text: 'REQUEST MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBankPayBillsPage(): ui.UINode {
    const bills = this.getBills();
    
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderBankHeader(),
        this.renderBankAccountBalance(),
        
        // Bills List
        ui.View({
          children: [
            ...bills.map(bill => this.renderBillItem(bill)),
            
            // Pay Button
            ui.Pressable({
              style: {
                backgroundColor: ui.Binding.derive([this.selectedBillBinding], (selected) => 
                  selected ? '#7C3AED' : '#9CA3AF'
                ),
                borderWidth: 2,
                borderColor: ui.Binding.derive([this.selectedBillBinding], (selected) => 
                  selected ? '#5B21B6' : '#6B7280'
                ),
                borderRadius: 6,
                padding: 12,
                marginTop: 8
              },
              onPress: () => {
                this.handlePayBill();
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.selectedBillBinding], (selected) => {
                    if (selected) {
                      const bill = bills.find(b => b.id === selected);
                      return bill ? `PAY ${bill.name.toUpperCase()} - $${bill.amount.toFixed(2)}` : 'SELECT A BILL TO PAY';
                    }
                    return 'SELECT A BILL TO PAY';
                  }),
                  style: {
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBillItem(bill: Bill): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
          if (paid.includes(bill.id)) return '#059669';
          if (selected === bill.id) return '#7C3AED';
          return '#D1D5DB';
        }),
        borderRadius: 6,
        padding: 12,
        marginBottom: 6
      },
      onPress: () => {
        if (!this.paidBills.includes(bill.id)) {
          this.selectedBill = this.selectedBill === bill.id ? '' : bill.id;
          this.selectedBillBinding.set(this.selectedBill);
        }
      },
      children: [
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1
              },
              children: [
                ui.Text({
                  text: bill.emoji,
                  style: {
                    fontSize: 14,
                    marginRight: 8
                  }
                }),
                ui.View({
                  style: {
                    flex: 1
                  },
                  children: [
                    ui.Text({
                      text: bill.name,
                      style: {
                        fontSize: 10,
                        fontWeight: '600',
                        color: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
                          if (paid.includes(bill.id)) return '#065F46';
                          if (selected === bill.id) return '#5B21B6';
                          return '#374151';
                        }),
                        marginBottom: 2
                      }
                    }),
                    ui.Text({
                      text: bill.description,
                      style: {
                        fontSize: 8,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),
            ui.View({
              style: {
                alignItems: 'flex-end'
              },
              children: [
                ui.Text({
                  text: `$${bill.amount.toFixed(2)}`,
                  style: {
                    fontSize: 11,
                    fontWeight: '700',
                    color: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
                      if (paid.includes(bill.id)) return '#059669';
                      if (selected === bill.id) return '#7C3AED';
                      return '#DC2626';
                    })
                  }
                }),
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.paidBillsBinding], (paid) => 
                      paid.includes(bill.id) ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Text({
                      text: 'PAID ✓',
                      style: {
                        fontSize: 7,
                        fontWeight: '600',
                        color: '#059669'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private handlePayBill(): void {
    if (this.selectedBill && !this.paidBills.includes(this.selectedBill)) {
      this.paidBills.push(this.selectedBill);
      this.paidBillsBinding.set([...this.paidBills]);
      this.selectedBill = '';
      this.selectedBillBinding.set('');
    }
  }

  private getBills(): Bill[] {
    return [
      { id: 'electric', name: 'Electric Company', amount: 89.47, emoji: '⚡', description: 'Monthly electricity usage' },
      { id: 'gas', name: 'Gas Company', amount: 156.23, emoji: '🔥', description: 'Natural gas service' },
      { id: 'water', name: 'Water Utility', amount: 67.89, emoji: '💧', description: 'Water & sewer services' },
      { id: 'internet', name: 'Internet Provider', amount: 79.99, emoji: '🌐', description: 'High-speed internet' },
      { id: 'credit-card', name: 'Credit Card Payment', amount: 324.56, emoji: '💳', description: 'Monthly minimum payment' },
      { id: 'phone', name: 'Phone Service', amount: 45.00, emoji: '📱', description: 'Mobile phone plan' }
    ];
  }

  // MePay helper methods
  private navigateToMePayPage(page: 'home' | 'send' | 'request' | 'sent' | 'requested'): void {
    this.currentMePayPage = page;
    this.currentMePayPageBinding.set(page);
  }

  private resetMePayState(): void {
    this.currentMePayPage = 'home';
    this.currentMePayPageBinding.set('home');
    this.selectedMePayContact = null;
    this.selectedMePayContactBinding.set(null);
    this.selectedRequestContact = null;
    this.selectedRequestContactBinding.set(null);
    this.sendAmount = '';
    this.sendAmountBinding.set('');
    this.requestAmount = '';
    this.requestAmountBinding.set('');
    this.showSendNumpad = false;
    this.showSendNumpadBinding.set(false);
    this.showRequestNumpad = false;
    this.showRequestNumpadBinding.set(false);
    this.selectedSendNote = '';
    this.selectedSendNoteBinding.set('');
    this.selectedRequestNote = '';
    this.selectedRequestNoteBinding.set('');
    this.lastTransaction = null;
    this.lastTransactionBinding.set(null);
  }

  private formatMePayAmount(amount: string): string {
    if (!amount) return '0';
    const num = parseInt(amount);
    if (isNaN(num)) return '0';
    return num.toString();
  }

  private createTransactionItem(transaction: Transaction): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center'
      },
      children: [
        // Transaction icon
        ui.View({
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 
              transaction.type === 'sent' ? '#FEE2E2' :
              transaction.type === 'received' ? '#DCFCE7' :
              transaction.type === 'bill' ? '#F3E8FF' : '#DBEAFE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(
                transaction.type === 'sent' ? "2808780245977101" : // arrow-up-right
                transaction.type === 'received' ? "2521912731541281" : // arrow-down-left  
                "769107079414002" // credit-card for bills/deposits
              ))),
              style: {
                width: 16,
                height: 16,
                tintColor: 
                  transaction.type === 'sent' ? '#DC2626' :
                  transaction.type === 'received' ? '#16A34A' :
                  transaction.type === 'bill' ? '#7C3AED' : '#2563EB'
              }
            })
          ]
        }),

        // Transaction details
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: transaction.description,
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: `${transaction.date} • ${transaction.category}`,
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            })
          ]
        }),

        // Amount
        ui.Text({
          text: `${transaction.amount > 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}`,
          style: {
            fontSize: 14,
            fontWeight: '500',
            color: transaction.amount > 0 ? '#16A34A' : '#111827'
          }
        })
      ]
    });
  }

  private createMePayContactField(
    label: string,
    selectedContact: MePayContact | null,
    contacts: MePayContact[],
    onSelect: (contact: MePayContact | null) => void
  ): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
      },
      children: [
        ui.Text({
          text: label,
          style: {
            fontSize: 14,
            fontWeight: '500',
            color: '#374151',
            marginBottom: 8
          }
        }),
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          },
          onPress: () => {
            // For now, just select the first contact as a demo
            if (contacts.length > 0) {
              onSelect(contacts[0]);
            }
          },
          children: [
            selectedContact ? ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: selectedContact.avatar,
                  style: {
                    fontSize: 16,
                    marginRight: 8
                  }
                }),
                ui.View({
                  children: [
                    ui.Text({
                      text: selectedContact.name,
                      style: {
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#111827'
                      }
                    }),
                    ui.Text({
                      text: selectedContact.phone,
                      style: {
                        fontSize: 12,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }) : ui.Text({
              text: 'Select a contact',
              style: {
                fontSize: 14,
                color: '#9CA3AF'
              }
            }),
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1162937905665096"))), // chevron-right
              style: {
                width: 16,
                height: 16,
                tintColor: '#9CA3AF'
              }
            })
          ]
        })
      ]
    });
  }

  private createMePayNoteField(
    label: string,
    selectedNote: string,
    onSelect: (note: string) => void
  ): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
      },
      children: [
        ui.Text({
          text: label,
          style: {
            fontSize: 14,
            fontWeight: '500',
            color: '#374151',
            marginBottom: 8
          }
        }),
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          },
          onPress: () => {
            // For now, just select the first note as a demo
            if (this.mePayNoteReasons.length > 0) {
              onSelect(this.mePayNoteReasons[0]);
            }
          },
          children: [
            ui.Text({
              text: selectedNote || 'Select a reason',
              style: {
                fontSize: 14,
                color: selectedNote ? '#111827' : '#9CA3AF'
              }
            }),
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1162937905665096"))), // chevron-right
              style: {
                width: 16,
                height: 16,
                tintColor: '#9CA3AF'
              }
            })
          ]
        })
      ]
    });
  }

  private renderMePayNumpad(isRequest: boolean): ui.UINode {
    const numpadKeys = [
      ['1', '2', '3'],
      ['4', '5', '6'], 
      ['7', '8', '9'],
      ['clear', '0', 'del']
    ];

    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderColor: '#E5E7EB'
      },
      children: [
        ui.View({
          style: {
            padding: 16
          },
          children: [
            // Numpad Grid
            ...numpadKeys.map((row, rowIndex) => 
              ui.View({
                style: {
                  flexDirection: 'row',
                  marginBottom: 8
                },
                children: row.map((key, keyIndex) => 
                  ui.Pressable({
                    style: {
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 8,
                      padding: 16,
                      marginHorizontal: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 48
                    },
                    onPress: () => {
                      this.handleMePayNumpadPress(key, isRequest);
                    },
                    children: [
                      key === 'del' ? ui.Image({
                        source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("802575082453612"))), // delete
                        style: {
                          width: 16,
                          height: 16,
                          tintColor: '#374151'
                        }
                      }) : ui.Text({
                        text: key === 'clear' ? 'Clear' : key,
                        style: {
                          fontSize: key === 'clear' ? 12 : 18,
                          fontWeight: '600',
                          color: '#374151'
                        }
                      })
                    ]
                  })
                )
              })
            ),

            // Confirm Button
            ui.Pressable({
              style: {
                backgroundColor: isRequest ? '#10B981' : '#3B82F6',
                borderRadius: 12,
                padding: 16,
                marginTop: 16
              },
              onPress: () => {
                if (isRequest) {
                  this.showRequestNumpad = false;
                  this.showRequestNumpadBinding.set(false);
                } else {
                  this.showSendNumpad = false;
                  this.showSendNumpadBinding.set(false);
                }
              },
              children: [
                ui.Text({
                  text: 'Confirm',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Continue Button
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderColor: '#E5E7EB',
            padding: 16
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: isRequest ? '#10B981' : '#3B82F6',
                borderRadius: 12,
                padding: 16
              },
              onPress: () => {
                if (isRequest) {
                  this.handleRequestMoney();
                } else {
                  this.handleSendMoney();
                }
              },
              children: [
                ui.Text({
                  text: isRequest ? 'Send Request' : 'Send Payment',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private handleMePayNumpadPress(key: string, isRequest: boolean): void {
    const currentAmount = isRequest ? this.requestAmount : this.sendAmount;
    const setAmount = isRequest ? 
      (amount: string) => {
        this.requestAmount = amount;
        this.requestAmountBinding.set(amount);
      } : 
      (amount: string) => {
        this.sendAmount = amount;
        this.sendAmountBinding.set(amount);
      };
    
    if (key === 'del') {
      setAmount(currentAmount.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('');
    } else if (key && key.length > 0) {
      // Limit total length
      if (currentAmount.length < 10) {
        setAmount(currentAmount + key);
      }
    }
  }

  private handleSendMoney(): void {
    this.lastTransaction = {
      type: 'sent',
      amount: this.sendAmount,
      contact: this.selectedMePayContact,
      note: this.selectedSendNote
    };
    this.lastTransactionBinding.set(this.lastTransaction);
    this.navigateToMePayPage('sent');
  }

  private handleRequestMoney(): void {
    this.lastTransaction = {
      type: 'requested',
      amount: this.requestAmount,
      contact: this.selectedRequestContact,
      note: this.selectedRequestNote
    };
    this.lastTransactionBinding.set(this.lastTransaction);
    this.navigateToMePayPage('requested');
  }

  private renderPaymentSentScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
      },
      children: [
        // Success Icon
        ui.View({
          style: {
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("4106264752923610"))), // circle-check
              style: {
                width: 40,
                height: 40,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Success Message
        ui.Text({
          text: 'Payment Sent Successfully!',
          style: {
            fontSize: 24,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 32
          }
        }),

        // Action Button
        ui.Pressable({
          style: {
            backgroundColor: '#059669',
            borderRadius: 12,
            padding: 16,
            width: '100%'
          },
          onPress: () => {
            this.navigateToMePayPage('home');
          },
          children: [
            ui.Text({
              text: 'Okay',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }

  private renderRequestSentScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
      },
      children: [
        // Success Icon
        ui.View({
          style: {
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("4106264752923610"))), // circle-check
              style: {
                width: 40,
                height: 40,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Success Message
        ui.Text({
          text: 'Request Sent Successfully!',
          style: {
            fontSize: 24,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 32
          }
        }),

        // Action Button
        ui.Pressable({
          style: {
            backgroundColor: '#2563EB',
            borderRadius: 12,
            padding: 16,
            width: '100%'
          },
          onPress: () => {
            this.navigateToMePayPage('home');
          },
          children: [
            ui.Text({
              text: 'Okay',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }
}

hz.Component.register(MePhone);

hz.Component.register(MePhone);
