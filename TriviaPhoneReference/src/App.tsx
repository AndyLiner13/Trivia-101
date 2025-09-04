import { Phone } from './components/Phone';
import { AdminPanel } from './components/AdminPanel';
import { useState } from 'react';

export default function App() {
  const [currentApp, setCurrentApp] = useState<string>('home');
  const [triviaView, setTriviaView] = useState<'pre-game-host' | 'pre-game-participant' | 'game' | 'feedback-correct' | 'feedback-wrong' | 'game-settings'>('pre-game-host');

  const handleAppChange = (app: string) => {
    setCurrentApp(app);
  };

  const showAdminPanel = currentApp === 'trivia';

  return (
    <div className="size-full flex items-center justify-center bg-gray-100" style={{ padding: 'clamp(0.5rem, 2vw, 2rem)' }}>
      <div className="flex items-center justify-center" style={{ gap: 'clamp(1rem, 4vw, 2rem)', width: '100%' }}>
        {/* Phone Container */}
        <div style={{ width: '100%', maxWidth: 'clamp(20rem, 40vw, 40rem)' }}>
          <Phone onAppChange={handleAppChange} triviaView={triviaView} onTriviaViewChange={setTriviaView} />
        </div>
        
        {/* Admin Panel - Only shown for TriviaApp */}
        {showAdminPanel && (
          <AdminPanel 
            currentView={triviaView}
            onViewChange={setTriviaView}
          />
        )}
      </div>
    </div>
  );
}