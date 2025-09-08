import imgGameSettings from "figma:asset/353b66df49943b858b6521aa41f578cc56947a17.png";
import { 
  imgLightMode, 
  imgDarkMode, 
  imgLock, 
  imgTimerOff, 
  imgTimer, 
  imgMoreTime, 
  imgInfoI, 
  imgSentimentSatisfied, 
  imgSentimentNeutral, 
  imgSkull, 
  imgAutoplay, 
  imgBolt, 
  imgAllInclusive 
} from "./imports/svg-f5nda";

function ThemeSelector() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-end justify-start overflow-clip p-[4px] relative rounded-[8px] shrink-0">
      <div className="relative shrink-0 size-6">
        <img className="block max-w-none size-full" src={imgLightMode} />
      </div>
      <div className="relative shrink-0 size-6">
        <img className="block max-w-none size-full" src={imgDarkMode} />
      </div>
    </div>
  );
}

function LockButton() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[5px] shrink-0">
      <div className="relative shrink-0 size-6">
        <img className="block max-w-none size-full" src={imgLock} />
      </div>
    </div>
  );
}

function CategoryButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-0 relative w-full">
          <div className="basis-0 bg-[#191919] box-border content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip px-0 py-4 relative rounded-[8px] shrink-0">
            <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
              <p className="leading-[15px] whitespace-pre">{children}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimerOptions() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[8px] relative rounded-[8px] shrink-0">
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgTimerOff} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgTimer} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgMoreTime} />
      </div>
    </div>
  );
}

function DifficultyOptions() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start p-[8px] relative rounded-[8px] shrink-0">
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgSentimentSatisfied} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgSentimentNeutral} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgSkull} />
      </div>
    </div>
  );
}

function SpeedOptions() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start p-[8px] relative rounded-[8px] shrink-0">
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgAutoplay} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgBolt} />
      </div>
      <div className="relative shrink-0 size-9">
        <img className="block max-w-none size-full" src={imgAllInclusive} />
      </div>
    </div>
  );
}

function InfoButton() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[2px] relative rounded-[5px] shrink-0 size-8">
      <div className="relative shrink-0 size-7">
        <img className="block max-w-none size-full" src={imgInfoI} />
      </div>
    </div>
  );
}

function SettingsRow({ children, showInfo = true }: { children: React.ReactNode; showInfo?: boolean }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pl-4 pr-5 py-0 relative w-full">
          {children}
          {showInfo && <InfoButton />}
        </div>
      </div>
    </div>
  );
}

function ConfirmButton() {
  return (
    <div className="absolute box-border content-stretch flex gap-2 h-[58px] items-center justify-center left-0 p-[8px] top-[392px] w-[223px]">
      <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[8px] shrink-0">
        <div className="flex flex-row items-center justify-center relative size-full">
          <div className="box-border content-stretch flex gap-2 items-center justify-center p-[16px] relative size-full">
            <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] h-full justify-center leading-[0] not-italic relative shrink-0 text-[#111111] text-[18px] text-center w-[143px]">
              <p className="leading-[15px]">Confirm Settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative size-full flex items-center justify-center bg-gray-100">
      <div className="relative size-full max-w-[223px] max-h-[450px]">
        <div className="absolute bg-center bg-cover bg-no-repeat h-[450px] left-0 overflow-clip top-0 w-[223px]" style={{ backgroundImage: `url('${imgGameSettings}')` }}>
          {/* Settings Content */}
          <div className="absolute content-stretch flex flex-col gap-2 items-start justify-start left-0 top-0 w-[223px]">
            {/* Theme and Lock Row */}
            <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[8px] relative shrink-0 w-[223px]">
              <ThemeSelector />
              <LockButton />
            </div>

            {/* General Trivia - First Category with different padding */}
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center justify-center relative size-full">
                <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-0 relative w-full">
                  <div className="basis-0 bg-[#191919] box-border content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip px-0 py-3.5 relative rounded-[8px] shrink-0">
                    <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
                      <p className="leading-[15px] whitespace-pre">General Trivia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Categories */}
            <CategoryButton>Another Category</CategoryButton>
            <CategoryButton>Italian Brainrot</CategoryButton>

            {/* Timer Settings */}
            <SettingsRow>
              <TimerOptions />
            </SettingsRow>

            {/* Difficulty Settings */}
            <SettingsRow>
              <DifficultyOptions />
            </SettingsRow>

            {/* Speed Settings */}
            <SettingsRow>
              <SpeedOptions />
            </SettingsRow>
          </div>

          {/* Confirm Settings Button */}
          <ConfirmButton />
        </div>
      </div>
    </div>
  );
}