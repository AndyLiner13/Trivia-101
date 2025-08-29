import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationsContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  hasUnreadNotifications: boolean;
  setHasUnreadNotifications: (hasUnread: boolean) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  return (
    <NotificationsContext.Provider 
      value={{ 
        notificationsEnabled, 
        setNotificationsEnabled,
        hasUnreadNotifications,
        setHasUnreadNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}