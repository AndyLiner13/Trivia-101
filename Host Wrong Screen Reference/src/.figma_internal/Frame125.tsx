import imgFrame125 from "figma:asset/dc47f26681ae085abd827910b7d53e0574345c99.png";
import { imgClose, imgArrowForward, imgLightMode, imgDarkMode, imgLogout } from "./svg-lq6a0";

function Close() {
  return (
    <div className="relative shrink-0 size-[136px]" data-name="close">
      <img className="block max-w-none size-full" src={imgClose} />
    </div>
  );
}

function Frame80() {
  return (
    <div className="absolute content-stretch flex flex-col gap-2.5 h-[92px] items-center justify-center left-0 top-[148px] w-[223px]">
      <Close />
    </div>
  );
}

function Frame124() {
  return (
    <div className="absolute box-border content-stretch flex gap-2 items-start justify-center left-0 pb-0 pt-[22px] px-0 top-60 w-[223px]">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[20px] not-italic relative shrink-0 text-[24px] text-center text-nowrap text-white whitespace-pre">
        <p className="mb-0">You need to</p>
        <p>lock in twin</p>
      </div>
    </div>
  );
}

function Frame87() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-2 items-start justify-start left-0 p-[8px] top-[392px] w-[223px]">
      <div className="bg-white h-[42px] rounded-[8px] shrink-0 w-full" />
    </div>
  );
}

function ArrowForward() {
  return (
    <div className="relative shrink-0 size-6" data-name="arrow_forward">
      <img className="block max-w-none size-full" src={imgArrowForward} />
    </div>
  );
}

function Frame129() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between p-[8px] relative w-full">
          <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] h-full justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center w-[109px]">
            <p className="leading-[20px]">Next Question</p>
          </div>
          <ArrowForward />
        </div>
      </div>
    </div>
  );
}

function Frame127() {
  return (
    <div className="absolute box-border content-stretch flex gap-2 h-[88px] items-start justify-center left-0 p-[16px] top-[302px] w-[223px]">
      <Frame129 />
    </div>
  );
}

function LightMode() {
  return (
    <div className="relative shrink-0 size-6" data-name="light_mode">
      <img className="block max-w-none size-full" src={imgLightMode} />
    </div>
  );
}

function DarkMode() {
  return (
    <div className="relative shrink-0 size-6" data-name="dark_mode">
      <img className="block max-w-none size-full" src={imgDarkMode} />
    </div>
  );
}

function Frame95() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-end justify-start overflow-clip p-[4px] relative rounded-[8px] shrink-0">
      <LightMode />
      <DarkMode />
    </div>
  );
}

function Logout() {
  return (
    <div className="relative shrink-0 size-6" data-name="logout">
      <img className="block max-w-none size-full" src={imgLogout} />
    </div>
  );
}

function Frame97() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[5px] shrink-0">
      <Logout />
    </div>
  );
}

function Frame128() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-between left-0 overflow-clip p-[8px] top-0 w-[223px]">
      <Frame95 />
      <Frame97 />
    </div>
  );
}

export default function Frame125() {
  return (
    <div className="bg-center bg-cover bg-no-repeat relative size-full" style={{ backgroundImage: `url('${imgFrame125}')` }}>
      <Frame80 />
      <div className="absolute flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[20px] left-28 not-italic text-[24px] text-center text-white top-[282px] translate-x-[-50%] translate-y-[-50%] w-[136px]">
        <p className="mb-0">You need to</p>
        <p>lock in twin</p>
      </div>
      <Frame124 />
      <Frame87 />
      <Frame127 />
      <Frame128 />
    </div>
  );
}