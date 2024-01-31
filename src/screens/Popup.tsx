import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { GripIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppState, useInitializeAppState } from "../lib/app-state";

type StartTimerEventPayload = {
  duration: number;
};

const TaskView = () => {
  const tasks = useAppState((state) => state.tasks);
  const removeTask = useAppState((state) => state.removeTask);
  const activeTask = tasks[tasks.length - 1];

  const delTask = useCallback(() => {
    removeTask(activeTask);
  }, [activeTask]);

  return (
    <div className="flex gap-2 justify-between">
      <span>{activeTask?.name || "No active Task!"}</span>
      <button onClick={delTask}>DEL</button>
    </div>
  );
};

const Popup = () => {
  useInitializeAppState();

  let [timer, setTimer] = useState(0);

  useEffect(() => {
    let unlisten: Promise<UnlistenFn> | null = null;
    let timerId: ReturnType<typeof setInterval> | null = null;
    unlisten = listen<StartTimerEventPayload>("start-timer", (event) => {
      if (timerId) clearInterval(timerId);
      setTimer(event.payload.duration);
      timerId = setInterval(() => {
        setTimer((currentTimer) => currentTimer - 1);
      }, 5000);
    });

    return () => {
      unlisten?.then((f) => f());
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return (
    <div
      className="bg-[#eef1f040] bg-background px-4 py-3 flex items-center justify-center  h-screen w-screen rounded-xl relative transition-colors"
      style={{ transitionDuration: "2000ms" }}
    >
      <div
        className="fixed right-4 top-4 w-4 h-4 select-none z-50 rounded cursor-move"
        data-tauri-drag-region
      >
        <GripIcon className="h-4 w-4 text-primary select-none pointer-events-none" />
      </div>

      <div className="flex items-end h-full w-full gap-4">
        <h1 className="text-7xl font-bold leading-none">{timer}</h1>
        <div className="flex gap-2 w-full flex-1 flex-col pb-3">
          <TaskView />
          <div className="rounded-lg bg-muted w-full relative h-3">
            <div className="rounded-lg bg-red-400 w-1/3 absolute left-[2px] top-[2px] h-2 drop-shadow" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
