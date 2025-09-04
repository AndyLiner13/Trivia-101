import React from 'react';
import { GamepadIcon, CheckCircle, XCircle, Crown, Users, Settings } from 'lucide-react';

interface AdminPanelProps {
  currentView: 'pre-game-host' | 'pre-game-participant' | 'game' | 'feedback-correct' | 'feedback-wrong' | 'game-settings';
  onViewChange: (view: 'pre-game-host' | 'pre-game-participant' | 'game' | 'feedback-correct' | 'feedback-wrong' | 'game-settings') => void;
}

export function AdminPanel({ currentView, onViewChange }: AdminPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200" style={{
      width: 'clamp(12rem, 20vw, 16rem)',
      padding: 'clamp(1rem, 2vw, 1.5rem)'
    }}>
      <h3 className="text-gray-800 font-medium mb-4" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
        Admin Panel
      </h3>
      
      <div className="space-y-2">
        {/* Pre-Game Section */}
        <div className="space-y-1">
          <p className="text-gray-600 px-2" style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}>
            Pre-Game Views
          </p>
          <button
            onClick={() => onViewChange('pre-game-host')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'pre-game-host'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <Crown style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Host View
          </button>
          
          <button
            onClick={() => onViewChange('pre-game-participant')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'pre-game-participant'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <Users style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Participant View
          </button>
          
          <button
            onClick={() => onViewChange('game-settings')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'game-settings'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <Settings style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Game Settings
          </button>
        </div>
        
        {/* Active Game Section */}
        <div className="space-y-1">
          <p className="text-gray-600 px-2" style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}>
            Active Game Views
          </p>
          <button
            onClick={() => onViewChange('game')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'game'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <GamepadIcon style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Question View
          </button>
          
          <button
            onClick={() => onViewChange('feedback-correct')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'feedback-correct'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <CheckCircle style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Correct Feedback
          </button>
          
          <button
            onClick={() => onViewChange('feedback-wrong')}
            className={`w-full flex items-center justify-start rounded-lg border font-medium ${
              currentView === 'feedback-wrong'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 1.25vw, 0.875rem)',
              gap: 'clamp(0.25rem, 0.5vw, 0.5rem)'
            }}
          >
            <XCircle style={{ 
              width: 'clamp(0.875rem, 1.5vw, 1rem)', 
              height: 'clamp(0.875rem, 1.5vw, 1rem)' 
            }} />
            Wrong Feedback
          </button>
        </div>
        

      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-gray-500 text-center" style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}>
          Navigate between game states
        </p>
        <p className="text-gray-400 text-center mt-1" style={{ fontSize: 'clamp(0.5rem, 0.8vw, 0.625rem)' }}>
          Preview all trivia app screens and user roles
        </p>
      </div>
    </div>
  );
}