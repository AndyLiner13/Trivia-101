import imgImage14 from "figma:asset/07c26fae8fb7240bf2994f9836556af368268e62.png";
import imgImage15 from "figma:asset/e60cf3f7f4744f090a56c1f1726d353d32fc05e9.png";
import imgFrame129 from "figma:asset/353b66df49943b858b6521aa41f578cc56947a17.png";
import { imgLightMode, imgDarkMode, imgLogout } from "./svg-nm9gi";

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

function Frame120() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip relative size-full">
        <div className="box-border content-stretch flex items-center justify-between p-[8px] relative w-full">
          <Frame95 />
          <Frame97 />
        </div>
      </div>
    </div>
  );
}

function Frame83() {
  return (
    <div className="[grid-area:1_/_1] bg-[#DC2626] relative rounded-[16px] shadow-[0px_0px_9.6px_0px_rgba(0,0,0,0.21)] shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[19px] py-0 relative size-full">
          <div className="bg-center bg-cover bg-no-repeat h-[54px] shrink-0 w-[55px]" data-name="image 14" style={{ backgroundImage: `url('${imgImage14}')` }} />
        </div>
      </div>
    </div>
  );
}

function Frame84() {
  return (
    <div className="[grid-area:2_/_1] bg-[#2563EB] relative rounded-[16px] shadow-[0px_0px_9.6px_0px_rgba(0,0,0,0.21)] shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[22px] py-0 relative size-full">
          <div className="bg-center bg-cover bg-no-repeat shrink-0 size-[50px]" data-name="image 15" style={{ backgroundImage: `url('${imgImage15}')` }} />
        </div>
      </div>
    </div>
  );
}

function Frame86() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative size-full">
        <div className="box-border gap-2 grid grid-cols-[repeat(1,_minmax(0px,_1fr))] grid-rows-[repeat(2,_minmax(0px,_1fr))] px-2 py-0 relative size-full">
          <Frame83 />
          <Frame84 />
        </div>
      </div>
    </div>
  );
}

function Frame87() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-[8px] relative w-full">
          <div className="bg-white h-[42px] rounded-[8px] shrink-0 w-full" />
        </div>
      </div>
    </div>
  );
}

function Frame123() {
  return (
    <div className="absolute content-stretch flex flex-col h-[450px] items-start justify-start left-0 top-0 w-[223px]">
      <Frame120 />
      <Frame86 />
      <Frame87 />
    </div>
  );
}

export default function Frame129() {
  return (
    <div className="bg-center bg-cover bg-no-repeat relative w-[223px] h-[450px]" style={{ backgroundImage: `url('${imgFrame129}')` }}>
      <Frame123 />
    </div>
  );
}