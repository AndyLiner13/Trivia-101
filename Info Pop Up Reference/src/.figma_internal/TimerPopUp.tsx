import { imgTimerOff, imgTimerOff1, imgTimerOff2 } from "./svg-x636a";

function Button() {
  return (
    <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center pb-0 pt-2 px-0 relative shrink-0 w-full" data-name="Button">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center text-nowrap">
        <p className="leading-[15px] whitespace-pre">Timers</p>
      </div>
    </div>
  );
}

function TimerOff() {
  return (
    <div className="relative shrink-0 size-9" data-name="timer_off">
      <img className="block max-w-none size-full" src={imgTimerOff} />
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[8px] shrink-0">
      <TimerOff />
    </div>
  );
}

function Frame100() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-center px-0 py-3 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center text-nowrap">
        <p className="leading-[15px] whitespace-pre">None</p>
      </div>
    </div>
  );
}

function Frame99() {
  return (
    <div className="bg-[rgba(217,217,217,0)] content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <Frame3 />
      <Frame100 />
    </div>
  );
}

function TimerOff1() {
  return (
    <div className="relative shrink-0 size-9" data-name="timer_off">
      <img className="block max-w-none size-full" src={imgTimerOff1} />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[8px] shrink-0">
      <TimerOff1 />
    </div>
  );
}

function Frame104() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-center px-0 py-3 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center text-nowrap">
        <p className="leading-[15px] whitespace-pre">30 Seconds</p>
      </div>
    </div>
  );
}

function Frame102() {
  return (
    <div className="bg-[rgba(217,217,217,0)] content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <Frame4 />
      <Frame104 />
    </div>
  );
}

function TimerOff2() {
  return (
    <div className="relative shrink-0 size-9" data-name="timer_off">
      <img className="block max-w-none size-full" src={imgTimerOff2} />
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[8px] shrink-0">
      <TimerOff2 />
    </div>
  );
}

function Frame105() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-center px-0 py-3 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-center text-nowrap">
        <p className="leading-[15px] whitespace-pre">90 Seconds</p>
      </div>
    </div>
  );
}

function Frame103() {
  return (
    <div className="bg-[rgba(217,217,217,0)] content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <Frame5 />
      <Frame105 />
    </div>
  );
}

function Frame101() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
      <Frame99 />
      <Frame102 />
      <Frame103 />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#0fba09] box-border content-stretch flex gap-2 items-center justify-center px-0 py-2 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
        <p className="leading-[15px] whitespace-pre">Got it</p>
      </div>
    </div>
  );
}

function Frame120() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div className="flex flex-col items-center justify-end overflow-clip relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-end p-[8px] relative w-full">
          <Button />
          <Frame101 />
          <Button1 />
        </div>
      </div>
    </div>
  );
}

export default function TimerPopUp() {
  return (
    <div className="bg-[rgba(0,0,0,0.5)] relative size-full" data-name="Timer Pop-Up">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-2 relative size-full">
          <Frame120 />
        </div>
      </div>
    </div>
  );
}