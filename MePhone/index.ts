// MePhone - Central phone interface types and utilities

export type ScreenType = 'home' | 'phone' | 'calculator' | 'contacts' | 'mail' | 'browser' | 'settings';

export interface AppNavigationData {
  contactId?: number;
  contactName?: string;
  contactPhone?: string;
  contactAvatar?: string;
  returnTo?: ScreenType;
  url?: string;
  productId?: string;
}

export interface NavigationHistoryEntry {
  app: ScreenType;
  data?: AppNavigationData;
  isInSubpage: boolean;
}

// App configuration
export interface AppConfig {
  id: ScreenType;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

export const APP_CONFIGS: AppConfig[] = [
  { id: 'phone', name: 'Phone', icon: '📞', color: '#10B981', description: 'Make calls and manage contacts' },
  { id: 'calculator', name: 'Calculator', icon: '🧮', color: '#3B82F6', description: 'Perform calculations' },
  { id: 'contacts', name: 'Contacts', icon: '👥', color: '#F97316', description: 'Manage your contacts' },
  { id: 'mail', name: 'MeMail', icon: '📧', color: '#EF4444', description: 'Email management' },
  { id: 'browser', name: 'Browser', icon: '🌐', color: '#8B5CF6', description: 'Browse the web' },
  { id: 'settings', name: 'Settings', icon: '⚙️', color: '#6B7280', description: 'Phone settings' }
];
