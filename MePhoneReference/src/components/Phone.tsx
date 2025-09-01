import React, { useState } from 'react';
import { 
  Phone as PhoneIcon, 
  Calculator, 
  CreditCard, 
  Settings, 
  MessageCircle, 
  Users,
  Home,
  ArrowLeft
} from 'lucide-react';
import { AspectRatio } from './ui/aspect-ratio';
import { FavoritesProvider } from './shared/FavoritesContext';
import { NotificationsProvider, useNotifications } from './shared/NotificationsContext';

// Import app components
import { PhoneApp } from './apps/PhoneApp';
import { CalculatorApp } from './apps/CalculatorApp';
import { MePayApp } from './apps/MePayApp';
import { SettingsApp } from './apps/SettingsApp';
// import { MailApp } from './apps/MailApp'; // Replaced with MessagesApp
import { ContactsApp } from './apps/ContactsApp';
import { MessagesApp } from './apps/MessagesApp';

type AppType = 'home' | 'phone' | 'calculator' | 'mepay' | 'settings' | 'messages' | 'contacts';

interface AppNavigationData {
  contactId?: number;
  contactName?: string;
  contactPhone?: string;
  contactAvatar?: string;
  returnTo?: AppType;
}

type AppSelectFunction = (app: AppType, data?: AppNavigationData) => void;

const apps = [
  { id: 'phone' as AppType, name: 'Phone', icon: PhoneIcon, color: 'bg-green-500' },
  { id: 'messages' as AppType, name: 'Messages', icon: MessageCircle, color: 'bg-blue-600' },
  { id: 'contacts' as AppType, name: 'Contacts', icon: Users, color: 'bg-orange-500' },
  { id: 'mepay' as AppType, name: 'MePay', icon: CreditCard, color: 'bg-purple-500' },
  { id: 'calculator' as AppType, name: 'Calculator', icon: Calculator, color: 'bg-blue-500' },
  { id: 'settings' as AppType, name: 'Settings', icon: Settings, color: 'bg-gray-500' },
];

interface NavigationHistoryEntry {
  app: AppType;
  data?: AppNavigationData;
  isInSubpage: boolean;
}

export function Phone() {
  const [currentApp, setCurrentApp] = useState<AppType>('home');
  const [appNavigationData, setAppNavigationData] = useState<AppNavigationData | null>(null);
  const [time] = useState('12:34');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInSubpage, setIsInSubpage] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);

  const navigateToApp = (app: AppType, data?: AppNavigationData) => {
    // Add current state to history before navigating (but not if we're already at home)
    if (currentApp !== 'home') {
      setNavigationHistory(prev => [...prev, {
        app: currentApp,
        data: appNavigationData || undefined,
        isInSubpage: isInSubpage
      }]);
    }
    
    // Reset call state when navigating away from phone app
    if (currentApp === 'phone' && app !== 'phone') {
      setIsCallActive(false);
    }
    setCurrentApp(app);
    setAppNavigationData(data || null);
    setIsInSubpage(false); // Reset subpage state when switching apps
  };

  const navigateToHome = () => {
    // Reset call state when going home
    setIsCallActive(false);
    setCurrentApp('home');
    setAppNavigationData(null);
    setIsInSubpage(false);
    // Clear navigation history when going home
    setNavigationHistory([]);
  };

  const navigateBack = () => {
    // Reset call state when navigating back
    if (currentApp === 'phone') {
      setIsCallActive(false);
    }
    
    // If we're in a subpage, just exit the subpage
    if (isInSubpage) {
      setIsInSubpage(false);
      return;
    }
    
    // If there's navigation history, go back to the previous screen
    if (navigationHistory.length > 0) {
      const previousEntry = navigationHistory[navigationHistory.length - 1];
      const newHistory = navigationHistory.slice(0, -1);
      
      setCurrentApp(previousEntry.app);
      setAppNavigationData(previousEntry.data || null);
      setIsInSubpage(previousEntry.isInSubpage);
      setNavigationHistory(newHistory);
      return;
    }
    
    // If there's returnTo data, use it (legacy behavior)
    if (appNavigationData?.returnTo) {
      setCurrentApp(appNavigationData.returnTo);
      setAppNavigationData(null);
      setIsInSubpage(false);
      return;
    }
    
    // Fallback to home
    navigateToHome();
  };

  const renderApp = () => {
    switch (currentApp) {
      case 'phone':
        return <PhoneApp 
          navigationData={appNavigationData} 
          onNavigateToHome={navigateToHome}
          onNavigateBack={navigateBack} 
          onCallStateChange={setIsCallActive}
        />;
      case 'calculator':
        return <CalculatorApp onNavigateToHome={navigateToHome} />;
      case 'mepay':
        return <MePayApp onNavigateToHome={navigateToHome} onNavigateBack={navigateBack} />;
      case 'settings':
        return <SettingsApp onNavigateToHome={navigateToHome} onNavigateBack={navigateBack} />;
      case 'messages':
        return <MessagesApp navigationData={appNavigationData} onNavigateToHome={navigateToHome} onNavigateToApp={navigateToApp} />;
      case 'contacts':
        return <ContactsApp onNavigateToHome={navigateToHome} onNavigateToApp={(app, data) => navigateToApp(app, { ...data, returnTo: 'contacts' })} onNavigateBack={navigateBack} />;
      default:
        return <HomeScreen onAppSelect={(app) => navigateToApp(app)} />;
    }
  };

  return (
    <NotificationsProvider>
      <FavoritesProvider>
        <div className="mx-auto bg-black rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden" style={{ 
          padding: 'clamp(0.75rem, 4cqw, 1.25rem)',
          containerType: 'inline-size' 
        }}>
        {/* Phone Frame */}
        <div className="bg-black rounded-2xl overflow-hidden" style={{ 
          fontSize: 'clamp(0.6rem, 3.5cqw, 1rem)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Screen Content */}
          <div className="bg-white relative">
            <AspectRatio ratio={9/16}>
              {/* App Content */}
              <div className="h-full overflow-hidden absolute inset-0" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {renderApp()}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      </FavoritesProvider>
    </NotificationsProvider>
  );
}

function HomeScreen({ onAppSelect }: { onAppSelect: AppSelectFunction }) {
  return (
    <div className="h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center" style={{ 
      paddingLeft: '10%', 
      paddingRight: '10%' 
    }}>
      {/* App Grid - Full Screen Layout */}
      <div className="grid grid-cols-2 grid-rows-3 w-full h-full" style={{ 
        gap: 'clamp(1rem, 10cqw, 2rem)',
        paddingTop: 'clamp(1rem, 8cqw, 2rem)',
        paddingBottom: 'clamp(1rem, 8cqw, 2rem)'
      }}>
        {apps.map((app) => {
          const IconComponent = app.icon;
          
          return (
            <button
              key={app.id}
              onClick={() => onAppSelect(app.id)}
              className="flex flex-col items-center justify-center rounded-xl h-full relative" 
              style={{ 
                gap: 'clamp(0.25rem, 2cqw, 0.5rem)'
              }}
            >
              <div className={`${app.color} rounded-2xl flex items-center justify-center shadow-lg`} style={{ 
                width: 'clamp(4.5rem, 32cqw, 8rem)', 
                height: 'clamp(4.5rem, 32cqw, 8rem)' 
              }}>
                <IconComponent className="text-white" style={{ 
                  width: 'clamp(2.25rem, 16cqw, 4rem)', 
                  height: 'clamp(2.25rem, 16cqw, 4rem)' 
                }} />
              </div>
              <span className="text-white font-medium text-center" style={{ fontSize: 'clamp(0.875rem, 5cqw, 1.25rem)' }}>{app.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}