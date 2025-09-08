import imgFrame79 from "figma:asset/91ddc406ccbb3263d52aeeaec992b22d1c96c743.png";
import { imgCheck, imgLightMode, imgDarkMode, imgLogout } from "../imports/svg-bw6lr";

interface SuccessScreenProps {
  points?: number;
  onThemeToggle?: () => void;
  onLogout?: () => void;
}

function CheckIcon() {
  return (
    <div className="relative shrink-0 size-[136px]" data-name="check">
      <img className="block max-w-none size-full" src={imgCheck} />
    </div>
  );
}

function CheckContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-2.5 h-[92px] items-center justify-center left-0 top-[148px] w-[223px]">
      <CheckIcon />
    </div>
  );
}

function PointsDisplay({ points = 1200 }: { points?: number }) {
  return (
    <div className="absolute box-border content-stretch flex gap-2 h-[152px] items-start justify-center left-0 pb-0 pt-[22px] px-0 top-60 w-[223px]">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-center text-nowrap text-white">
        <p className="leading-[20px] whitespace-pre">+{points} points</p>
      </div>
    </div>
  );
}

function ActionButton() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-2 items-start justify-start left-0 p-[8px] top-[392px] w-[223px]">
      <div className="bg-white h-[42px] rounded-[8px] shrink-0 w-full" />
    </div>
  );
}

function LightModeIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="light_mode">
      <img className="block max-w-none size-full" src={imgLightMode} />
    </div>
  );
}

function DarkModeIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="dark_mode">
      <img className="block max-w-none size-full" src={imgDarkMode} />
    </div>
  );
}

function ThemeToggle({ onThemeToggle }: { onThemeToggle?: () => void }) {
  return (
    <button 
      onClick={onThemeToggle}
      className="bg-[#191919] box-border content-stretch flex gap-2 items-end justify-start overflow-clip p-[4px] relative rounded-[8px] shrink-0"
    >
      <LightModeIcon />
      <DarkModeIcon />
    </button>
  );
}

function LogoutIcon() {
  return (
    <div className="relative shrink-0 size-6" data-name="logout">
      <img className="block max-w-none size-full" src={imgLogout} />
    </div>
  );
}

function LogoutButton({ onLogout }: { onLogout?: () => void }) {
  return (
    <button 
      onClick={onLogout}
      className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[5px] shrink-0"
    >
      <LogoutIcon />
    </button>
  );
}

function TopNavigation({ onThemeToggle, onLogout }: { onThemeToggle?: () => void; onLogout?: () => void }) {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-between left-0 overflow-clip p-[8px] top-0 w-[223px]">
      <ThemeToggle onThemeToggle={onThemeToggle} />
      <LogoutButton onLogout={onLogout} />
    </div>
  );
}

export default function SuccessScreen({ points, onThemeToggle, onLogout }: SuccessScreenProps) {
  return (
    <div className="bg-center bg-cover bg-no-repeat relative size-full" style={{ backgroundImage: `url('${imgFrame79}')` }}>
      <CheckContainer />
      <PointsDisplay points={points} />
      <ActionButton />
      <TopNavigation onThemeToggle={onThemeToggle} onLogout={onLogout} />
    </div>
  );
}