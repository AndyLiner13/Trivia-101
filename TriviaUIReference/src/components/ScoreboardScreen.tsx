import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import exampleImage from 'figma:asset/9aba15909e2373b41e001825c158a095905f3617.png';

interface Player {
  name: string;
  score: number;
  avatar: string;
  emoji: string;
}

interface ScoreboardScreenProps {
  onNext: () => void;
  questionNumber: number;
}

export function ScoreboardScreen({ onNext, questionNumber }: ScoreboardScreenProps) {
  // Mock players data - sorted by score descending
  const players: Player[] = [
    {
      name: "Alex Johnson",
      score: 838,
      avatar: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyfGVufDF8fHx8MTc1Njg4MTQwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      emoji: "😎"
    },
    {
      name: "Sarah Davis", 
      score: 756,
      avatar: "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc1Njg3OTM3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      emoji: "🚀"
    },
    {
      name: "Mike Chen",
      score: 672,
      avatar: "https://images.unsplash.com/photo-1652795385697-1e5e522c98d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      emoji: "🔥"
    },
    {
      name: "Emma Wilson",
      score: 543,
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      emoji: "⭐"
    },
    {
      name: "James Brown",
      score: 498,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      emoji: "🎯"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto aspect-video relative overflow-hidden rounded-lg">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={exampleImage}
          alt="Scoreboard Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>

      {/* Header */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-white rounded-lg px-6 py-2 shadow-lg">
          <h1 className="text-xl font-bold text-gray-800">Scoreboard</h1>
        </div>
      </div>

      {/* Next Button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={onNext}
          className="bg-white hover:bg-gray-100 text-gray-800 px-3 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span className="text-sm">Next</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Scoreboard List */}
      <div className="absolute top-16 bottom-3 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-3 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between shadow-lg hover:bg-opacity-100 transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-gray-800 text-sm">{index + 1}</span>
                </div>

                {/* Avatar and Emoji */}
                <div className="relative flex-shrink-0">
                  <ImageWithFallback
                    src={player.avatar}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="text-xs">{player.emoji}</span>
                  </div>
                </div>

                {/* Name */}
                <span className="font-medium text-gray-800 text-sm truncate min-w-0">{player.name}</span>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-bold text-gray-800">{player.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}