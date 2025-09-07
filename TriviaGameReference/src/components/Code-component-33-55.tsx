import { Settings, Play, Trophy, BarChart3 } from "lucide-react";

type GameState = "config" | "playing" | "scoreboard" | "ended";

interface AdminPanelProps {
  currentState: GameState;
  onStateChange: (state: GameState) => void;
  currentQuestion: number;
  onQuestionChange: (question: number) => void;
  totalQuestions: number;
}

export function AdminPanel({ 
  currentState, 
  onStateChange, 
  currentQuestion, 
  onQuestionChange,
  totalQuestions 
}: AdminPanelProps) {
  const screenOptions: { state: GameState; label: string; icon: any; color: string }[] = [
    {
      state: "config",
      label: "Lobby",
      icon: Settings,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      state: "playing",
      label: "Quiz",
      icon: Play,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      state: "scoreboard",
      label: "Score",
      icon: BarChart3,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      state: "ended",
      label: "End",
      icon: Trophy,
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-6">
      {/* Screen Selection */}
      <div className="flex gap-2">
        {screenOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.state}
              onClick={() => onStateChange(option.state)}
              className={`flex items-center gap-1 px-3 py-2 rounded text-white font-medium text-xs transition-all ${
                currentState === option.state 
                  ? `${option.color} shadow-sm` 
                  : `${option.color} opacity-70 hover:opacity-100`
              }`}
            >
              <IconComponent className="w-3 h-3" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Question Controls (only show for playing/scoreboard) */}
      {(currentState === 'playing' || currentState === 'scoreboard') && (
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600">Question:</div>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((q) => (
              <button
                key={q}
                onClick={() => onQuestionChange(q)}
                className={`w-5 h-5 rounded-full font-medium text-xs transition-all ${
                  currentQuestion === q
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}