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
    <div className="w-[800px] h-[450px] bg-slate-950 relative overflow-hidden border border-slate-800">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Scan Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent absolute top-1/4 animate-pulse"></div>
        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent absolute top-3/4 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative text-center pt-12 pb-16">
        <div className="inline-block">
          <h1 className="text-4xl font-mono tracking-wider text-cyan-400 mb-2">
            GAME COMPLETE
          </h1>
          <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400/50 via-cyan-400 to-cyan-400/50"></div>
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-12 px-16">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border border-slate-600 bg-slate-900 rounded-sm overflow-hidden">
              <ImageWithFallback
                src={topPlayers[1].avatar}
                alt={topPlayers[1].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center">
              02
            </div>
          </div>
          <div className="text-center mb-4 space-y-1">
            <p className="text-slate-300 font-mono text-sm tracking-wide">{topPlayers[1].name.toUpperCase()}</p>
            <p className="text-slate-500 font-mono text-xs">{topPlayers[1].score.toLocaleString()}</p>
          </div>
          <div className="w-20 h-16 bg-slate-800 border border-slate-600 flex items-center justify-center">
            <span className="text-slate-400 font-mono text-sm">02</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-2 border-cyan-400 bg-slate-900 rounded-sm overflow-hidden shadow-lg shadow-cyan-400/20">
              <ImageWithFallback
                src={topPlayers[0].avatar}
                alt={topPlayers[0].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400 text-slate-950 text-sm font-mono flex items-center justify-center font-bold">
              01
            </div>
            <div className="absolute -inset-1 border border-cyan-400/30 animate-pulse"></div>
          </div>
          <div className="text-center mb-4 space-y-1">
            <p className="text-cyan-400 font-mono text-base tracking-wide font-bold">{topPlayers[0].name.toUpperCase()}</p>
            <p className="text-cyan-300 font-mono text-sm">{topPlayers[0].score.toLocaleString()}</p>
          </div>
          <div className="w-24 h-20 bg-cyan-400/10 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/10">
            <span className="text-cyan-400 font-mono text-lg font-bold">01</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-14 h-14 border border-slate-600 bg-slate-900 rounded-sm overflow-hidden">
              <ImageWithFallback
                src={topPlayers[2].avatar}
                alt={topPlayers[2].name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-500 text-slate-300 text-xs font-mono flex items-center justify-center">
              03
            </div>
          </div>
          <div className="text-center mb-4 space-y-1">
            <p className="text-slate-300 font-mono text-sm tracking-wide">{topPlayers[2].name.toUpperCase()}</p>
            <p className="text-slate-500 font-mono text-xs">{topPlayers[2].score.toLocaleString()}</p>
          </div>
          <div className="w-16 h-12 bg-slate-800 border border-slate-600 flex items-center justify-center">
            <span className="text-slate-400 font-mono text-sm">03</span>
          </div>
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-cyan-400/50 to-slate-800"></div>
    </div>
  );
}