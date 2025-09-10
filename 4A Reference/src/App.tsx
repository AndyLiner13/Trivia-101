import imgImage14 from "figma:asset/07c26fae8fb7240bf2994f9836556af368268e62.png";
import imgCircle from "figma:asset/b5391d9d4c55cdfe13ae727ceabcd10fac265d23.png";
import imgImage16 from "figma:asset/a5391e582e85450d8a5c86b461cf84cb54fcda87.png";
import imgImage15 from "figma:asset/e60cf3f7f4744f090a56c1f1726d353d32fc05e9.png";
import imgFrame81 from "figma:asset/12f58f4bad49a9de9583c1ee657dce0aefcdf797.png";
import { imgLightMode, imgDarkMode, imgLogout } from "./imports/svg-gxrfv";

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

function Circle() {
  return (
    <div className="h-[55px] relative shrink-0 w-[54px]" data-name="circle">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col h-[55px] items-center justify-center px-[42px] py-0 relative w-[54px]">
          <div className="aspect-[188/187] basis-0 bg-[50.38%_48.88%] bg-no-repeat bg-size-[123.23%_123.89%] grow min-h-px min-w-px shrink-0" data-name="circle" style={{ backgroundImage: `url('${imgCircle}')` }} />
        </div>
      </div>
    </div>
  );
}

function Frame86() {
  return (
    <div className="[grid-area:2_/_1] bg-[#EAB308] relative rounded-[16px] shadow-[0px_0px_9.6px_0px_rgba(0,0,0,0.21)] shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[19px] py-0 relative size-full">
          <Circle />
        </div>
      </div>
    </div>
  );
}

function Frame87() {
  return (
    <div className="[grid-area:2_/_2] bg-[#16A34A] relative rounded-[16px] shadow-[0px_0px_9.6px_0px_rgba(0,0,0,0.21)] shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[19px] py-0 relative size-full">
          <div className="bg-center bg-cover bg-no-repeat h-[54px] shrink-0 w-[55px]" data-name="image 16" style={{ backgroundImage: `url('${imgImage16}')` }} />
        </div>
      </div>
    </div>
  );
}

function Frame84() {
  return (
    <div className="[grid-area:1_/_2] bg-[#2563EB] relative rounded-[16px] shadow-[0px_0px_9.6px_0px_rgba(0,0,0,0.21)] shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col items-center justify-center px-[22px] py-0 relative size-full">
          <div className="bg-center bg-cover bg-no-repeat shrink-0 size-[50px]" data-name="image 15" style={{ backgroundImage: `url('${imgImage15}')` }} />
        </div>
      </div>
    </div>
  );
}

function Frame88() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
      <div className="relative size-full">
        <div className="box-border gap-2 grid grid-cols-[repeat(2,_minmax(0px,_1fr))] grid-rows-[repeat(2,_minmax(0px,_1fr))] px-2 py-0 relative size-full">
          <Frame83 />
          <Frame86 />
          <Frame87 />
          <Frame84 />
        </div>
      </div>
    </div>
  );
}

function Frame89() {
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
    <div className="content-stretch flex flex-col h-[450px] items-start justify-start w-[223px]">
      <Frame120 />
      <Frame88 />
      <Frame89 />
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-center bg-cover bg-no-repeat relative inline-block" style={{ backgroundImage: `url('${imgFrame81}')` }}>
      <Frame123 />
    </div>
  );
}