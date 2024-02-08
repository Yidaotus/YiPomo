import { useAppState } from "@/lib/app-state";
import { useEffect, useRef, useState } from "react";

const PlayIcon = () => (
  <svg viewBox="0 0 32 32" fill="current" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 4.8541C1 2.62396 3.34694 1.17347 5.34164 2.17082L27.6334 13.3167C29.8446 14.4223 29.8446 17.5777 27.6334 18.6833L5.34164 29.8292C3.34694 30.8265 1 29.376 1 27.1459V4.8541Z"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CenterIndicator = () => (
  <svg viewBox="0 0 10 4" fill="current" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.58579 -2C8.47669 -2 8.92286 -0.922858 8.29289 -0.292893L5.70711 2.29289C5.31658 2.68342 4.68342 2.68342 4.29289 2.29289L1.7071 -0.292895C1.07714 -0.92286 1.52331 -2 2.41421 -2L7.58579 -2Z"
      fill="current"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TimeLine = () => (
  <svg viewBox="0 0 210 21" fill="current" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.4483 15.75C43.4483 15.1701 44.0967 14.7 44.8965 14.7C45.6964 14.7 46.3448 15.1701 46.3448 15.75V19.95C46.3448 20.5299 45.6964 21 44.8965 21C44.0967 21 43.4483 20.5299 43.4483 19.95V15.75Z" />
    <path d="M52.1379 15.75C52.1379 15.1701 52.7863 14.7 53.5862 14.7C54.3861 14.7 55.0345 15.1701 55.0345 15.75V19.95C55.0345 20.5299 54.3861 21 53.5862 21C52.7863 21 52.1379 20.5299 52.1379 19.95V15.75Z" />
    <path d="M60.8276 7.35C60.8276 6.7701 61.476 6.3 62.2759 6.3C63.0757 6.3 63.7241 6.7701 63.7241 7.35V19.95C63.7241 20.5299 63.0757 21 62.2759 21C61.476 21 60.8276 20.5299 60.8276 19.95V7.35Z" />
    <path d="M69.5172 15.75C69.5172 15.1701 70.1657 14.7 70.9655 14.7C71.7654 14.7 72.4138 15.1701 72.4138 15.75V19.95C72.4138 20.5299 71.7654 21 70.9655 21C70.1657 21 69.5172 20.5299 69.5172 19.95V15.75Z" />
    <path d="M78.2069 15.75C78.2069 15.1701 78.8553 14.7 79.6552 14.7C80.455 14.7 81.1034 15.1701 81.1034 15.75V19.95C81.1034 20.5299 80.455 21 79.6552 21C78.8553 21 78.2069 20.5299 78.2069 19.95V15.75Z" />
    <path d="M86.8965 15.75C86.8965 15.1701 87.545 14.7 88.3448 14.7C89.1447 14.7 89.7931 15.1701 89.7931 15.75V19.95C89.7931 20.5299 89.1447 21 88.3448 21C87.545 21 86.8965 20.5299 86.8965 19.95V15.75Z" />
    <path d="M95.5862 15.75C95.5862 15.1701 96.2346 14.7 97.0345 14.7C97.8343 14.7 98.4828 15.1701 98.4828 15.75V19.95C98.4828 20.5299 97.8343 21 97.0345 21C96.2346 21 95.5862 20.5299 95.5862 19.95V15.75Z" />
    <path d="M104.276 1.05C104.276 0.470101 104.924 0 105.724 0C106.524 0 107.172 0.470101 107.172 1.05V19.95C107.172 20.5299 106.524 21 105.724 21C104.924 21 104.276 20.5299 104.276 19.95V1.05Z" />
    <path d="M111.517 15.75C111.517 15.1701 112.166 14.7 112.966 14.7C113.765 14.7 114.414 15.1701 114.414 15.75V19.95C114.414 20.5299 113.765 21 112.966 21C112.166 21 111.517 20.5299 111.517 19.95V15.75Z" />
    <path d="M120.207 15.75C120.207 15.1701 120.855 14.7 121.655 14.7C122.455 14.7 123.103 15.1701 123.103 15.75V19.95C123.103 20.5299 122.455 21 121.655 21C120.855 21 120.207 20.5299 120.207 19.95V15.75Z" />
    <path d="M128.897 15.75C128.897 15.1701 129.545 14.7 130.345 14.7C131.145 14.7 131.793 15.1701 131.793 15.75V19.95C131.793 20.5299 131.145 21 130.345 21C129.545 21 128.897 20.5299 128.897 19.95V15.75Z" />
    <path d="M137.586 15.75C137.586 15.1701 138.235 14.7 139.034 14.7C139.834 14.7 140.483 15.1701 140.483 15.75V19.95C140.483 20.5299 139.834 21 139.034 21C138.235 21 137.586 20.5299 137.586 19.95V15.75Z" />
    <path d="M146.276 7.35C146.276 6.7701 146.924 6.3 147.724 6.3C148.524 6.3 149.172 6.7701 149.172 7.35V19.95C149.172 20.5299 148.524 21 147.724 21C146.924 21 146.276 20.5299 146.276 19.95V13.65V7.35Z" />
    <path d="M154.966 15.75C154.966 15.1701 155.614 14.7 156.414 14.7C157.214 14.7 157.862 15.1701 157.862 15.75V19.95C157.862 20.5299 157.214 21 156.414 21C155.614 21 154.966 20.5299 154.966 19.95V15.75Z" />
    <path d="M163.655 15.75C163.655 15.1701 164.304 14.7 165.103 14.7C165.903 14.7 166.552 15.1701 166.552 15.75V19.95C166.552 20.5299 165.903 21 165.103 21C164.304 21 163.655 20.5299 163.655 19.95V15.75Z" />
    <path d="M43.4483 15.75C43.4483 15.1701 44.0967 14.7 44.8965 14.7C45.6964 14.7 46.3448 15.1701 46.3448 15.75V19.95C46.3448 20.5299 45.6964 21 44.8965 21C44.0967 21 43.4483 20.5299 43.4483 19.95V15.75Z" />
    <path d="M52.1379 15.75C52.1379 15.1701 52.7863 14.7 53.5862 14.7C54.3861 14.7 55.0345 15.1701 55.0345 15.75V19.95C55.0345 20.5299 54.3861 21 53.5862 21C52.7863 21 52.1379 20.5299 52.1379 19.95V15.75Z" />
    <path d="M60.8276 7.35C60.8276 6.7701 61.476 6.3 62.2759 6.3C63.0757 6.3 63.7241 6.7701 63.7241 7.35V19.95C63.7241 20.5299 63.0757 21 62.2759 21C61.476 21 60.8276 20.5299 60.8276 19.95V7.35Z" />
    <path d="M69.5172 15.75C69.5172 15.1701 70.1657 14.7 70.9655 14.7C71.7654 14.7 72.4138 15.1701 72.4138 15.75V19.95C72.4138 20.5299 71.7654 21 70.9655 21C70.1657 21 69.5172 20.5299 69.5172 19.95V15.75Z" />
    <path d="M78.2069 15.75C78.2069 15.1701 78.8553 14.7 79.6552 14.7C80.455 14.7 81.1034 15.1701 81.1034 15.75V19.95C81.1034 20.5299 80.455 21 79.6552 21C78.8553 21 78.2069 20.5299 78.2069 19.95V15.75Z" />
    <path d="M0 15.75C0 15.1701 0.648415 14.7 1.44828 14.7C2.24814 14.7 2.89655 15.1701 2.89655 15.75V19.95C2.89655 20.5299 2.24814 21 1.44828 21C0.648415 21 0 20.5299 0 19.95V15.75Z" />
    <path d="M8.68966 15.75C8.68966 15.1701 9.33807 14.7 10.1379 14.7C10.9378 14.7 11.5862 15.1701 11.5862 15.75V19.95C11.5862 20.5299 10.9378 21 10.1379 21C9.33807 21 8.68966 20.5299 8.68966 19.95V15.75Z" />
    <path d="M17.3793 7.35C17.3793 6.7701 18.0277 6.3 18.8276 6.3C19.6274 6.3 20.2759 6.7701 20.2759 7.35V19.95C20.2759 20.5299 19.6274 21 18.8276 21C18.0277 21 17.3793 20.5299 17.3793 19.95V7.35Z" />
    <path d="M26.069 15.75C26.069 15.1701 26.7174 14.7 27.5172 14.7C28.3171 14.7 28.9655 15.1701 28.9655 15.75V19.95C28.9655 20.5299 28.3171 21 27.5172 21C26.7174 21 26.069 20.5299 26.069 19.95V15.75Z" />
    <path d="M34.7586 15.75C34.7586 15.1701 35.407 14.7 36.2069 14.7C37.0068 14.7 37.6552 15.1701 37.6552 15.75V19.95C37.6552 20.5299 37.0068 21 36.2069 21C35.407 21 34.7586 20.5299 34.7586 19.95V15.75Z" />
    <path d="M0 15.75C0 15.1701 0.648415 14.7 1.44828 14.7C2.24814 14.7 2.89655 15.1701 2.89655 15.75V19.95C2.89655 20.5299 2.24814 21 1.44828 21C0.648415 21 0 20.5299 0 19.95V15.75Z" />
    <path d="M8.68966 15.75C8.68966 15.1701 9.33807 14.7 10.1379 14.7C10.9378 14.7 11.5862 15.1701 11.5862 15.75V19.95C11.5862 20.5299 10.9378 21 10.1379 21C9.33807 21 8.68966 20.5299 8.68966 19.95V15.75Z" />
    <path d="M17.3793 7.35C17.3793 6.7701 18.0277 6.3 18.8276 6.3C19.6274 6.3 20.2759 6.7701 20.2759 7.35V19.95C20.2759 20.5299 19.6274 21 18.8276 21C18.0277 21 17.3793 20.5299 17.3793 19.95V7.35Z" />
    <path d="M26.069 15.75C26.069 15.1701 26.7174 14.7 27.5172 14.7C28.3171 14.7 28.9655 15.1701 28.9655 15.75V19.95C28.9655 20.5299 28.3171 21 27.5172 21C26.7174 21 26.069 20.5299 26.069 19.95V15.75Z" />
    <path d="M34.7586 15.75C34.7586 15.1701 35.407 14.7 36.2069 14.7C37.0068 14.7 37.6552 15.1701 37.6552 15.75V19.95C37.6552 20.5299 37.0068 21 36.2069 21C35.407 21 34.7586 20.5299 34.7586 19.95V15.75Z" />
    <path d="M172.345 15.75C172.345 15.1701 172.993 14.7 173.793 14.7C174.593 14.7 175.241 15.1701 175.241 15.75V19.95C175.241 20.5299 174.593 21 173.793 21C172.993 21 172.345 20.5299 172.345 19.95V15.75Z" />
    <path d="M181.034 15.75C181.034 15.1701 181.683 14.7 182.483 14.7C183.283 14.7 183.931 15.1701 183.931 15.75V19.95C183.931 20.5299 183.283 21 182.483 21C181.683 21 181.034 20.5299 181.034 19.95V15.75Z" />
    <path d="M189.724 7.35C189.724 6.7701 190.373 6.3 191.172 6.3C191.972 6.3 192.621 6.7701 192.621 7.35V19.95C192.621 20.5299 191.972 21 191.172 21C190.373 21 189.724 20.5299 189.724 19.95V13.65V7.35Z" />
    <path d="M198.414 15.75C198.414 15.1701 199.062 14.7 199.862 14.7C200.662 14.7 201.31 15.1701 201.31 15.75V19.95C201.31 20.5299 200.662 21 199.862 21C199.062 21 198.414 20.5299 198.414 19.95V15.75Z" />
    <path d="M207.103 15.75C207.103 15.1701 207.752 14.7 208.552 14.7C209.352 14.7 210 15.1701 210 15.75V19.95C210 20.5299 209.352 21 208.552 21C207.752 21 207.103 20.5299 207.103 19.95V15.75Z" />
  </svg>
);

const FootStepsIcon = () => (
  <svg viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.16666 28.6667V24.4025C7.16666 20.6042 5.32124 18.8125 5.37499 14.3333C5.42874 9.46 8.04458 3.58333 13.4375 3.58333C16.7879 3.58333 17.9167 6.80833 17.9167 9.85417C17.9167 15.4263 14.3333 19.995 14.3333 25.4058V28.6667C14.3333 29.617 13.9558 30.5285 13.2838 31.2005C12.6118 31.8725 11.7004 32.25 10.75 32.25C9.79963 32.25 8.8882 31.8725 8.21619 31.2005C7.54419 30.5285 7.16666 29.617 7.16666 28.6667Z"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M35.8333 35.8333V31.5692C35.8333 27.7708 37.6788 25.9792 37.625 21.5C37.5713 16.6267 34.9554 10.75 29.5625 10.75C26.2121 10.75 25.0833 13.975 25.0833 17.0208C25.0833 22.5929 28.6667 27.1617 28.6667 32.5725V35.8333C28.6667 36.7837 29.0442 37.6951 29.7162 38.3671C30.3882 39.0391 31.2997 39.4167 32.25 39.4167C33.2004 39.4167 34.1118 39.0391 34.7838 38.3671C35.4558 37.6951 35.8333 36.7837 35.8333 35.8333Z"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M28.6667 30.4583H35.8333"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.16666 23.2917H14.3333"
      stroke="current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const timerWindowWidth = 228;
const timerSegmentWidth = 100;
const margin = (timerWindowWidth - timerSegmentWidth) / 2;
const gap = 2;

const WorkTimeLine = () => {
  const workTimes = [0, 1, 2, 3];
  return (
    <>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-8 h-8">
            <PlayIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      {workTimes.map((i) => (
        <div
          key={i}
          className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
          style={{ width: `${timerSegmentWidth}px` }}
        >
          <div className="flex items-center justify-center w-full relative -top-2">
            {5 + i * 5}
          </div>
          <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
            <TimeLine />
          </div>
        </div>
      ))}
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-12 h-12">
            <FootStepsIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-8 h-8">
            <PlayIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
    </>
  );
};

const SmallBreakTimeLine = () => {
  return (
    <>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-12 h-12">
            <FootStepsIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-8 h-8">
            <PlayIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          5
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
    </>
  );
};

const IdleTimeLine = () => {
  return (
    <>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          <div className="w-8 h-8">
            <PlayIcon />
          </div>
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="flex items-center justify-center w-full relative -top-2">
          5
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
    </>
  );
};

const TimerDisplay = () => {
  const timerRef = useRef<HTMLDivElement>(null);
  const state = useAppState((state) => state.sessionState);

  useEffect(() => {
    let start: number | undefined = undefined;
    let counter = 0;
    let animationId: number;

    const animationCallback = (timeStamp: number) => {
      if (start === undefined) {
        start = timeStamp;
      }

      const timerDiv = timerRef.current;
      if (timerDiv) {
        const timeDiff = timeStamp - start;
        let moveTargetPixels;
        switch (state) {
          case "Finish":
          case "Idle":
            moveTargetPixels = 0;
            break;
          case "Working":
            moveTargetPixels = 5 * timerSegmentWidth + 5 * gap;
            break;
          case "SmallBreak":
            moveTargetPixels = timerSegmentWidth + gap;
            break;
          case "BigBreak":
            moveTargetPixels = 3 * timerSegmentWidth + 3 * gap;
            break;
          default:
            moveTargetPixels = 3 * timerSegmentWidth + 3 * gap;
            break;
        }
        const moveTargetTime = 5 * 1000;

        counter += timeDiff;
        const moved = timeDiff / moveTargetTime;
        const pixelsToMove = moved * moveTargetPixels;

        timerDiv.style.transform = `translateX(-${pixelsToMove}px)`;
        if (moved < 1 && state !== "Idle" && state !== "Finish") {
          animationId = requestAnimationFrame(animationCallback);
        }
      }
    };

    animationId = requestAnimationFrame(animationCallback);
    return () => {
      setPreviousState(state);
      cancelAnimationFrame(animationId);
    };
  }, [state]);

  const [previousState, setPreviousState] = useState(state);

  console.debug({ previousState });

  return (
    <div
      className="bg-muted h-[75px] rounded-lg shadow-[inset_0_4px_4px_rgba(0,0,0,0.2)] flex items-center overflow-hidden relative"
      style={{ width: `${timerWindowWidth}px` }}
    >
      <div className="absolute w-full h-full left-0 top-0 flex items-start justify-center fill-[#686e76] stroke-[#686e76]">
        <div className="w-4 h-4">
          <CenterIndicator />
        </div>
      </div>
      <div
        className="w-full h-full rounded-lg"
        style={{
          maskImage:
            "linear-gradient(90deg, rgba(0, 0, 0, 0.6) 5%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 95%)",
        }}
      >
        <div
          ref={timerRef}
          className="flex justify-start text-5xl text-[#686e76] items-center w-full h-full relative font-medium fill-[#686e76] stroke-[#686e76]"
          style={{
            left: `${margin - (timerSegmentWidth + 2)}px`,
            gap: `${gap}px`,
          }}
        >
          {(previousState === undefined ||
            previousState === "Finish" ||
            previousState === "Idle") && (
            <div
              className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
              style={{ width: `${timerSegmentWidth}px` }}
            >
              <div className="flex items-center justify-center w-full relative -top-2">
                0
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
                <TimeLine />
              </div>
            </div>
          )}
          {previousState === "Working" && (
            <div
              className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
              style={{ width: `${timerSegmentWidth}px` }}
            >
              <div className="flex items-center justify-center w-full relative -top-2">
                20
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
                <TimeLine />
              </div>
            </div>
          )}
          {previousState === "SmallBreak" && (
            <div
              className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
              style={{ width: `${timerSegmentWidth}px` }}
            >
              <div className="flex items-center justify-center w-full relative -top-2">
                <div className="w-12 h-12">
                  <FootStepsIcon />
                </div>
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
                <TimeLine />
              </div>
            </div>
          )}
          {state === "Idle" && <IdleTimeLine />}
          {state === "Working" && <WorkTimeLine />}
          {state === "SmallBreak" && <SmallBreakTimeLine />}
          {state === "BigBreak" && <WorkTimeLine />}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
