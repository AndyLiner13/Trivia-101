import { Trophy } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import backgroundImage from 'figma:asset/cad91586e214fa1ccd2c2c2b8b441412b340fe93.png';

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

  return (
    <div 
      className="w-[800px] h-[450px] relative overflow-hidden rounded-3xl border border-white/10"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better content visibility */}
      <div className="absolute inset-0 bg-black/30 rounded-3xl"></div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full">
        {/* Header */}
        <div className="relative text-center pt-8 pb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-400 fill-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Game Complete!</h1>
            <Trophy className="w-10 h-10 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        {/* Podium */}
        <div className="relative flex items-end justify-center gap-8 px-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <ImageWithFallback
                src={topPlayers[1].avatar}
                alt={topPlayers[1].name}
                className="w-16 h-16 rounded-xl object-cover shadow-lg"
              />
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-sm">{topPlayers[1].name}</p>
            </div>
            <div className="w-20 h-16 bg-gray-400 rounded-lg shadow-lg flex flex-col items-center justify-center">
              <span className="text-gray-800 font-bold text-lg">2nd</span>
              <span className="text-gray-700 text-xs font-medium">{topPlayers[1].score.toLocaleString()}</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <ImageWithFallback
                src={topPlayers[0].avatar}
                alt={topPlayers[0].name}
                className="w-20 h-20 rounded-xl object-cover shadow-lg"
              />
              <Trophy className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-lg">{topPlayers[0].name}</p>
            </div>
            <div className="w-24 h-20 bg-yellow-400 rounded-lg shadow-lg flex flex-col items-center justify-center">
              <span className="text-yellow-900 font-bold text-xl">1st</span>
              <span className="text-yellow-800 text-sm font-medium">{topPlayers[0].score.toLocaleString()}</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <ImageWithFallback
                src={topPlayers[2].avatar}
                alt={topPlayers[2].name}
                className="w-14 h-14 rounded-xl object-cover shadow-lg"
              />
            </div>
            <div className="text-center mb-3">
              <p className="text-white font-bold text-sm">{topPlayers[2].name}</p>
            </div>
            <div className="w-16 h-12 bg-orange-400 rounded-lg shadow-lg flex flex-col items-center justify-center">
              <span className="text-orange-900 font-bold text-base">3rd</span>
              <span className="text-orange-800 text-xs font-medium">{topPlayers[2].score.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}