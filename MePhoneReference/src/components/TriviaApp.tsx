import React, { useState, useEffect } from 'react';
import { Circle, Square, Triangle, Diamond, RotateCcw, Home } from 'lucide-react';

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
  { icon: Circle, color: 'bg-red-500', hoverColor: 'hover:bg-red-400', shape: 'Circle' },
  { icon: Square, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-400', shape: 'Square' },
  { icon: Triangle, color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-400', shape: 'Triangle' },
  { icon: Diamond, color: 'bg-green-500', hoverColor: 'hover:bg-green-400', shape: 'Diamond' }
];

type GameState = 'playing' | 'waiting' | 'answered' | 'finished';

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
}

export function TriviaApp({ onNavigateToHome }: TriviaAppProps = {}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === sampleQuestions.length - 1;

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
    
    // Show waiting message for 1.5 seconds, then show result for 2 seconds
    setTimeout(() => {
      setGameState('answered');
      setShowResult(true);
      
      // Auto-advance after showing result for 2 seconds
      setTimeout(() => {
        if (isLastQuestion) {
          setGameState('finished');
        } else {
          nextQuestion();
        }
      }, 2000);
    }, 1500);
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setWaitingMessage('');
    setGameState('playing');
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
    if (gameState === 'answered' && showResult && selectedAnswer !== null) {
      const isCorrect = currentQuestion.answers[selectedAnswer].correct;
      return isCorrect 
        ? "h-full bg-gradient-to-b from-green-500 to-green-700 flex flex-col text-white"
        : "h-full bg-gradient-to-b from-red-500 to-red-700 flex flex-col text-white";
    }
    return "h-full bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col text-white";
  };

  return (
    <div className={getBackgroundStyle()}>
      {/* Standard Header */}
      <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
        padding: '12px 16px'
      }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <Home style={{ 
                width: '24px', 
                height: '24px' 
              }} className="text-gray-700" />
            </button>
          )}
        </div>
        <h1 className="font-medium capitalize text-gray-900" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Trivia</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{
        padding: '16px',
        paddingTop: 'calc(54px + 16px)',
        paddingBottom: '16px'
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
                    ${gameState === 'playing' ? shape.hoverColor : ''} 
                    rounded-2xl text-white font-bold flex items-center justify-center
                    ${gameState === 'playing' ? 'transform active:scale-95' : ''}
                    transition-all duration-150
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
        
        {/* Result feedback - Centered when buttons are hidden */}
        {showResult && gameState === 'answered' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{
              padding: '16px'
            }}>
              <p style={{ 
                fontSize: 'clamp(1.25rem, 7.5cqw, 1.75rem)', 
                fontWeight: 'bold',
                color: currentQuestion.answers[selectedAnswer!].correct ? '#22c55e' : '#ef4444'
              }}>
                {currentQuestion.answers[selectedAnswer!].correct ? '✅ Correct!' : '❌ Wrong!'}
              </p>
              {!currentQuestion.answers[selectedAnswer!].correct && (
                <p style={{ 
                  fontSize: 'clamp(1rem, 6cqw, 1.25rem)',
                  marginTop: '8px',
                  opacity: 0.9
                }}>
                  Correct answer: {currentQuestion.answers.find(a => a.correct)?.text}
                </p>
              )}
            </div>
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