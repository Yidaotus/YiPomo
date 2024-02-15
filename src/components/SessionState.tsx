import { getUpcommingDisplayState, useAppState } from "@/lib/app-state";
import { useCallback, useMemo, useState } from "react";
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

const SessionState = () => {
  const activeSession = useAppState((state) => state.activeSession);
  const sessionHistory = useAppState((state) => state.sessionHistory);
  const upcommingSession = useMemo(
    () => getUpcommingDisplayState(activeSession.sessionType, sessionHistory),
    [sessionHistory, activeSession],
  );
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

  return (
    <div className="w-full flex flex-col gap-4 justify-center items-center pt-12 pb-10 relative">
      <div className="absolute top-4 right-12 w-4 h-4">
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
        <TimerDisplay advance={!popupVisible} />
        <Button variant="link" onClick={pause} className="w-8 h-8 p-0">
          <SkipForwardIcon className="w-8 h-8 stroke-1 text-muted-foreground" />
        </Button>
      </div>
      <div className="h-12 w-[300px] relative">
        {["Idle", "Start", "Finish"].includes(activeSession.sessionType) && (
          <div className="relative w-full h-full group">
            <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#D9D9D950] rounded-xl" />
            <Button
              className="relative w-full h-full text-base font-medium bg-muted text-foreground group-hover:bg-muted/80"
              onClick={advanceState}
              disabled={tasks.length < 1}
            >
              {upcommingSession === "Working" && <span>Start Work Period</span>}
              {upcommingSession === "SmallBreak" && (
                <span>Time to strech your legs!</span>
              )}
              {upcommingSession === "BigBreak" && (
                <span>Start Big Pause Period</span>
              )}
              {activeSession.sessionType === "Start" && (
                <span>Start Pomodoros</span>
              )}
              {activeSession.sessionType === "Finish" && (
                <span>Restart Pomodoros</span>
              )}
            </Button>
          </div>
        )}

        {["Working", "SmallBreak", "BigBreak"].includes(
          activeSession.sessionType,
        ) && (
          <div className="h-[50px]">
            <div className="w-full relative h-[40px]">
              <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between shadow relative z-20 font-medium px-4">
                <span className="text-muted-foreground">
                  {activeSession.sessionType === "Working" && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {activeSession.sessionType === "SmallBreak" && (
                    <FootprintsIcon className="w-4 h-4" />
                  )}
                  {activeSession.sessionType === "BigBreak" && (
                    <SunIcon className="w-4 h-4" />
                  )}
                </span>
                {activeSession.sessionType === "Working" && (
                  <span>{activeTask?.name}</span>
                )}
                {activeSession.sessionType === "SmallBreak" && (
                  <span>Small Break</span>
                )}
                {activeSession.sessionType === "BigBreak" && (
                  <span>Big Break</span>
                )}

                {activeSession.sessionType === "Working" && (
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
                {activeSession.sessionType === "SmallBreak" && (
                  <FootprintsIcon className="w-4 h-4 text-muted-foreground" />
                )}
                {activeSession.sessionType === "BigBreak" && (
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
