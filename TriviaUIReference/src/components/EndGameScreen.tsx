import { Trophy, RotateCcw, Settings } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Player {
  name: string;
  score: number;
  avatar: string;
}

interface EndGameScreenProps {
  onPlayAgain: () => void;
  onEditSettings: () => void;
}

export function EndGameScreen({ onPlayAgain, onEditSettings }: EndGameScreenProps) {
  // Mock top 3 players data
  const topPlayers: Player[] = [
    {
      name: "Alex Johnson",
      score: 8500,
      avatar: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyfGVufDF8fHx8MTc1Njg4MTQwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      name: "Sarah Davis",
      score: 7200,
      avatar: "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc1Njg3OTM3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      name: "Mike Chen",
      score: 6800,
      avatar: "https://images.unsplash.com/photo-1652795385697-1e5e522c98d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  const podiumColors = [
    "bg-gradient-to-t from-yellow-400 to-yellow-300", // 1st place - Gold
    "bg-gradient-to-t from-gray-400 to-gray-300",     // 2nd place - Silver
    "bg-gradient-to-t from-orange-400 to-orange-300"  // 3rd place - Bronze
  ];

  const podiumHeights = ["h-20", "h-16", "h-12"]; // 1st tallest, 2nd medium, 3rd shortest

  return (
    <div className="w-full max-w-6xl mx-auto aspect-video bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative overflow-hidden rounded-lg p-4">
      {/* Confetti/Celebration Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full opacity-80 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-pink-400 rounded-full opacity-80 animate-bounce delay-100"></div>
        <div className="absolute top-32 left-1/3 w-2 h-2 bg-green-400 rounded-full opacity-80 animate-bounce delay-200"></div>
        <div className="absolute top-16 right-1/3 w-3 h-3 bg-blue-400 rounded-full opacity-80 animate-bounce delay-300"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Game Complete!</h1>
          <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-400" />
        </div>
        <p className="text-purple-200 text-lg">Congratulations to our top performers!</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-6 mb-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <ImageWithFallback
              src={topPlayers[1].avatar}
              alt={topPlayers[1].name}
              className="w-16 h-16 rounded-full object-cover border-3 border-gray-300 shadow-lg"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-black font-bold text-xs">
              2
            </div>
          </div>
          <div className="text-center mb-1">
            <p className="text-white font-bold text-sm">{topPlayers[1].name}</p>
            <p className="text-gray-200 text-xs">{topPlayers[1].score.toLocaleString()} pts</p>
          </div>
          <div className={`w-20 h-16 ${podiumColors[1]} rounded-t-lg shadow-lg flex items-end justify-center pb-1`}>
            <span className="text-black font-bold text-lg">2nd</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <ImageWithFallback
              src={topPlayers[0].avatar}
              alt={topPlayers[0].name}
              className="w-20 h-20 rounded-full object-cover border-3 border-yellow-400 shadow-lg"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm">
              1
            </div>
            <Trophy className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="text-center mb-1">
            <p className="text-white font-bold text-lg">{topPlayers[0].name}</p>
            <p className="text-yellow-200 text-sm">{topPlayers[0].score.toLocaleString()} pts</p>
          </div>
          <div className={`w-24 h-20 ${podiumColors[0]} rounded-t-lg shadow-lg flex items-end justify-center pb-1`}>
            <span className="text-black font-bold text-xl">1st</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <ImageWithFallback
              src={topPlayers[2].avatar}
              alt={topPlayers[2].name}
              className="w-14 h-14 rounded-full object-cover border-3 border-orange-400 shadow-lg"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-black font-bold text-xs">
              3
            </div>
          </div>
          <div className="text-center mb-1">
            <p className="text-white font-bold text-sm">{topPlayers[2].name}</p>
            <p className="text-orange-200 text-xs">{topPlayers[2].score.toLocaleString()} pts</p>
          </div>
          <div className={`w-16 h-12 ${podiumColors[2]} rounded-t-lg shadow-lg flex items-end justify-center pb-1`}>
            <span className="text-black font-bold text-sm">3rd</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onPlayAgain}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
        <button
          onClick={onEditSettings}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-base transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configure
        </button>
      </div>
    </div>
  );
}