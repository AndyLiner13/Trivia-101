import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lock, LockOpen } from 'lucide-react';

interface GameSettingsProps {
  onBack: () => void;
  settings: {
    numberOfQuestions: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    autoAdvance: boolean;
    muteDuringQuestions: boolean;
    isLocked: boolean;
  };
  onSettingsChange: (settings: {
    numberOfQuestions: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    autoAdvance: boolean;
    muteDuringQuestions: boolean;
    isLocked: boolean;
  }) => void;
}

const categories = [
  'General Knowledge',
  'Italian Brainrot Quiz'
];

const questionCounts = [5, 10, 15, 20];
const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];
const timeLimits = [10, 15, 30, 45, 60]; // seconds

export function GameSettings({ onBack, settings, onSettingsChange }: GameSettingsProps) {
  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="h-full bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col text-white">
      {/* Lock/Unlock Header */}
      <div className="text-center" style={{
        padding: 'clamp(0.25rem, 1.5cqw, 0.5rem)'
      }}>
        <Button
          onClick={() => handleSettingChange('isLocked', !settings.isLocked)}
          variant="ghost"
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-2xl"
          style={{
            padding: 'clamp(0.75rem, 4cqw, 1rem)',
            fontSize: 'clamp(1rem, 5cqw, 1.125rem)',
            gap: 'clamp(0.5rem, 3cqw, 0.75rem)'
          }}
        >
          {settings.isLocked ? <Lock size={20} /> : <LockOpen size={20} />}
          {settings.isLocked ? 'Settings Locked' : 'Settings Unlocked'}
        </Button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div style={{
          padding: 'clamp(0.5rem, 3cqw, 0.75rem)',
          paddingBottom: 'clamp(1.5rem, 8cqw, 2rem)',
          opacity: settings.isLocked ? 0.6 : 1,
          pointerEvents: settings.isLocked ? 'none' : 'auto'
        }}>
          {/* Settings Sections */}
          <div className="flex flex-col" style={{
            gap: 'clamp(1rem, 6cqw, 1.5rem)'
          }}>
            
            {/* Number of Questions */}
            <div className="rounded-2xl" style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 'clamp(1rem, 6cqw, 1.5rem)'
            }}>
              <h2 className="text-white text-center" style={{
                fontSize: 'clamp(1.25rem, 7cqw, 1.5rem)',
                fontWeight: 'bold',
                marginBottom: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                Number of Questions
              </h2>
              <div className="grid grid-cols-4" style={{
                gap: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                {questionCounts.map(count => (
                  <Button
                    key={count}
                    variant={settings.numberOfQuestions === count ? "default" : "secondary"}
                    onClick={() => handleSettingChange('numberOfQuestions', count)}
                    className="bg-white bg-opacity-90 hover:bg-white text-gray-900 rounded-2xl font-bold border-0 shadow-md"
                    style={{
                      padding: 'clamp(1rem, 6cqw, 1.25rem)',
                      fontSize: 'clamp(1rem, 5cqw, 1.125rem)',
                      minHeight: 'clamp(3rem, 15cqw, 3.5rem)',
                      backgroundColor: settings.numberOfQuestions === count ? '#6366f1' : 'rgba(255,255,255,0.9)',
                      color: settings.numberOfQuestions === count ? 'white' : '#374151'
                    }}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="rounded-2xl" style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 'clamp(1rem, 6cqw, 1.5rem)'
            }}>
              <h2 className="text-white text-center" style={{
                fontSize: 'clamp(1.25rem, 7cqw, 1.5rem)',
                fontWeight: 'bold',
                marginBottom: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                Category
              </h2>
              <div className="grid grid-cols-1" style={{
                gap: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={settings.category === category ? "default" : "secondary"}
                    onClick={() => handleSettingChange('category', category)}
                    className="bg-white bg-opacity-90 hover:bg-white text-gray-900 rounded-2xl font-bold border-0 shadow-md text-center"
                    style={{
                      padding: 'clamp(1rem, 6cqw, 1.25rem)',
                      fontSize: 'clamp(1rem, 5.5cqw, 1.25rem)',
                      minHeight: 'clamp(3.5rem, 17cqw, 4rem)',
                      backgroundColor: settings.category === category ? '#6366f1' : 'rgba(255,255,255,0.9)',
                      color: settings.category === category ? 'white' : '#374151',
                      whiteSpace: 'normal',
                      lineHeight: '1.2'
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="rounded-2xl" style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 'clamp(1rem, 6cqw, 1.5rem)'
            }}>
              <h2 className="text-white text-center" style={{
                fontSize: 'clamp(1.25rem, 7cqw, 1.5rem)',
                fontWeight: 'bold',
                marginBottom: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                Difficulty
              </h2>
              <div className="grid grid-cols-3" style={{
                gap: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                {difficulties.map(diff => (
                  <Button
                    key={diff.value}
                    variant={settings.difficulty === diff.value ? "default" : "secondary"}
                    onClick={() => handleSettingChange('difficulty', diff.value)}
                    className="bg-white bg-opacity-90 hover:bg-white text-gray-900 rounded-2xl font-bold border-0 shadow-md"
                    style={{
                      padding: 'clamp(1rem, 6cqw, 1.25rem)',
                      fontSize: 'clamp(1rem, 5cqw, 1.125rem)',
                      minHeight: 'clamp(3rem, 15cqw, 3.5rem)',
                      backgroundColor: settings.difficulty === diff.value ? '#6366f1' : 'rgba(255,255,255,0.9)',
                      color: settings.difficulty === diff.value ? 'white' : '#374151'
                    }}
                  >
                    {diff.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Question Time Limit */}
            <div className="rounded-2xl" style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 'clamp(1rem, 6cqw, 1.5rem)'
            }}>
              <h2 className="text-white text-center" style={{
                fontSize: 'clamp(1.25rem, 7cqw, 1.5rem)',
                fontWeight: 'bold',
                marginBottom: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                Question Time Limit
              </h2>
              <div className="grid grid-cols-5" style={{
                gap: 'clamp(0.5rem, 3cqw, 0.75rem)'
              }}>
                {timeLimits.map(time => (
                  <Button
                    key={time}
                    variant={settings.timeLimit === time ? "default" : "secondary"}
                    onClick={() => handleSettingChange('timeLimit', time)}
                    className="bg-white bg-opacity-90 hover:bg-white text-gray-900 rounded-2xl font-bold border-0 shadow-md"
                    style={{
                      padding: 'clamp(0.75rem, 4cqw, 1rem)',
                      fontSize: 'clamp(0.875rem, 4.5cqw, 1rem)',
                      minHeight: 'clamp(3rem, 15cqw, 3.5rem)',
                      backgroundColor: settings.timeLimit === time ? '#6366f1' : 'rgba(255,255,255,0.9)',
                      color: settings.timeLimit === time ? 'white' : '#374151'
                    }}
                  >
                    {time}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Boolean Settings */}
            <div className="rounded-2xl" style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 'clamp(1rem, 6cqw, 1.5rem)'
            }}>
              <h2 className="text-white text-center" style={{
                fontSize: 'clamp(1.25rem, 7cqw, 1.5rem)',
                fontWeight: 'bold',
                marginBottom: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                Options
              </h2>
              
              <div className="grid grid-cols-1" style={{
                gap: 'clamp(0.75rem, 4cqw, 1rem)'
              }}>
                {/* Auto-Advance */}
                <Button
                  onClick={() => handleSettingChange('autoAdvance', !settings.autoAdvance)}
                  className="rounded-2xl font-bold border-0 shadow-md"
                  style={{
                    padding: 'clamp(1rem, 6cqw, 1.25rem)',
                    fontSize: 'clamp(1rem, 5cqw, 1.125rem)',
                    minHeight: 'clamp(3rem, 15cqw, 3.5rem)',
                    backgroundColor: settings.autoAdvance ? '#16a34a' : '#dc2626',
                    color: 'white'
                  }}
                >
                  Auto-Advance: {settings.autoAdvance ? 'ON' : 'OFF'}
                </Button>

                {/* Mute During Questions */}
                <Button
                  onClick={() => handleSettingChange('muteDuringQuestions', !settings.muteDuringQuestions)}
                  className="rounded-2xl font-bold border-0 shadow-md"
                  style={{
                    padding: 'clamp(1rem, 6cqw, 1.25rem)',
                    fontSize: 'clamp(1rem, 5cqw, 1.125rem)',
                    minHeight: 'clamp(3rem, 15cqw, 3.5rem)',
                    backgroundColor: settings.muteDuringQuestions ? '#16a34a' : '#dc2626',
                    color: 'white'
                  }}
                >
                  Mute Audio: {settings.muteDuringQuestions ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Confirm Button */}
      <div className="text-center" style={{
        padding: 'clamp(1rem, 6cqw, 1.5rem)',
        paddingTop: 'clamp(1.5rem, 8cqw, 2rem)',
        paddingBottom: 'clamp(2rem, 10cqw, 2.5rem)',
        backgroundColor: 'transparent'
      }}>
        <Button
          onClick={onBack}
          className="bg-white text-purple-700 hover:bg-gray-100 rounded-2xl font-bold shadow-lg"
          style={{
            padding: 'clamp(1.25rem, 7cqw, 1.75rem) clamp(2rem, 12cqw, 3rem)',
            fontSize: 'clamp(1.125rem, 6cqw, 1.5rem)',
            maxWidth: 'min(280px, calc(100% - 2rem))',
            width: '100%'
          }}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}