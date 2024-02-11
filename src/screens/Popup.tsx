import { CheckCircle, FootprintsIcon, GripIcon, SunIcon } from "lucide-react";
import { useCallback } from "react";
import { useAppState, useInitializeAppState } from "../lib/app-state";
import TimerDisplay from "@/components/TimerDisplay";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api";

const Popup = () => {
  useInitializeAppState();

  const tasks = useAppState((state) => state.tasks);
  const sessionState = useAppState(useShallow((state) => state.sessionState));
  const activeTaskId = useAppState((state) => state.activeTask);
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const advanceState = useCallback(() => {
    invoke("advance_state");
  }, []);

  return (
    <div
      className="hover:opacity-100 opacity-90 bg-background flex items-center justify-center  rounded-xl relative transition-opacity w-screen h-screen overflow-hidden"
      style={{ transitionDuration: "500ms" }}
    >
      <div
        className="fixed right-4 top-4 w-4 h-4 select-none z-50 rounded cursor-move"
        data-tauri-drag-region
      >
        <GripIcon className="h-4 w-4 text-primary select-none pointer-events-none" />
      </div>
      <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
        <TimerDisplay />

        <div className="h-[50px]">
          <div className="w-[295px] relative">
            {["Idle", "Start", "Finish"].includes(sessionState.active) && (
              <div className="h-[46px] w-full">
                <div className="relative w-full group h-[40px]">
                  <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#D9D9D950] rounded-xl" />
                  <Button
                    className="relative w-full h-full text-base font-medium bg-muted text-foreground group-hover:bg-muted/80"
                    onClick={advanceState}
                    disabled={tasks.length < 1}
                  >
                    {sessionState.upcomming === "Working" && (
                      <span>Start Work Period</span>
                    )}
                    {sessionState.upcomming === "SmallBreak" && (
                      <span>Time to strech your legs!</span>
                    )}
                    {sessionState.upcomming === "BigBreak" && (
                      <span>Start Big Pause Period</span>
                    )}
                    {sessionState.active === "Start" && (
                      <span>Start Pomodoros</span>
                    )}
                    {sessionState.active === "Finish" && (
                      <span>Restart Pomodoros</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {["Working", "SmallBreak", "BigBreak"].includes(
              sessionState.active,
            ) && (
              <div className="h-[50px]">
                <div className="w-full relative h-[40px]">
                  <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between shadow relative z-20 font-medium px-4">
                    <span className="text-muted-foreground">
                      {sessionState.active === "Working" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {sessionState.active === "SmallBreak" && (
                        <FootprintsIcon className="w-4 h-4" />
                      )}
                      {sessionState.active === "BigBreak" && (
                        <SunIcon className="w-4 h-4" />
                      )}
                    </span>
                    {sessionState.active === "Working" && (
                      <span>{activeTask?.name}</span>
                    )}
                    {sessionState.active === "SmallBreak" && (
                      <span>Small Break</span>
                    )}
                    {sessionState.active === "BigBreak" && (
                      <span>Big Break</span>
                    )}

                    {sessionState.active === "Working" && (
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
                    {sessionState.active === "SmallBreak" && (
                      <FootprintsIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    {sessionState.active === "BigBreak" && (
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
