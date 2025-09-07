import { Trophy, Crown, Star, Sparkles } from "lucide-react";
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

  return (
    <div className="w-[800px] h-[450px] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden rounded-2xl shadow-2xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Stars */}
        <Star className="absolute top-12 left-16 w-3 h-3 text-yellow-300 opacity-80 animate-pulse" />
        <Star className="absolute top-24 right-24 w-2 h-2 text-pink-300 opacity-60 animate-pulse delay-500" />
        <Star className="absolute top-36 left-1/4 w-4 h-4 text-blue-300 opacity-70 animate-pulse delay-1000" />
        <Star className="absolute top-20 right-1/3 w-2.5 h-2.5 text-purple-300 opacity-80 animate-pulse delay-700" />
        
        {/* Sparkles */}
        <Sparkles className="absolute top-16 left-1/3 w-5 h-5 text-yellow-400 opacity-90 animate-bounce delay-300" />
        <Sparkles className="absolute top-28 right-16 w-4 h-4 text-pink-400 opacity-80 animate-bounce delay-800" />
        
        {/* Floating Confetti */}
        <div className="absolute top-8 left-12 w-3 h-3 bg-yellow-400 rounded-full opacity-90 animate-bounce delay-200" style={{animationDuration: '2s'}}></div>
        <div className="absolute top-20 right-20 w-2 h-2 bg-pink-400 rounded-full opacity-80 animate-bounce delay-600" style={{animationDuration: '2.5s'}}></div>
        <div className="absolute top-32 left-1/3 w-2.5 h-2.5 bg-blue-400 rounded-full opacity-90 animate-bounce delay-1000" style={{animationDuration: '1.8s'}}></div>
        <div className="absolute top-14 right-1/4 w-2 h-2 bg-green-400 rounded-full opacity-85 animate-bounce delay-1200" style={{animationDuration: '2.2s'}}></div>
        
        {/* Additional geometric shapes */}
        <div className="absolute top-10 left-3/4 w-3 h-3 bg-purple-400 rotate-45 opacity-70 animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute top-30 left-1/5 w-2 h-2 bg-cyan-400 rotate-45 opacity-80 animate-spin delay-500" style={{animationDuration: '6s'}}></div>
      </div>

      {/* Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

      {/* Header */}
      <div className="relative text-center pt-6 pb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
          <Trophy className="w-10 h-10 text-yellow-400 fill-yellow-400" />
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
            Victory!
          </h1>
          <Trophy className="w-10 h-10 text-yellow-400 fill-yellow-400" />
          <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
        </div>
        <div className="text-yellow-200/80 text-lg font-medium">Champions Crowned</div>
      </div>

      {/* Podium */}
      <div className="relative flex items-end justify-center gap-8 px-8">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <ImageWithFallback
              src={topPlayers[1].avatar}
              alt={topPlayers[1].name}
              className="relative w-16 h-16 rounded-full object-cover border-3 border-gray-300 shadow-xl"
            />
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg">
              2
            </div>
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-gray-400 rounded-full opacity-60 animate-ping"></div>
          </div>
          <div className="text-center mb-2">
            <p className="text-white font-bold text-sm tracking-wide">{topPlayers[1].name}</p>
            <p className="text-gray-300 text-xs font-medium">{topPlayers[1].score.toLocaleString()}</p>
          </div>
          <div className="w-22 h-18 bg-gradient-to-t from-gray-500 via-gray-400 to-gray-300 rounded-t-xl shadow-2xl border-t-2 border-gray-200 flex items-end justify-center pb-2">
            <span className="text-gray-800 font-bold text-lg">2nd</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <ImageWithFallback
              src={topPlayers[0].avatar}
              alt={topPlayers[0].name}
              className="relative w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-2xl"
            />
            <div className="absolute -top-3 -right-3 w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-base shadow-xl">
              1
            </div>
            <Crown className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-yellow-400 rounded-full opacity-60 animate-ping"></div>
          </div>
          <div className="text-center mb-2">
            <p className="text-white font-bold text-lg tracking-wide">{topPlayers[0].name}</p>
            <p className="text-yellow-200 text-sm font-medium">{topPlayers[0].score.toLocaleString()}</p>
          </div>
          <div className="w-28 h-24 bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-300 rounded-t-xl shadow-2xl border-t-4 border-yellow-200 flex items-end justify-center pb-2">
            <span className="text-yellow-900 font-bold text-xl">1st</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <ImageWithFallback
              src={topPlayers[2].avatar}
              alt={topPlayers[2].name}
              className="relative w-14 h-14 rounded-full object-cover border-3 border-orange-400 shadow-xl"
            />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
              3
            </div>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 rounded-full opacity-60 animate-ping"></div>
          </div>
          <div className="text-center mb-2">
            <p className="text-white font-bold text-sm tracking-wide">{topPlayers[2].name}</p>
            <p className="text-orange-200 text-xs font-medium">{topPlayers[2].score.toLocaleString()}</p>
          </div>
          <div className="w-18 h-14 bg-gradient-to-t from-red-500 via-orange-400 to-orange-300 rounded-t-xl shadow-2xl border-t-2 border-orange-200 flex items-end justify-center pb-2">
            <span className="text-orange-900 font-bold text-base">3rd</span>
          </div>
        </div>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-32 bg-gradient-to-t from-yellow-400/20 via-purple-400/10 to-transparent rounded-full blur-xl"></div>
    </div>
  );
}