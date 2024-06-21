import { SessionType, useAppState } from "@/lib/app-state";
import { useCallback, useState } from "react";
import TimerDisplay from "./TimerDisplay";
import { invoke } from "@tauri-apps/api";
import { Button } from "./ui/button";
import {
  CheckCircle,
  FootprintsIcon,
  PauseIcon,
  PictureInPicture2Icon,
  SkipForwardIcon,
  SunIcon,
} from "lucide-react";

export const DisplayStates: Array<SessionType> = [
  "Working",
  "SmallBreak",
  "BigBreak",
];

const SessionState = () => {
  const activeSession = useAppState((state) => state.activeSession);
  const displayState = useAppState((state) => state.displayState);

  const [popupVisible, setPopupVisible] = useState(false);
  const activeTaskId = useAppState((state) => state.activeTask);
  const tasks = useAppState((state) => state.tasks);
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const pause = useAppState((state) => state.pause);

  const advanceState = useCallback(() => {
    invoke("advance_state");
  }, []);

  const togglePopup = async () => {
    await invoke("toggle_popup", {});
    setPopupVisible((visible) => !visible);
  };

  console.debug(
    `[DEBUG][SessionState]: activeDisplaySession: ${
      displayState.active.sessionType
    } upcommingDisplaySession: ${
      displayState.upcomming
    } \n displayHistory: ${displayState.history
      .map((s) => s.sessionType)
      .join(" - ")}`
  );

  return (
    <div className="w-full flex flex-col gap-4 justify-center items-center relative">
      <div className="absolute top-0 w-4 h-4">
        <Button
          variant="ghost"
          className="text-foreground"
          onClick={togglePopup}
        >
          <PictureInPicture2Icon className="w-4 h-5" />
        </Button>
      </div>
      <div className="w-full flex justify-between items-center px-4 text-muted-foreground">
        <Button variant="link" onClick={pause} className="w-8 h-8 p-0">
          <PauseIcon className="w-8 h-8 stroke-1 text-muted-foreground" />
        </Button>
        <TimerDisplay />
        <Button variant="link" onClick={pause} className="w-8 h-8 p-0">
          <SkipForwardIcon className="w-8 h-8 stroke-1 text-muted-foreground" />
        </Button>
      </div>
      <div className="h-12 w-[80%] relative">
        {activeSession.sessionType === "Pause" && (
          <div className="h-[50px] opacity-50">
            <div className="w-full relative h-[40px]">
              <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between shadow relative z-20 font-medium px-4">
                <span className="text-muted-foreground">
                  {displayState.active.sessionType === "Working" && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {displayState.active.sessionType === "SmallBreak" && (
                    <FootprintsIcon className="w-4 h-4" />
                  )}
                  {displayState.active.sessionType === "BigBreak" && (
                    <SunIcon className="w-4 h-4" />
                  )}
                </span>
                {displayState.active.sessionType === "Working" && (
                  <span>{activeTask?.name}</span>
                )}
                {displayState.active.sessionType === "SmallBreak" && (
                  <span>Small Break</span>
                )}
                {displayState.active.sessionType === "BigBreak" && (
                  <span>Big Break</span>
                )}

                {displayState.active.sessionType === "Working" && (
                  <div className="text-sm relative text-muted-foreground">
                    <span className="relative left-[-1px] top-[-5px] inline-block">
                      {activeTask?.completed}
                    </span>
                    <span className="relative inline-block rotate-12">/</span>
                    <span className="relative left-[1px] top-[5px] inline-block">
                      {activeTask?.length}
                    </span>
                  </div>
                )}
                {displayState.active.sessionType === "SmallBreak" && (
                  <FootprintsIcon className="w-4 h-4 text-muted-foreground" />
                )}
                {displayState.active.sessionType === "BigBreak" && (
                  <SunIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="h-full w-[95%] absolute bottom-[-8px] left-1/2 -translate-x-1/2 bg-[#D9D9D9] rounded-2xl shadow z-10" />
            </div>
          </div>
        )}
        {!(activeSession.sessionType === "Pause") &&
          !DisplayStates.includes(activeSession?.sessionType) && (
            <div className="relative w-full h-full group">
              <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#D9D9D950] rounded-xl" />
              <Button
                className="relative w-full h-full text-base font-medium bg-muted text-foreground group-hover:bg-muted/80"
                onClick={advanceState}
                disabled={tasks.length < 1}
              >
                {displayState.upcomming === "Working" && (
                  <span>Start Work Period</span>
                )}
                {displayState.upcomming === "SmallBreak" && (
                  <span>Time to strech your legs!</span>
                )}
                {displayState.upcomming === "BigBreak" && (
                  <span>Start Big Pause Period</span>
                )}
              </Button>
            </div>
          )}

        {!(activeSession.sessionType === "Pause") &&
          displayState.active &&
          DisplayStates.includes(activeSession.sessionType) && (
            <div className="h-[50px]">
              <div className="w-full relative h-[40px]">
                <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between shadow relative z-20 font-medium px-4">
                  <span className="text-muted-foreground">
                    {displayState.active.sessionType === "Working" && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {displayState.active.sessionType === "SmallBreak" && (
                      <FootprintsIcon className="w-4 h-4" />
                    )}
                    {displayState.active.sessionType === "BigBreak" && (
                      <SunIcon className="w-4 h-4" />
                    )}
                  </span>
                  {displayState.active.sessionType === "Working" && (
                    <span>{activeTask?.name}</span>
                  )}
                  {displayState.active.sessionType === "SmallBreak" && (
                    <span>Small Break</span>
                  )}
                  {displayState.active.sessionType === "BigBreak" && (
                    <span>Big Break</span>
                  )}

                  {displayState.active.sessionType === "Working" && (
                    <div className="text-sm relative text-muted-foreground">
                      <span className="relative left-[-1px] top-[-5px] inline-block">
                        {activeTask?.completed}
                      </span>
                      <span className="relative inline-block rotate-12">/</span>
                      <span className="relative left-[1px] top-[5px] inline-block">
                        {activeTask?.length}
                      </span>
                    </div>
                  )}
                  {displayState.active.sessionType === "SmallBreak" && (
                    <FootprintsIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                  {displayState.active.sessionType === "BigBreak" && (
                    <SunIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="h-full w-[95%] absolute bottom-[-8px] left-1/2 -translate-x-1/2 bg-[#D9D9D9] rounded-2xl shadow z-10" />
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default SessionState;
