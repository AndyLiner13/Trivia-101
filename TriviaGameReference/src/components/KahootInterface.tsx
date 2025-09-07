import {
  Triangle,
  Hexagon,
  Circle,
  Square,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import sharkImage from 'figma:asset/4aa277b2cd0e9ccb57def90be4bb34af726b33dd.png';
import planeImage from 'figma:asset/04e99330b7520fca4f64603839ec04dceac2d7b6.png';
import backgroundImage from 'figma:asset/cad91586e214fa1ccd2c2c2b8b441412b340fe93.png';

interface KahootInterfaceProps {
  questionNumber?: number;
}

export function KahootInterface({ questionNumber = 6 }: KahootInterfaceProps) {
  // Italian brainrot quiz content
  const quizData = {
    1: {
      question: "Who is this?",
      image: sharkImage,
      answers: ["shark", "dolphin", "whale", "fish"]
    },
    2: {
      question: "Who is this?",
      image: planeImage,
      answers: ["car", "plane", "helicopter", "boat"]
    }
  };

  const currentQuiz = quizData[questionNumber as keyof typeof quizData] || quizData[1];
  return (
    <div 
      className="w-[800px] h-[450px] relative overflow-hidden rounded-lg border border-white/10"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better content visibility */}
      <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full">
        {/* Header with inline Question Number and Question Text */}
        <div className="absolute top-4 left-0 right-0 px-8">
          <div className="flex justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-6 py-4 flex items-center gap-4 border border-white/20">
              <span className="text-2xl font-medium text-orange-500">
                Q{questionNumber}
              </span>
              <div className="text-black font-medium text-lg">
                {currentQuiz.question}
              </div>
            </div>
          </div>
        </div>

        {/* Brainrot Image - Full image display with hugging container */}
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 inline-flex border border-white/20">
            <ImageWithFallback
              src={currentQuiz.image}
              alt="Brainrot meme"
              className="max-w-96 max-h-52 object-contain rounded-md"
            />
          </div>
        </div>

        {/* Timer and Answer Count - Positioned at image level */}
        <div className="absolute top-40 left-0 right-0 px-8">
          {/* Timer - Left */}
          <div className="absolute left-8">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              30
            </div>
          </div>

          {/* Answer Count - Right */}
          <div className="absolute right-8 text-center">
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-xs text-white/70">Answers</div>
          </div>
        </div>

        {/* Answer Options */}
        <div className="absolute bottom-4 left-0 right-0 grid grid-cols-2 gap-4 px-6 h-32">
          {/* Red Answer */}
          <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-3 px-4 py-3 transition-colors shadow-lg">
            <Triangle className="w-6 h-6 fill-white flex-shrink-0" />
            <span className="font-medium text-sm text-center flex-1">{currentQuiz.answers[0]}</span>
          </button>

          {/* Blue Answer */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-3 px-4 py-3 transition-colors shadow-lg">
            <Hexagon className="w-6 h-6 fill-white flex-shrink-0" />
            <span className="font-medium text-sm text-center flex-1">{currentQuiz.answers[1]}</span>
          </button>

          {/* Yellow Answer */}
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center gap-3 px-4 py-3 transition-colors shadow-lg">
            <Circle className="w-6 h-6 fill-white flex-shrink-0" />
            <span className="font-medium text-sm text-center flex-1">{currentQuiz.answers[2]}</span>
          </button>

          {/* Green Answer */}
          <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-3 px-4 py-3 transition-colors shadow-lg">
            <Square className="w-6 h-6 fill-white flex-shrink-0" />
            <span className="font-medium text-sm text-center flex-1">{currentQuiz.answers[3]}</span>
          </button>
        </div>
      </div>
    </div>
  );
}