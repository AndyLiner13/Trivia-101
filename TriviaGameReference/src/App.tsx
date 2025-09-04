import { useState } from "react";
import { KahootInterface } from "./components/KahootInterface";
import { GameConfigScreen } from "./components/GameConfigScreen";
import { EndGameScreen } from "./components/EndGameScreen";
import { ScoreboardScreen } from "./components/ScoreboardScreen";
import { AdminPanel } from "./components/AdminPanel";

type GameState = "config" | "playing" | "scoreboard" | "ended";

export default function App() {
  const [gameState, setGameState] = useState<GameState>("config");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(2);

  const handleStartGame = () => {
    setCurrentQuestion(1);
    setGameState("playing");
  };

  const handlePlayAgain = () => {
    setCurrentQuestion(1);
    setGameState("playing");
  };

  const handleEditSettings = () => {
    setGameState("config");
  };

  const handleQuestionComplete = () => {
    // If it's the last question, go directly to end game screen
    if (currentQuestion >= totalQuestions) {
      setGameState("ended");
    } else {
      setGameState("scoreboard");
    }
  };

  const handleScoreboardNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
      setGameState("playing");
    } else {
      setGameState("ended");
    }
  };

  // Admin panel handlers
  const handleStateChange = (state: GameState) => {
    setGameState(state);
  };

  const handleQuestionChange = (question: number) => {
    setCurrentQuestion(question);
  };

  const renderCurrentScreen = () => {
    switch (gameState) {
      case "config":
        return <GameConfigScreen onStartGame={handleStartGame} />;
      case "playing":
        return <KahootInterface questionNumber={currentQuestion} />;
      case "scoreboard":
        return <ScoreboardScreen onNext={handleScoreboardNext} questionNumber={currentQuestion} />;
      case "ended":
        return <EndGameScreen onPlayAgain={handlePlayAgain} onEditSettings={handleEditSettings} />;
      default:
        return <GameConfigScreen onStartGame={handleStartGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 gap-4">
      {/* Main Content Area */}
      <div className="flex-shrink-0">
        {renderCurrentScreen()}
      </div>
      
      {/* Admin Panel */}
      <AdminPanel
        currentState={gameState}
        onStateChange={handleStateChange}
        currentQuestion={currentQuestion}
        onQuestionChange={handleQuestionChange}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}