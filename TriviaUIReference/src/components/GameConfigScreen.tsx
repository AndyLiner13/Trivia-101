import { useState } from "react";
import { Lock, Unlock, Play } from "lucide-react";

interface GameConfigScreenProps {
  onStartGame: () => void;
}

export function GameConfigScreen({ onStartGame }: GameConfigScreenProps) {
  const [timeLimit, setTimeLimit] = useState(30);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [muteQuestions, setMuteQuestions] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [category, setCategory] = useState("General");
  const [difficulty, setDifficulty] = useState("Medium");
  const [isLocked, setIsLocked] = useState(true);

  const timeLimitOptions = [10, 20, 30, 45, 60, 90];
  const questionOptions = [5, 10, 15, 20, 25];
  const categoryOptions = ["General", "Science", "History", "Sports", "Entertainment", "Geography"];
  const difficultyOptions = ["Easy", "Medium", "Hard"];

  return (
    <div className="w-full max-w-4xl mx-auto aspect-video bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden rounded-lg p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-1">Game Settings</h1>
        <p className="text-purple-200 text-sm">Configure your Kahoot game</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Question Time Limit */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Question Time Limit</h3>
            <div className="flex flex-wrap gap-1">
              {timeLimitOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeLimit(time)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    timeLimit === time
                      ? "bg-white text-purple-600 shadow-lg"
                      : "bg-purple-500 text-white hover:bg-purple-400"
                  }`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Advance */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Auto-Advance</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setAutoAdvance(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  autoAdvance
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-purple-500 text-white hover:bg-purple-400"
                }`}
              >
                On
              </button>
              <button
                onClick={() => setAutoAdvance(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !autoAdvance
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-purple-500 text-white hover:bg-purple-400"
                }`}
              >
                Off
              </button>
            </div>
          </div>

          {/* Mute During Questions */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Mute During Questions</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setMuteQuestions(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  muteQuestions
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-purple-500 text-white hover:bg-purple-400"
                }`}
              >
                On
              </button>
              <button
                onClick={() => setMuteQuestions(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !muteQuestions
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-purple-500 text-white hover:bg-purple-400"
                }`}
              >
                Off
              </button>
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Number of Questions</h3>
            <div className="flex flex-wrap gap-1">
              {questionOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => setNumQuestions(num)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    numQuestions === num
                      ? "bg-white text-purple-600 shadow-lg"
                      : "bg-purple-500 text-white hover:bg-purple-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Trivia Category */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Trivia Category</h3>
            <div className="grid grid-cols-2 gap-1">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1.5 rounded-md font-medium transition-all text-xs ${
                    category === cat
                      ? "bg-white text-purple-600 shadow-lg"
                      : "bg-purple-500 text-white hover:bg-purple-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Difficulty Level</h3>
            <div className="flex gap-1">
              {difficultyOptions.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    difficulty === diff
                      ? "bg-white text-purple-600 shadow-lg"
                      : "bg-purple-500 text-white hover:bg-purple-400"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Lock Settings */}
          <div>
            <h3 className="text-white font-medium mb-2 text-sm">Settings Access</h3>
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isLocked
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-green-500 text-white hover:bg-green-400"
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="text-sm">{isLocked ? "Locked" : "Unlocked"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <div className="text-center">
        <button
          onClick={onStartGame}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5 fill-white" />
          Start Game
        </button>
      </div>
    </div>
  );
}