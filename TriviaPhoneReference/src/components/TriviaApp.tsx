import React, { useState, useEffect } from 'react';
import { Circle, Square, Triangle, Diamond, RotateCcw, Settings } from 'lucide-react';
import { GameSettings } from './GameSettings';

interface Question {
  id: number;
  question: string;
  answers: {
    text: string;
    correct: boolean;
  }[];
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    answers: [
      { text: "London", correct: false },
      { text: "Berlin", correct: false },
      { text: "Paris", correct: true },
      { text: "Madrid", correct: false }
    ]
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    answers: [
      { text: "Mars", correct: true },
      { text: "Venus", correct: false },
      { text: "Jupiter", correct: false },
      { text: "Saturn", correct: false }
    ]
  },
  {
    id: 3,
    question: "What is 7 × 8?",
    answers: [
      { text: "54", correct: false },
      { text: "56", correct: true },
      { text: "64", correct: false },
      { text: "48", correct: false }
    ]
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    answers: [
      { text: "Van Gogh", correct: false },
      { text: "Picasso", correct: false },
      { text: "Da Vinci", correct: true },
      { text: "Monet", correct: false }
    ]
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    answers: [
      { text: "Atlantic", correct: false },
      { text: "Pacific", correct: true },
      { text: "Indian", correct: false },
      { text: "Arctic", correct: false }
    ]
  }
];

const answerShapes = [
  { icon: Circle, color: 'bg-red-500', shape: 'Circle' },
  { icon: Square, color: 'bg-blue-500', shape: 'Square' },
  { icon: Triangle, color: 'bg-yellow-500', shape: 'Triangle' },
  { icon: Diamond, color: 'bg-green-500', shape: 'Diamond' }
];

type GameState = 'playing' | 'waiting' | 'feedback' | 'finished';

const quirkyWaitingMessages = [
  "🤔 Hmm... let me think about this...",
  "🎯 Calculating your genius level...",
  "🔮 Consulting the oracle of knowledge...",
  "🧠 Brain waves processing...",
  "⚡ Lightning-fast computation in progress...",
  "🎪 The suspense is killing me!",
  "🎲 Rolling the dice of destiny...",
  "🌟 Checking with the trivia gods...",
  "🔍 Investigating your answer...",
  "⏰ Time for the moment of truth...",
  "🎭 Drumroll please...",
  "🚀 Launching answer verification...",
  "🎨 Painting the results...",
  "🎵 Writing your trivia symphony...",
  "🏆 Preparing your fate..."
];

interface TriviaAppProps {
  onNavigateToHome?: () => void;
  viewMode?: 'pre-game-host' | 'pre-game-participant' | 'game' | 'feedback-correct' | 'feedback-wrong' | 'game-settings';
  onViewModeChange?: (mode: 'pre-game-host' | 'pre-game-participant' | 'game' | 'feedback-correct' | 'feedback-wrong' | 'game-settings') => void;
}

export function TriviaApp({ onNavigateToHome, viewMode = 'pre-game-host', onViewModeChange }: TriviaAppProps = {}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [gameSettings, setGameSettings] = useState({
    numberOfQuestions: 5,
    category: 'General Knowledge',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 30,
    autoAdvance: false,
    muteDuringQuestions: false,
    isLocked: false
  });

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === sampleQuestions.length - 1;

  // Calculate stats for leaderboard
  const totalQuestions = sampleQuestions.length;
  const questionsAnswered = currentQuestionIndex + (gameState === 'finished' ? 0 : (gameState === 'playing' ? 0 : 1));
  const accuracy = questionsAnswered > 0 ? Math.round((score / questionsAnswered) * 100) : 0;
  const questionsRemaining = totalQuestions - questionsAnswered;

  const handleAnswerSelect = (answerIndex: number) => {
    if (gameState !== 'playing') return;
    
    setSelectedAnswer(answerIndex);
    setGameState('waiting');
    
    // Show a random quirky message
    const randomMessage = quirkyWaitingMessages[Math.floor(Math.random() * quirkyWaitingMessages.length)];
    setWaitingMessage(randomMessage);
    
    // Check if answer is correct
    if (currentQuestion.answers[answerIndex].correct) {
      setScore(score + 1);
    }
    
    // Show waiting message for 1.5 seconds, then show feedback screen
    setTimeout(() => {
      setGameState('feedback');
      setShowResult(true);
    }, 1500);
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setWaitingMessage('');
    setGameState('playing');
  };

  const handleContinue = () => {
    if (isLastQuestion) {
      setGameState('finished');
    } else {
      nextQuestion();
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameState('playing');
    setSelectedAnswer(null);
    setShowResult(false);
    setWaitingMessage('');
  };

  const getAnswerStyle = (answerIndex: number) => {
    if (!showResult) {
      return answerShapes[answerIndex].color;
    }
    
    const isCorrect = currentQuestion.answers[answerIndex].correct;
    const isSelected = selectedAnswer === answerIndex;
    
    if (isCorrect) {
      return 'bg-green-600'; // Show correct answer in green
    } else if (isSelected && !isCorrect) {
      return 'bg-red-600'; // Show selected wrong answer in red
    } else {
      return 'bg-gray-400'; // Dim other answers
    }
  };

  // Game Settings View
  if (viewMode === 'game-settings') {
    return (
      <GameSettings
        onBack={() => onViewModeChange?.('pre-game-host')}
        settings={gameSettings}
        onSettingsChange={setGameSettings}
      />
    );
  }

  // Pre-Game Views
  if (viewMode === 'pre-game-host' || viewMode === 'pre-game-participant') {
    const isHost = viewMode === 'pre-game-host';
    return (
      <div className="h-full bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col text-white">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{
          padding: '16px',
          gap: 'clamp(0.75rem, 4cqw, 1rem)'
        }}>
          {/* Role Badge - Centered */}
          <div className="bg-white bg-opacity-20 rounded-2xl text-center text-black" style={{
            padding: 'clamp(2rem, 10cqw, 3rem)',
            maxWidth: '320px',
            width: '100%'
          }}>
            <div className={`${isHost ? 'bg-yellow-400' : 'bg-blue-400'} rounded-full mx-auto flex items-center justify-center`} style={{
              width: 'clamp(5rem, 25cqw, 8rem)',
              height: 'clamp(5rem, 25cqw, 8rem)',
              marginBottom: 'clamp(1.5rem, 8cqw, 2rem)'
            }}>
              <span style={{ fontSize: 'clamp(2.5rem, 12cqw, 4rem)' }}>
                {isHost ? '👑' : '👤'}
              </span>
            </div>
            <h2 className="text-black" style={{ fontSize: 'clamp(1.5rem, 8cqw, 2rem)', fontWeight: 'bold' }}>
              {isHost ? 'You are the host' : 'You are a participant'}
            </h2>
            {!isHost && (
              <p className="text-black" style={{ 
                fontSize: 'clamp(1rem, 6cqw, 1.25rem)', 
                marginTop: 'clamp(0.5rem, 3cqw, 1rem)',
                opacity: 0.8
              }}>
                Waiting for Host
              </p>
            )}
          </div>

          {/* Host Buttons */}
          {isHost && (
            <>
              {/* Game Settings Button */}
              <button
                onClick={() => onViewModeChange?.('game-settings')}
                className="bg-white text-purple-700 rounded-2xl font-bold flex items-center justify-center shadow-lg"
                style={{
                  padding: 'clamp(1.5rem, 8cqw, 2rem) clamp(3rem, 18cqw, 5rem)',
                  fontSize: 'clamp(1.25rem, 7cqw, 1.75rem)',
                  maxWidth: '320px',
                  width: '100%'
                }}
              >
                Game Settings
              </button>

              {/* Start Game Button */}
              <button
                onClick={resetGame}
                className="bg-white text-purple-700 rounded-2xl font-bold flex items-center justify-center shadow-lg"
                style={{
                  padding: 'clamp(1.5rem, 8cqw, 2rem) clamp(3rem, 18cqw, 5rem)',
                  fontSize: 'clamp(1.25rem, 7cqw, 1.75rem)',
                  maxWidth: '320px',
                  width: '100%'
                }}
              >
                Start Game
              </button>
            </>
          )}
        </div>
      </div>
    );
  }



  // Feedback Preview Views (Admin Panel)
  if (viewMode === 'feedback-correct' || viewMode === 'feedback-wrong') {
    const isCorrect = viewMode === 'feedback-correct';
    const mockQuestion = sampleQuestions[0]; // Use first question for preview
    const mockSelectedAnswer = isCorrect ? 
      mockQuestion.answers.findIndex(a => a.correct) : 
      mockQuestion.answers.findIndex(a => !a.correct);

    const getPreviewBackgroundStyle = () => {
      return isCorrect 
        ? "h-full bg-gradient-to-b from-green-500 to-green-700 flex flex-col text-white"
        : "h-full bg-gradient-to-b from-red-500 to-red-700 flex flex-col text-white";
    };

    return (
      <div className={getPreviewBackgroundStyle()}>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col" style={{
          padding: '16px'
        }}>
          {/* Feedback Screen Preview */}
          <div className="flex-1 flex flex-col items-center justify-center" style={{
            gap: 'clamp(2rem, 10cqw, 3rem)'
          }}>
            {/* Result Icon and Message */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center" style={{
                width: 'clamp(8rem, 40cqw, 12rem)',
                height: 'clamp(8rem, 40cqw, 12rem)',
                marginBottom: 'clamp(2rem, 10cqw, 3rem)'
              }}>
                <span style={{ fontSize: 'clamp(5rem, 25cqw, 8rem)' }}>
                  {isCorrect ? '✅' : '❌'}
                </span>
              </div>
              
              <h2 style={{ 
                fontSize: 'clamp(2.5rem, 15cqw, 4rem)', 
                fontWeight: 'bold'
              }}>
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </h2>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-white bg-opacity-90 border-t flex items-center justify-between" style={{
          padding: '12px 16px',
          gap: '16px'
        }}>
          <div className="text-center">
            <p className="text-gray-600" style={{ fontSize: 'clamp(0.875rem, 4.5cqw, 1rem)' }}>
              Question 1 of {sampleQuestions.length} (Preview)
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600" style={{ fontSize: 'clamp(0.875rem, 4.5cqw, 1rem)', fontWeight: 'bold' }}>
              Score: {isCorrect ? '1' : '0'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="h-full bg-gradient-to-b from-purple-500 to-purple-700 flex flex-col items-center justify-center text-white" style={{
        padding: 'clamp(1rem, 8cqw, 2rem)',
        gap: 'clamp(1.5rem, 8cqw, 2.5rem)'
      }}>
        <div className="text-center">
          <h1 style={{ fontSize: 'clamp(2rem, 12cqw, 3rem)', marginBottom: 'clamp(1rem, 6cqw, 1.5rem)' }}>
            🎉 Game Complete! 🎉
          </h1>
          <p style={{ fontSize: 'clamp(1.5rem, 9cqw, 2rem)', marginBottom: 'clamp(0.5rem, 3cqw, 1rem)' }}>
            Final Score
          </p>
          <p style={{ fontSize: 'clamp(3rem, 18cqw, 4rem)', fontWeight: 'bold' }}>
            {score}/{sampleQuestions.length}
          </p>
          <p style={{ fontSize: 'clamp(1rem, 6cqw, 1.25rem)' }}>
            {score === sampleQuestions.length ? 'Perfect!' : 
             score >= sampleQuestions.length * 0.8 ? 'Excellent!' :
             score >= sampleQuestions.length * 0.6 ? 'Good job!' : 'Keep trying!'}
          </p>
        </div>
        
        <button
          onClick={resetGame}
          className="bg-white text-purple-700 rounded-xl font-bold flex items-center justify-center"
          style={{
            padding: 'clamp(1rem, 6cqw, 1.5rem) clamp(2rem, 12cqw, 3rem)',
            fontSize: 'clamp(1rem, 6cqw, 1.25rem)',
            gap: 'clamp(0.5rem, 3cqw, 0.75rem)'
          }}
        >
          <RotateCcw style={{ width: 'clamp(1.25rem, 7cqw, 1.5rem)', height: 'clamp(1.25rem, 7cqw, 1.5rem)' }} />
          Play Again
        </button>
      </div>
    );
  }

  // Determine background color based on game state and result
  const getBackgroundStyle = () => {
    if (gameState === 'feedback' && showResult && selectedAnswer !== null) {
      const isCorrect = currentQuestion.answers[selectedAnswer].correct;
      return isCorrect 
        ? "h-full bg-gradient-to-b from-green-500 to-green-700 flex flex-col text-white"
        : "h-full bg-gradient-to-b from-red-500 to-red-700 flex flex-col text-white";
    }
    return "h-full bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col text-white";
  };

  return (
    <div className={getBackgroundStyle()}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{
        padding: '16px'
      }}>
        {/* Waiting State */}
        {gameState === 'waiting' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p style={{ 
                fontSize: 'clamp(1.125rem, 6.5cqw, 1.5rem)', 
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                {waitingMessage}
              </p>
            </div>
          </div>
        )}

        {/* Answer Choices Grid - Only shown during playing */}
        {gameState === 'playing' && (
          <div className="flex-1 grid grid-cols-2" style={{
            gap: '16px',
            gridTemplateRows: '1fr 1fr'
          }}>
            {currentQuestion.answers.map((answer, index) => {
              const shape = answerShapes[index];
              const IconComponent = shape.icon;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={gameState !== 'playing'}
                  className={`
                    ${getAnswerStyle(index)} 
                    rounded-2xl text-white font-bold flex items-center justify-center
                  `}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '0'
                  }}
                >
                  <IconComponent 
                    fill="currentColor"
                    style={{ 
                      width: 'min(25cqw, 25cqh, 4rem)', 
                      height: 'min(25cqw, 25cqh, 4rem)' 
                    }} 
                  />
                </button>
              );
            })}
          </div>
        )}
        
        {/* Feedback Screen - Full screen with continue button */}
        {gameState === 'feedback' && selectedAnswer !== null && (
          <div className="flex-1 flex flex-col items-center justify-center" style={{
            gap: 'clamp(2rem, 10cqw, 3rem)'
          }}>
            {/* Result Icon and Message */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center" style={{
                width: 'clamp(6rem, 30cqw, 10rem)',
                height: 'clamp(6rem, 30cqw, 10rem)',
                marginBottom: 'clamp(1.5rem, 8cqw, 2.5rem)'
              }}>
                <span style={{ fontSize: 'clamp(4rem, 20cqw, 6rem)' }}>
                  {currentQuestion.answers[selectedAnswer].correct ? '✅' : '❌'}
                </span>
              </div>
              
              <h2 style={{ 
                fontSize: 'clamp(2rem, 12cqw, 3rem)', 
                fontWeight: 'bold',
                marginBottom: 'clamp(1rem, 6cqw, 1.5rem)'
              }}>
                {currentQuestion.answers[selectedAnswer].correct ? 'Correct!' : 'Wrong!'}
              </h2>
              
              <p style={{ 
                fontSize: 'clamp(1.125rem, 6.5cqw, 1.5rem)',
                opacity: 0.9,
                marginBottom: 'clamp(1rem, 6cqw, 1.5rem)'
              }}>
                {currentQuestion.question}
              </p>
              
              {!currentQuestion.answers[selectedAnswer].correct && (
                <div className="bg-white bg-opacity-20 rounded-xl text-center" style={{
                  padding: 'clamp(1rem, 6cqw, 1.5rem)',
                  maxWidth: '300px',
                  margin: '0 auto'
                }}>
                  <p style={{ 
                    fontSize: 'clamp(0.875rem, 5cqw, 1rem)',
                    opacity: 0.8,
                    marginBottom: '4px'
                  }}>
                    Correct Answer:
                  </p>
                  <p style={{ 
                    fontSize: 'clamp(1rem, 6cqw, 1.25rem)',
                    fontWeight: 'bold'
                  }}>
                    {currentQuestion.answers.find(a => a.correct)?.text}
                  </p>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="bg-white bg-opacity-90 text-gray-900 rounded-2xl font-bold flex items-center justify-center"
              style={{
                padding: 'clamp(1rem, 6cqw, 1.5rem) clamp(2rem, 12cqw, 3rem)',
                fontSize: 'clamp(1rem, 6cqw, 1.25rem)',
                gap: 'clamp(0.5rem, 3cqw, 0.75rem)',
                maxWidth: '250px',
                width: '100%',
                color: currentQuestion.answers[selectedAnswer].correct ? '#16a34a' : '#dc2626'
              }}
            >
              {isLastQuestion ? 'Show Results' : 'Next Question'}
              <span style={{ fontSize: 'clamp(1rem, 6cqw, 1.25rem)' }}>
                {isLastQuestion ? '🏁' : '→'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white bg-opacity-90 border-t flex items-center justify-between" style={{
        padding: '12px 16px',
        gap: '16px'
      }}>
        <div className="text-center">
          <p className="text-gray-600" style={{ fontSize: 'clamp(0.875rem, 4.5cqw, 1rem)' }}>
            Question {currentQuestionIndex + 1} of {sampleQuestions.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600" style={{ fontSize: 'clamp(0.875rem, 4.5cqw, 1rem)', fontWeight: 'bold' }}>
            Score: {score}
          </p>
        </div>
      </div>
    </div>
  );
}