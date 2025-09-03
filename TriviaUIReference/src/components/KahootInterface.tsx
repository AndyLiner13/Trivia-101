import {
  Triangle,
  Hexagon,
  Circle,
  Square,
} from "lucide-react";

interface KahootInterfaceProps {
  questionNumber?: number;
}

export function KahootInterface({ questionNumber = 6 }: KahootInterfaceProps) {
  return (
    <div className="w-full max-w-6xl mx-auto aspect-video bg-gray-100 relative overflow-hidden rounded-lg">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-center bg-gray-100">
        {/* Question Number - Center */}
        <div className="text-center">
          <span className="text-2xl font-medium text-orange-500 text-[32px]">
            Q{questionNumber}
          </span>
        </div>
      </div>

      {/* Container spanning from timer to answer count */}
      <div className="absolute bottom-[65%] left-[4.75%] right-[4.75%] transform -translate-y-1/2">
        {/* Timer - Left, aligned with question */}
        <div className="absolute left-[4%] top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            30
          </div>
        </div>

        {/* Answer Count - Right, aligned with question */}
        <div className="absolute right-[4%] top-1/2 transform translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold text-gray-800">
            5
          </div>
          <div className="text-sm text-gray-600">Answers</div>
        </div>

        {/* Question Text - Positioned at center */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 max-w-4xl p-[24px]">
            <div className="text-black text-3xl font-medium text-[24px] break-words">
              What does "la vía" mean in English?
            </div>
          </div>
        </div>
      </div>

      {/* Answer Options */}
      <div className="absolute bottom-4 left-0 right-0 grid grid-cols-2 gap-4 px-6 h-40">
        {/* Red Answer */}
        <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-4 px-6 py-4 transition-colors">
          <Triangle className="w-8 h-8 fill-white" />
          <span className="text-xl font-medium">window</span>
        </button>

        {/* Blue Answer */}
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-4 px-6 py-4 transition-colors">
          <Hexagon className="w-8 h-8 fill-white" />
          <span className="text-xl font-medium">track</span>
        </button>

        {/* Yellow Answer */}
        <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center gap-4 px-6 py-4 transition-colors">
          <Circle className="w-8 h-8 fill-white" />
          <span className="text-xl font-medium">seat</span>
        </button>

        {/* Green Answer */}
        <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-4 px-6 py-4 transition-colors">
          <Square className="w-8 h-8 fill-white" />
          <span className="text-xl font-medium">train car</span>
        </button>
      </div>
    </div>
  );
}