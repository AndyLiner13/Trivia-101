import { useState, useEffect } from "react";
import { KahootInterface } from "./components/KahootInterface";
import { GameConfigScreen } from "./components/GameConfigScreen";
import { EndGameScreen } from "./components/EndGameScreen";
import { ScoreboardScreen } from "./components/ScoreboardScreen";

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

  // Auto-advance from playing to scoreboard after 5 seconds for demo
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setTimeout(() => {
        handleQuestionComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentQuestion]);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {renderCurrentScreen()}
    </div>
  );
}