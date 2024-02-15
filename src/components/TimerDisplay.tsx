import { getUpcommingDisplayState, useAppState } from "@/lib/app-state";
import { invoke } from "@tauri-apps/api";
import { SunIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { act } from "react-dom/test-utils";

const PlayIcon = () => (
  <svg viewBox="0 0 32 32" fill="none">
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
  <svg viewBox="0 0 10 4" fill="current">
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
  <svg viewBox="0 0 140 20" stroke="none" fill="current">
    <path d="M5.99995 15C5.99995 14.4477 6.44766 14 6.99995 14C7.55223 14 7.99995 14.4477 7.99995 15V19C7.99995 19.5523 7.55223 20 6.99995 20C6.44766 20 5.99995 19.5523 5.99995 19V15Z" />
    <path d="M11.9999 15C11.9999 14.4477 12.4477 14 12.9999 14C13.5522 14 13.9999 14.4477 13.9999 15V19C13.9999 19.5523 13.5522 20 12.9999 20C12.4477 20 11.9999 19.5523 11.9999 19V15Z" />
    <path d="M17.9999 15C17.9999 14.4477 18.4477 14 18.9999 14C19.5522 14 19.9999 14.4477 19.9999 15V19C19.9999 19.5523 19.5522 20 18.9999 20C18.4477 20 17.9999 19.5523 17.9999 19V15Z" />
    <path d="M23.9999 15C23.9999 14.4477 24.4477 14 24.9999 14C25.5522 14 25.9999 14.4477 25.9999 15V19C25.9999 19.5523 25.5522 20 24.9999 20C24.4477 20 23.9999 19.5523 23.9999 19V15Z" />
    <path d="M29.9999 15C29.9999 14.4477 30.4477 14 30.9999 14C31.5522 14 31.9999 14.4477 31.9999 15V19C31.9999 19.5523 31.5522 20 30.9999 20C30.4477 20 29.9999 19.5523 29.9999 19V15Z" />
    <path d="M35.9999 7C35.9999 6.44772 36.4477 6 36.9999 6C37.5522 6 37.9999 6.44772 37.9999 7V19C37.9999 19.5523 37.5522 20 36.9999 20C36.4477 20 35.9999 19.5523 35.9999 19V7Z" />
    <path d="M41.9999 15C41.9999 14.4477 42.4477 14 42.9999 14C43.5522 14 43.9999 14.4477 43.9999 15V19C43.9999 19.5523 43.5522 20 42.9999 20C42.4477 20 41.9999 19.5523 41.9999 19V15Z" />
    <path d="M47.9999 15C47.9999 14.4477 48.4477 14 48.9999 14C49.5522 14 49.9999 14.4477 49.9999 15V19C49.9999 19.5523 49.5522 20 48.9999 20C48.4477 20 47.9999 19.5523 47.9999 19V15Z" />
    <path d="M53.9999 15C53.9999 14.4477 54.4477 14 54.9999 14C55.5522 14 55.9999 14.4477 55.9999 15V19C55.9999 19.5523 55.5522 20 54.9999 20C54.4477 20 53.9999 19.5523 53.9999 19V15Z" />
    <path d="M59.9999 15C59.9999 14.4477 60.4477 14 60.9999 14C61.5522 14 61.9999 14.4477 61.9999 15V19C61.9999 19.5523 61.5522 20 60.9999 20C60.4477 20 59.9999 19.5523 59.9999 19V15Z" />
    <path d="M65.9999 15C65.9999 14.4477 66.4477 14 66.9999 14C67.5522 14 67.9999 14.4477 67.9999 15V19C67.9999 19.5523 67.5522 20 66.9999 20C66.4477 20 65.9999 19.5523 65.9999 19V15Z" />
    <path d="M71.9999 7C71.9999 6.44772 72.4477 6 72.9999 6C73.5522 6 73.9999 6.44772 73.9999 7V19C73.9999 19.5523 73.5522 20 72.9999 20C72.4477 20 71.9999 19.5523 71.9999 19V7Z" />
    <path d="M77.9999 15C77.9999 14.4477 78.4477 14 78.9999 14C79.5522 14 79.9999 14.4477 79.9999 15V19C79.9999 19.5523 79.5522 20 78.9999 20C78.4477 20 77.9999 19.5523 77.9999 19V15Z" />
    <path d="M83.9999 15C83.9999 14.4477 84.4477 14 84.9999 14C85.5522 14 85.9999 14.4477 85.9999 15V19C85.9999 19.5523 85.5522 20 84.9999 20C84.4477 20 83.9999 19.5523 83.9999 19V15Z" />
    <path d="M89.9999 15C89.9999 14.4477 90.4477 14 90.9999 14C91.5522 14 91.9999 14.4477 91.9999 15V19C91.9999 19.5523 91.5522 20 90.9999 20C90.4477 20 89.9999 19.5523 89.9999 19V15Z" />
    <path d="M95.9999 15C95.9999 14.4477 96.4477 14 96.9999 14C97.5522 14 97.9999 14.4477 97.9999 15V19C97.9999 19.5523 97.5522 20 96.9999 20C96.4477 20 95.9999 19.5523 95.9999 19V15Z" />
    <path d="M102 15C102 14.4477 102.448 14 103 14C103.552 14 104 14.4477 104 15V19C104 19.5523 103.552 20 103 20C102.448 20 102 19.5523 102 19V15Z" />
    <path d="M0 1C0 0.447715 0.447715 0 1 0C1.55228 0 2 0.447715 2 1V19C2 19.5523 1.55228 20 1 20C0.447715 20 0 19.5523 0 19V1Z" />
    <path d="M108 7C108 6.44772 108.448 6 109 6C109.552 6 110 6.44772 110 7V19C110 19.5523 109.552 20 109 20C108.448 20 108 19.5523 108 19V7Z" />
    <path d="M114 15C114 14.4477 114.448 14 115 14C115.552 14 116 14.4477 116 15V19C116 19.5523 115.552 20 115 20C114.448 20 114 19.5523 114 19V15Z" />
    <path d="M120 15C120 14.4477 120.448 14 121 14C121.552 14 122 14.4477 122 15V19C122 19.5523 121.552 20 121 20C120.448 20 120 19.5523 120 19V15Z" />
    <path d="M126 15C126 14.4477 126.448 14 127 14C127.552 14 128 14.4477 128 15V19C128 19.5523 127.552 20 127 20C126.448 20 126 19.5523 126 19V15Z" />
    <path d="M132 15C132 14.4477 132.448 14 133 14C133.552 14 134 14.4477 134 15V19C134 19.5523 133.552 20 133 20C132.448 20 132 19.5523 132 19V15Z" />
    <path d="M138 15C138 14.4477 138.448 14 139 14C139.552 14 140 14.4477 140 15V19C140 19.5523 139.552 20 139 20C138.448 20 138 19.5523 138 19V15Z" />
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

const timerWindowWidth = 207;
const timerSegmentWidth = 140;
const gap = 4;

const WorkTimeLine = () => {
  const workTimes = [0, 1, 2, 3];
  return (
    <>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="w-8 h-8 relative -translate-x-1/2">
          <PlayIcon />
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
          <div className="relative -translate-x-1/2">{5 + i * 5}</div>
          <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
            <TimeLine />
          </div>
        </div>
      ))}
    </>
  );
};

const BigBreakTimeLine = () => {
  const breakTimes = [0, 1];
  return (
    <>
      <div
        className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
        style={{ width: `${timerSegmentWidth}px` }}
      >
        <div className="w-[43px] h-[43px] relative -translate-x-1/2">
          <SunIcon className="w-[43px] h-[43px]" />
        </div>
        <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
          <TimeLine />
        </div>
      </div>
      {breakTimes.map((i) => (
        <div
          key={i}
          className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
          style={{ width: `${timerSegmentWidth}px` }}
        >
          <div className="relative -translate-x-1/2">{5 + i * 5}</div>
          <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
            <TimeLine />
          </div>
        </div>
      ))}
    </>
  );
};

const SmallBreakTimeLine = () => {
  return (
    <div
      className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
      style={{ width: `${timerSegmentWidth}px` }}
    >
      <div className="w-12 h-12 relative -translate-x-1/2">
        <FootStepsIcon />
      </div>
      <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
        <TimeLine />
      </div>
    </div>
  );
};

const IdleTimeLine = () => {
  return (
    <div
      className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
      style={{ width: `${timerSegmentWidth}px` }}
    >
      <div className="w-8 h-8 relative -translate-x-1/2">
        <PlayIcon />
      </div>
      <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
        <TimeLine />
      </div>
    </div>
  );
};

type TimerDisplayProps = {
  advance?: boolean;
};

const TimerDisplay = ({ advance = true }: TimerDisplayProps) => {
  const timerRef = useRef<HTMLDivElement>(null);
  const activeSession = useAppState((state) => state.activeSession);
  const sessionHistory = useAppState((state) => state.sessionHistory);
  const audioRef = useRef<HTMLAudioElement>(null);
  const translatePosition = useRef(0);

  const previousState =
    sessionHistory[sessionHistory.length - 1]?.sessionType || "Idle";

  const upcommingSession = useMemo(
    () => getUpcommingDisplayState(activeSession.sessionType, sessionHistory),
    [sessionHistory, activeSession],
  );

  const advanceState = useCallback(() => {
    invoke("advance_state");
  }, []);

  useEffect(() => {
    if (
      activeSession.sessionType === "Idle" ||
      activeSession.sessionType === "Start" ||
      activeSession.sessionType === "Pause" ||
      activeSession.sessionType === "Finish"
    ) {
      translatePosition.current = 0;
      return;
    }

    let animationId: ReturnType<typeof requestAnimationFrame>;
    const timerDiv = timerRef.current;
    if (!timerDiv) return;
    timerDiv.style.transform = `translateX(-${translatePosition.current}px)`;

    let moveTargetPixels = 0;
    let moveTargetTime = 0;

    switch (activeSession.sessionType) {
      case "Working":
        moveTargetPixels = 5 * timerSegmentWidth + 5 * gap;
        moveTargetTime = 25 * 1000;
        break;
      case "SmallBreak":
        moveTargetPixels = timerSegmentWidth + gap;
        moveTargetTime = 5 * 1000;
        break;
      case "BigBreak":
        moveTargetPixels = 3 * timerSegmentWidth + 2.5 * gap;
        moveTargetTime = 15 * 1000;
        break;
    }

    let pausDuration = 0;
    let pauseStart = 0;
    for (const session of sessionHistory.slice().reverse()) {
      if (
        session.sessionType !== "Pause" &&
        session.sessionType !== activeSession.sessionType
      ) {
        break;
      }
      if (session.sessionType === activeSession.sessionType) {
        pausDuration += pauseStart - session.start;
      } else {
        pauseStart = session.start;
      }
    }
    translatePosition.current =
      (pausDuration / moveTargetTime) * moveTargetPixels;

    let timePrev: number;
    const animationCallback = () => {
      const delta = Date.now() - timePrev;
      timePrev = Date.now();

      translatePosition.current += (delta / moveTargetTime) * moveTargetPixels;
      timerDiv.style.transform = `translateX(-${translatePosition.current}px)`;
      if (translatePosition.current < moveTargetPixels) {
        animationId = requestAnimationFrame(animationCallback);
      } else {
        if (advance) {
          audioRef.current?.play();
          advanceState();
        }
      }
    };

    timePrev = Date.now();
    animationId = requestAnimationFrame(animationCallback);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeSession, advanceState]);

  return (
    <div
      className="bg-muted h-[75px] rounded-lg shadow-[inset_0_4px_4px_rgba(0,0,0,0.2)] flex items-center overflow-hidden relative"
      style={{ width: `${timerWindowWidth}px` }}
    >
      <audio src="/notification.wav" className="hidden" ref={audioRef} />
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
            left: `${timerWindowWidth / 2 - timerSegmentWidth - 1.5 * gap}px`,
            gap: `${gap}px`,
          }}
        >
          {(previousState === "Idle" ||
            previousState === "Finish" ||
            previousState === "Start") && <IdleTimeLine />}
          {previousState === "SmallBreak" && <SmallBreakTimeLine />}
          {previousState === "BigBreak" && (
            <div
              className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
              style={{ width: `${timerSegmentWidth}px` }}
            >
              <div className="relative -translate-x-1/2">10</div>
              <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
                <TimeLine />
              </div>
            </div>
          )}
          {previousState === "Pause" && (
            <>
              {activeSession.sessionType === "Working" && (
                <SmallBreakTimeLine />
              )}
              {activeSession.sessionType === "SmallBreak" && <WorkTimeLine />}
              {activeSession.sessionType === "BigBreak" && <WorkTimeLine />}
            </>
          )}
          {previousState === "Working" && (
            <div
              className="flex justify-center items-start flex-col h-full relative flex-shrink-0"
              style={{ width: `${timerSegmentWidth}px` }}
            >
              <div className="relative -translate-x-1/2">20</div>
              <div className="w-full h-auto absolute bottom-0 left-0 fill-muted-foreground stroke-muted-foreground">
                <TimeLine />
              </div>
            </div>
          )}

          {activeSession.sessionType === "Start" && <IdleTimeLine />}
          {activeSession.sessionType === "Idle" && (
            <>
              {upcommingSession === "Working" && <WorkTimeLine />}
              {upcommingSession === "SmallBreak" && <SmallBreakTimeLine />}
              {upcommingSession === "BigBreak" && <BigBreakTimeLine />}
            </>
          )}
          {activeSession.sessionType === "Pause" && (
            <>
              {previousState === "Working" && <WorkTimeLine />}
              {previousState === "SmallBreak" && <SmallBreakTimeLine />}
              {previousState === "BigBreak" && <BigBreakTimeLine />}
            </>
          )}
          {activeSession.sessionType === "Working" && <WorkTimeLine />}
          {activeSession.sessionType === "SmallBreak" && <SmallBreakTimeLine />}
          {activeSession.sessionType === "BigBreak" && <BigBreakTimeLine />}

          {(activeSession.sessionType === "Idle" ||
            activeSession.sessionType === "Start") && <IdleTimeLine />}
          {upcommingSession === "Working" && <WorkTimeLine />}
          {upcommingSession === "SmallBreak" && <SmallBreakTimeLine />}
          {upcommingSession === "BigBreak" && <BigBreakTimeLine />}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
