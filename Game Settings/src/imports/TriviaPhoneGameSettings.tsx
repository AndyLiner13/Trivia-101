import imgGameSettings from "figma:asset/353b66df49943b858b6521aa41f578cc56947a17.png";
import { imgLightMode, imgDarkMode, imgLock, imgTimerOff, imgTimer, imgMoreTime, imgInfoI, imgSentimentSatisfied, imgSentimentNeutral, imgSkull, imgAutoplay, imgBolt, imgAllInclusive } from "./svg-f5nda";

function Button() {
  return (
    <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Button">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center p-[16px] relative size-full">
          <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] h-full justify-center leading-[0] not-italic relative shrink-0 text-[#111111] text-[18px] text-center w-[143px]">
            <p className="leading-[15px]">Confirm Settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmSettings() {
  return (
    <div className="absolute box-border content-stretch flex gap-2 h-[58px] items-center justify-center left-0 p-[8px] top-[392px] w-[223px]" data-name="Confirm Settings">
      <Button />
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

function Lock() {
  return (
    <div className="relative shrink-0 size-6" data-name="lock">
      <img className="block max-w-none size-full" src={imgLock} />
    </div>
  );
}

function Frame96() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start p-[4px] relative rounded-[5px] shrink-0">
      <Lock />
    </div>
  );
}

function Frame119() {
  return (
    <div className="box-border content-stretch flex items-center justify-between overflow-clip p-[8px] relative shrink-0 w-[223px]">
      <Frame95 />
      <Frame96 />
    </div>
  );
}

function Frame116() {
  return (
    <div className="basis-0 bg-[#191919] box-border content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip px-0 py-3.5 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
        <p className="leading-[15px] whitespace-pre">General Trivia</p>
      </div>
    </div>
  );
}

function Frame117() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-0 relative w-full">
          <Frame116 />
        </div>
      </div>
    </div>
  );
}

function Frame120() {
  return (
    <div className="basis-0 bg-[#191919] box-border content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip px-0 py-4 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
        <p className="leading-[15px] whitespace-pre">Another Category</p>
      </div>
    </div>
  );
}

function Frame113() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-0 relative w-full">
          <Frame120 />
        </div>
      </div>
    </div>
  );
}

function Frame121() {
  return (
    <div className="basis-0 bg-[#191919] box-border content-stretch flex grow items-center justify-center min-h-px min-w-px overflow-clip px-0 py-4 relative rounded-[8px] shrink-0">
      <div className="flex flex-col font-['Segoe_UI:Bold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-nowrap text-white">
        <p className="leading-[15px] whitespace-pre">Italian Brainrot</p>
      </div>
    </div>
  );
}

function Frame118() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex gap-2 items-center justify-center px-4 py-0 relative w-full">
          <Frame121 />
        </div>
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

function Timer() {
  return (
    <div className="relative shrink-0 size-9" data-name="timer">
      <img className="block max-w-none size-full" src={imgTimer} />
    </div>
  );
}

function MoreTime() {
  return (
    <div className="relative shrink-0 size-9" data-name="more_time">
      <img className="block max-w-none size-full" src={imgMoreTime} />
    </div>
  );
}

function Frame97() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[8px] relative rounded-[8px] shrink-0">
      <TimerOff />
      <Timer />
      <MoreTime />
    </div>
  );
}

function InfoI() {
  return (
    <div className="relative shrink-0 size-7" data-name="info_i">
      <img className="block max-w-none size-full" src={imgInfoI} />
    </div>
  );
}

function Frame98() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[2px] relative rounded-[5px] shrink-0 size-8">
      <InfoI />
    </div>
  );
}

function Frame100() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pl-4 pr-5 py-0 relative w-full">
          <Frame97 />
          <Frame98 />
        </div>
      </div>
    </div>
  );
}

function SentimentSatisfied() {
  return (
    <div className="relative shrink-0 size-9" data-name="sentiment_satisfied">
      <img className="block max-w-none size-full" src={imgSentimentSatisfied} />
    </div>
  );
}

function SentimentNeutral() {
  return (
    <div className="relative shrink-0 size-9" data-name="sentiment_neutral">
      <img className="block max-w-none size-full" src={imgSentimentNeutral} />
    </div>
  );
}

function Skull() {
  return (
    <div className="relative shrink-0 size-9" data-name="skull">
      <img className="block max-w-none size-full" src={imgSkull} />
    </div>
  );
}

function Frame99() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start p-[8px] relative rounded-[8px] shrink-0">
      <SentimentSatisfied />
      <SentimentNeutral />
      <Skull />
    </div>
  );
}

function InfoI1() {
  return (
    <div className="relative shrink-0 size-7" data-name="info_i">
      <img className="block max-w-none size-full" src={imgInfoI} />
    </div>
  );
}

function Frame103() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[2px] relative rounded-[5px] shrink-0 size-8">
      <InfoI1 />
    </div>
  );
}

function Frame101() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pl-4 pr-5 py-0 relative w-full">
          <Frame99 />
          <Frame103 />
        </div>
      </div>
    </div>
  );
}

function Autoplay() {
  return (
    <div className="relative shrink-0 size-9" data-name="autoplay">
      <img className="block max-w-none size-full" src={imgAutoplay} />
    </div>
  );
}

function Bolt() {
  return (
    <div className="relative shrink-0 size-9" data-name="bolt">
      <img className="block max-w-none size-full" src={imgBolt} />
    </div>
  );
}

function AllInclusive() {
  return (
    <div className="relative shrink-0 size-9" data-name="all_inclusive">
      <img className="block max-w-none size-full" src={imgAllInclusive} />
    </div>
  );
}

function Frame104() {
  return (
    <div className="bg-[#191919] box-border content-stretch flex gap-2 items-center justify-start p-[8px] relative rounded-[8px] shrink-0">
      <Autoplay />
      <Bolt />
      <AllInclusive />
    </div>
  );
}

function InfoI2() {
  return (
    <div className="relative shrink-0 size-7" data-name="info_i">
      <img className="block max-w-none size-full" src={imgInfoI} />
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-white box-border content-stretch flex gap-2 items-center justify-start overflow-clip p-[2px] relative rounded-[5px] shrink-0 size-8">
      <InfoI2 />
    </div>
  );
}

function Frame102() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between pl-4 pr-5 py-0 relative w-full">
          <Frame104 />
          <Frame2 />
        </div>
      </div>
    </div>
  );
}

function Frame115() {
  return (
    <div className="absolute content-stretch flex flex-col gap-2 items-start justify-start left-0 top-0 w-[223px]">
      <Frame119 />
      <Frame117 />
      <Frame113 />
      <Frame118 />
      <Frame100 />
      <Frame101 />
      <Frame102 />
    </div>
  );
}

function GameSettings() {
  return (
    <div className="absolute bg-center bg-cover bg-no-repeat h-[450px] left-0 overflow-clip top-0 w-[223px]" data-name="Game Settings" style={{ backgroundImage: `url('${imgGameSettings}')` }}>
      <ConfirmSettings />
      <Frame115 />
    </div>
  );
}

export default function TriviaPhoneGameSettings() {
  return (
    <div className="relative size-full" data-name="TriviaPhone - Game Settings">
      <GameSettings />
    </div>
  );
}