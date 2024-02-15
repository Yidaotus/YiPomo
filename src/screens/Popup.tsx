import {
  CheckCircle,
  FootprintsIcon,
  GripIcon,
  PauseIcon,
  SkipForwardIcon,
  SunIcon,
} from "lucide-react";
import { useCallback } from "react";
import { useAppState, useInitializeAppState } from "../lib/app-state";
import TimerDisplay from "@/components/TimerDisplay";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api";

const Popup = () => {
  useInitializeAppState();

  const pause = useAppState((state) => state.pause);
  const tasks = useAppState((state) => state.tasks);
  const activeSession = useAppState(useShallow((state) => state.activeSession));
  const upcommingSession = useAppState(useShallow((state) => state.upcommingSession));
  const activeTaskId = useAppState((state) => state.activeTask);
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const advanceState = useCallback(() => {
    invoke("advance_state");
  }, []);

  return (
    <div
      className="hover:opacity-100 opacity-100 bg-background flex items-center justify-center  rounded-xl relative transition-opacity w-[340px] h-[150px] group/container border border-muted"
      style={{ transitionDuration: "500ms" }}
    >
      <div
        className="opacity-0 group-hover/container:opacity-100 fixed right-2 top-2 w-4 h-4 select-none z-50 rounded cursor-move transition-opacity"
        data-tauri-drag-region
      >
        <GripIcon className="h-4 w-4 text-muted-foreground select-none pointer-events-none" />
      </div>
      <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
        <div className="w-full flex justify-between items-center px-4 text-muted-foreground">
          <Button variant="link" onClick={pause} className="w-8 h-8 p-0">
            <PauseIcon className="w-8 h-8 stroke-1 text-muted-foreground" />
          </Button>
          <TimerDisplay />
          <Button variant="link" onClick={pause} className="w-8 h-8 p-0">
            <SkipForwardIcon className="w-8 h-8 stroke-1 text-muted-foreground" />
          </Button>
        </div>

        <div className="h-[50px]">
          <div className="w-[295px] relative">
            {["Idle", "Start", "Finish"].includes(activeSession) && (
              <div className="h-[46px] w-full">
                <div className="relative w-full group h-[40px]">
                  <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#D9D9D950] rounded-xl" />
                  <Button
                    className="relative w-full h-full text-base font-medium bg-muted text-foreground group-hover:bg-muted/80"
                    onClick={advanceState}
                    disabled={tasks.length < 1}
                  >
                    {upcommingSession === "Working" && (
                      <span>Start Work Period</span>
                    )}
                    {upcommingSession === "SmallBreak" && (
                      <span>Time to strech your legs!</span>
                    )}
                    {upcommingSession === "BigBreak" && (
                      <span>Start Big Pause Period</span>
                    )}
                    {activeSession === "Start" && <span>Start Pomodoros</span>}
                    {activeSession === "Finish" && (
                      <span>Restart Pomodoros</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {["Working", "SmallBreak", "BigBreak"].includes(activeSession) && (
              <div className="h-[50px]">
                <div className="w-full relative h-[40px]">
                  <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between shadow relative z-20 font-medium px-4">
                    <span className="text-muted-foreground">
                      {activeSession === "Working" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {activeSession === "SmallBreak" && (
                        <FootprintsIcon className="w-4 h-4" />
                      )}
                      {activeSession === "BigBreak" && (
                        <SunIcon className="w-4 h-4" />
                      )}
                    </span>
                    {activeSession === "Working" && (
                      <span>{activeTask?.name}</span>
                    )}
                    {activeSession === "SmallBreak" && (
                      <span>Small Break</span>
                    )}
                    {activeSession === "BigBreak" && (
                      <span>Big Break</span>
                    )}

                    {activeSession === "Working" && (
                      <div className="text-sm relative text-muted-foreground">
                        <span className="relative left-[-1px] top-[-5px] inline-block">
                          {activeTask?.completed}
                        </span>
                        <span className="relative inline-block rotate-12">
                          /
                        </span>
                        <span className="relative left-[1px] top-[5px] inline-block">
                          {activeTask?.length}
                        </span>
                      </div>
                    )}
                    {activeSession === "SmallBreak" && (
                      <FootprintsIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    {activeSession === "BigBreak" && (
                      <SunIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="h-full w-[95%] absolute bottom-[-8px] left-1/2 -translate-x-1/2 bg-[#D9D9D9] rounded-2xl shadow z-10" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
