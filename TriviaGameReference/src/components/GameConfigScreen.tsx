import { Clock, Play, Pause, VolumeX, Baby, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Player {
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface GameConfigScreenProps {
  onStartGame: () => void;
}

export function GameConfigScreen({ onStartGame }: GameConfigScreenProps) {
  // Active game settings
  const gameSettings = {
    timeLimit: 30,
    autoAdvance: true,
    muteQuestions: false,
    numQuestions: 10,
    category: "Italian Brainrot",
    difficulty: "Medium"
  };

  // Mock players data - 20 players total
  const players: Player[] = [
    { name: "Alex Johnson", avatar: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwcm9maWxlJTIwYXZhdGFyfGVufDF8fHx8MTc1Njg4MTQwOXww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Sarah Davis", avatar: "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc1Njg3OTM3MXww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Mike Chen", avatar: "https://images.unsplash.com/photo-1652795385697-1e5e522c98d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "James Brown", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: false },
    { name: "Lisa Park", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGF2YXRhcnxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "David Kim", avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Rachel Green", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Tom Garcia", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Sophie Turner", avatar: "https://images.unsplash.com/photo-1494790108755-2616c6c78e1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Jake Miller", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: false },
    { name: "Maya Patel", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Chris Evans", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Zoe Adams", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Ryan Cooper", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Luna Martinez", avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: false },
    { name: "Noah Taylor", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Ava Thompson", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Ethan White", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Aria Rodriguez", avatar: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1Njg5NjA2NHww&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true },
    { name: "Logan Hayes", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTY4OTYwNjR8MA&ixlib=rb-4.0.3&q=80&w=1080", isOnline: true }
  ];

  return (
    <div className="w-[800px] h-[450px] bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden rounded-lg p-4 flex flex-col">
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-black">Waiting for Host...</h1>
      </div>

      {/* Players Section */}
      <div className="flex-1 mb-2">
        <h3 className="text-black font-semibold mb-2 text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{players.filter(p => p.isOnline).length}</span>
        </h3>
        <div className="grid grid-cols-7 gap-2 max-h-72 overflow-y-auto scrollbar-hide">
          {players.map((player) => (
            <div key={player.name} className="flex flex-col items-center space-y-1">
              <ImageWithFallback
                src={player.avatar}
                alt={player.name}
                className="w-16 h-16 rounded-lg object-cover shadow-lg"
              />
              <span className="text-black text-xs font-medium text-center leading-tight max-w-full truncate">
                {player.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Game Settings Panel - Full Width Bottom */}
      <div className="bg-white bg-opacity-90 rounded-lg p-2 backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-2 text-center">
          <div>
            <span className="text-gray-700 text-xs block mb-1">Category:</span>
            <span className="text-black text-xs font-medium">{gameSettings.category}</span>
          </div>
          <div>
            <span className="text-gray-700 text-xs block mb-1 invisible">Questions:</span>
            <span className="text-black text-xs font-medium">Q{gameSettings.numQuestions}</span>
          </div>
          <div>
            <span className="text-gray-700 text-xs block mb-1 invisible">Time:</span>
            <span className="text-black text-xs font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {gameSettings.timeLimit}s
            </span>
          </div>
          <div>
            <span className="text-gray-700 text-xs block mb-1 invisible">Difficulty:</span>
            <div className="flex items-center justify-center">
              <Baby className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <div>
            <span className="text-gray-700 text-xs block mb-1 invisible">Auto:</span>
            <div className="flex items-center justify-center gap-0.5">
              <Play className={`w-4 h-4 ${gameSettings.autoAdvance ? 'text-green-500' : 'text-gray-400'}`} />
              <Pause className={`w-4 h-4 ${gameSettings.autoAdvance ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </div>
          <div>
            <span className="text-gray-700 text-xs block mb-1 invisible">Audio:</span>
            <div className="flex items-center justify-center">
              <VolumeX className={`w-4 h-4 ${gameSettings.muteQuestions ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}