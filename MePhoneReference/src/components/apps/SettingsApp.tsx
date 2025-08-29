import React, { useState } from "react";
import {
  ChevronRight,
  Volume2,
  Battery,
  Bell,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Home,
  Play,
  Check,

} from "lucide-react";
import { ListItem } from '../shared/ListItem';
import { SectionHeader } from '../shared/SectionHeader';
import { useNotifications } from '../shared/NotificationsContext';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface Ringtone {
  id: string;
  name: string;
  category: string;
  duration: string;
}

interface SettingsAppProps {
  onNavigateToHome?: () => void;
  onNavigateBack?: () => void;
}

export function SettingsApp({ onNavigateToHome, onNavigateBack }: SettingsAppProps) {
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const [currentView, setCurrentView] = useState<
    "main" | "ringtones"
  >("main");
  const [selectedRingtone, setSelectedRingtone] =
    useState("classic-ring");

  const ringtones: Ringtone[] = [
    {
      id: "classic-ring",
      name: "Classic Ring",
      category: "Default",
      duration: "0:03",
    },
    {
      id: "digital-bell",
      name: "Digital Bell",
      category: "Default",
      duration: "0:02",
    },
    {
      id: "modern-chime",
      name: "Modern Chime",
      category: "Default",
      duration: "0:03",
    },
    {
      id: "my-recording",
      name: "My Recording",
      category: "Custom",
      duration: "0:05",
    },
    {
      id: "uploaded-song",
      name: "Uploaded Song",
      category: "Custom",
      duration: "0:30",
    },
    {
      id: "custom-tone",
      name: "Custom Tone",
      category: "Custom",
      duration: "0:08",
    },
  ];

  const settingSections = [
    {
      title: "Device",
      items: [
        {
          icon: Volume2,
          label: "Ringtones",
          hasArrow: true,
          onClick: () => {
            setCurrentView("ringtones");
          },
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          toggle: {
            enabled: notificationsEnabled,
            onChange: setNotificationsEnabled,
          },
        },
      ],
    },
  ];

  const ToggleButton = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`transition-colors duration-200 ${
        enabled ? "text-blue-500" : "text-gray-400"
      }`}
    >
      {enabled ? (
        <ToggleRight 
          style={{ 
            width: 'clamp(1.5rem, 8cqw, 2rem)', 
            height: 'clamp(1.5rem, 8cqw, 2rem)' 
          }}
          className="drop-shadow-sm"
        />
      ) : (
        <ToggleLeft 
          style={{ 
            width: 'clamp(1.5rem, 8cqw, 2rem)', 
            height: 'clamp(1.5rem, 8cqw, 2rem)' 
          }}
          className="drop-shadow-sm"
        />
      )}
    </button>
  );

  const RingtonePage = () => {
    const categories = [
      ...new Set(ringtones.map((r) => r.category)),
    ];

    return (
      <div className="h-full bg-gray-50 overflow-y-auto" style={{ paddingTop: '54px' }}>
        {/* Header */}
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
              onClick={() => setCurrentView("main")}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <ArrowLeft style={{ 
                width: '24px', 
                height: '24px' 
              }} />
            </button>
          </div>
          <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Ringtones</h1>
        </div>

        {/* Current Ringtone Section */}
        <div>
          <SectionHeader
            title="CURRENT RINGTONE"
          />
          <div className="bg-white">
            <ListItem
              leftContent={Volume2}
              title={ringtones.find((r) => r.id === selectedRingtone)?.name || 'Unknown'}
              rightContent={(
                <button className="bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200" style={{ 
                  padding: 'clamp(0.5rem, 3cqw, 0.75rem)' 
                }}>
                  <Play style={{ 
                    width: 'clamp(1rem, 5cqw, 1.25rem)', 
                    height: 'clamp(1rem, 5cqw, 1.25rem)' 
                  }} />
                </button>
              )}
            />
          </div>
        </div>

        {/* Ringtone Categories */}
        {categories.map((category) => (
          <div key={category}>
            <SectionHeader
              title={category}
            />
            <div className="bg-white divide-y">
              {ringtones
                .filter(
                  (ringtone) =>
                    ringtone.category === category,
                )
                .map((ringtone, index) => (
                  <ListItem
                    key={ringtone.id}
                    leftContent="🎵"
                    title={ringtone.name}
                    rightContent={
                      selectedRingtone === ringtone.id ? (
                        <div className="bg-blue-500 rounded-xl flex items-center justify-center" style={{ 
                          width: 'clamp(1.5rem, 7cqw, 1.75rem)', 
                          height: 'clamp(1.5rem, 7cqw, 1.75rem)' 
                        }}>
                          <Check style={{ 
                            width: 'clamp(1rem, 5cqw, 1.25rem)', 
                            height: 'clamp(1rem, 5cqw, 1.25rem)' 
                          }} className="text-white" />
                        </div>
                      ) : (
                        <button
                          className="hover:bg-gray-100 rounded-lg"
                          style={{ padding: 'clamp(0.5rem, 3cqw, 0.75rem)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Preview functionality would go here
                          }}
                        >
                          <Play style={{ 
                            width: 'clamp(1rem, 5cqw, 1.25rem)', 
                            height: 'clamp(1rem, 5cqw, 1.25rem)' 
                          }} className="text-gray-500" />
                        </button>
                      )
                    }
                    onClick={() => setSelectedRingtone(ringtone.id)}
                    isSelected={selectedRingtone === ringtone.id}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (currentView === "ringtones") {
    return <RingtonePage />;
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto" style={{ paddingTop: '54px' }}>
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
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Settings</h1>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <SectionHeader
            title={section.title}
          />
          <div className="bg-white divide-y">
            {section.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              
              let rightContent;
              if (item.toggle) {
                rightContent = (
                  <ToggleButton
                    enabled={item.toggle.enabled}
                    onChange={item.toggle.onChange}
                  />
                );
              } else if (item.hasArrow) {
                rightContent = ChevronRight;
              }
              
              return (
                <ListItem
                  key={itemIndex}
                  leftContent={IconComponent}
                  title={item.label}
                  subtitle={item.value}
                  rightContent={rightContent}
                  onClick={item.onClick}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}