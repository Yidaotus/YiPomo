import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { CheckCircle, FootprintsIcon, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import TaskView from "./components/Task";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { addMinutes } from "date-fns";
import {
  subscribeAppState,
  useAppState,
  useSynchAppState,
} from "./lib/app-state";
import TimerDisplay from "./components/TimerDisplay";
import { useShallow } from "zustand/react/shallow";

function App() {
  const tasks = useAppState((state) => state.tasks);
  const [finishTimeValues, setFinishTimeValues] = useState({
    sessionHours: 0,
    sessionMinutes: 0,
    finish: new Date(),
  });

  const sessionState = useAppState(useShallow((state) => state.sessionState));
  const stateAddTask = useAppState((state) => state.addTask);
  const stateMoveTask = useAppState((state) => state.moveTask);
  const activeTaskId = useAppState((state) => state.activeTask);
  useSynchAppState();
  const removeTask = useAppState((state) => state.removeTask);
  const checkTask = useAppState((state) => state.checkTask);
  const [taskNameInput, setTaskNameInput] = useState("");
  const [taskDurationInput, setTaskDurationInput] = useState(1);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const advanceState = useCallback(() => {
    invoke("advance_state");
  }, []);

  const delTask = useCallback((taskId: string) => {
    removeTask(taskId);
  }, []);

  const closePopup = async () => {
    await invoke("close_popup", {});
  };

  const showPopup = async () => {
    await invoke("open_popup", {});
  };

  const startTimer = async () => {
    await invoke("start_timer", { duration: 25 });
  };

  useEffect(() => {
    const unsub = subscribeAppState();
    return () => {
      unsub.then((us) => us());
    };
  }, []);

  const commitTaskMove = async (ids: [string, string]) => {
    stateMoveTask(ids);
  };

  const addTask = async () => {
    stateAddTask({
      length: taskDurationInput,
      name: taskNameInput,
      done: false,
    });
    setTaskNameInput("");
    setTaskDurationInput(1);
  };

  const SMALL_BREAK_DURATION = 5;
  const LONG_BREAK_DURATION = 15;
  const WORK_DURATION = 25;

  const calculateTimes = useCallback(() => {
    const numberOfPomodorosLeft = tasks
      .filter((t) => !t.done)
      .reduce((v, t) => (v += t.length), 0);

    const longBreaks = Math.max(0, Math.floor((numberOfPomodorosLeft - 1) / 4));
    const shortBreaks = Math.max(0, numberOfPomodorosLeft - 1 - longBreaks);

    const longBreakDuration = longBreaks * LONG_BREAK_DURATION;
    const shortBreakDuration = shortBreaks * SMALL_BREAK_DURATION;
    const workDuration = numberOfPomodorosLeft * WORK_DURATION;

    const sessionDuration =
      workDuration + shortBreakDuration + longBreakDuration;
    setFinishTimeValues({
      sessionHours: Math.floor(sessionDuration / 60),
      sessionMinutes: Math.floor(sessionDuration % 60),
      finish: addMinutes(new Date(), sessionDuration),
    });
  }, [tasks]);

  useEffect(() => {
    calculateTimes();
    const secondsToWholeMinute = 60 - new Date().getSeconds();
    let timerId: ReturnType<typeof setInterval>;

    const timeOutId = setTimeout(() => {
      calculateTimes();
      timerId = setInterval(() => {
        calculateTimes();
      }, 60 * 1000);
    }, secondsToWholeMinute * 1000);

    return () => {
      clearInterval(timerId);
      clearTimeout(timeOutId);
    };
  }, [calculateTimes]);

  return (
    <div className="h-screen flex flex-col px-4 pb-4 bg-background">
      <div className="w-full flex flex-col gap-4 justify-center items-center pt-12 pb-10">
        <TimerDisplay />
        <div className="h-12 w-[300px] relative">
          {["Idle", "Start", "Finish"].includes(sessionState.active) && (
            <div className="relative w-full h-full group">
              <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#E9E9E9] rounded-xl" />
              <button
                className="h-full bg-muted group-hover:bg-gray-100 disabled:text-muted-foreground disabled:cursor-not-allowed w-full rounded-xl flex items-center justify-center text-foreground text-lg font-medium relative shadow-[#D9D9D9] shadow"
                onClick={advanceState}
                disabled={tasks.length < 1}
              >
                {sessionState.upcomming === "Working" && (
                  <span>Start Work Period</span>
                )}
                {sessionState.upcomming === "SmallBreak" && (
                  <span>Start Pause Period</span>
                )}
                {sessionState.upcomming === "BigBreak" && (
                  <span>Start Big Pause Period</span>
                )}
              </button>
            </div>
          )}
          {sessionState.active === "Working" && (
            <div className="w-full h-full relative">
              <div className="w-full h-full bg-muted text-foreground rounded-xl flex items-center justify-between text-lg shadow relative z-20 font-medium px-4">
                <span className="text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <span>{activeTask?.name}</span>

                <div className="text-sm relative text-muted-foreground">
                  <span className="relative left-[-1px] top-[-5px] inline-block">
                    {activeTask?.completed}
                  </span>
                  <span className="relative inline-block rotate-12">/</span>
                  <span className="relative left-[1px] top-[5px] inline-block">
                    {activeTask?.length}
                  </span>
                </div>
              </div>
              <div className="h-full w-[95%] absolute bottom-[-12px] left-1/2 -translate-x-1/2 bg-[#D9D9D9] rounded-2xl shadow z-10" />
            </div>
          )}
          {sessionState.active === "Start" && <span>Start Pomodoros</span>}
          {sessionState.active === "Finish" && <span>Restart Pomodoros</span>}
        </div>
      </div>
      <div className="flex flex-col pb-4 flex-1 h-full overflow-auto">
        <h2 className="text-2xl font-bold pb-2">Tasks</h2>
        <div className="border-t border-muted h-1 w-[80%] pb-2 self-center" />
        <ul className="flex flex-col gap-3 w-full overflow-auto pb-2">
          {tasks
            .filter((t) => !t.done)
            .map((task, i) => (
              <TaskView
                activeTaskId={activeTaskId}
                key={task.id}
                checkTask={checkTask}
                task={task}
                deleteTask={delTask}
                index={i}
                moveTask={commitTaskMove}
              />
            ))}
          {tasks
            .filter((t) => t.done)
            .sort((t1, t2) => t1.name.localeCompare(t2.name))
            .map((task, i) => (
              <TaskView
                activeTaskId={activeTaskId}
                key={task.id}
                checkTask={checkTask}
                task={task}
                deleteTask={delTask}
                index={i}
                moveTask={commitTaskMove}
              />
            ))}
        </ul>
        <Dialog>
          <DialogTrigger className="border-dashed border-muted border-2 rounded-xl flex items-center justify-center text-muted-foreground py-2 gap-2 font-medium">
            <PlusCircle className="w-5 h-5" />
            Add Task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="text-left">
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Add a new Task</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                value={taskNameInput}
                onChange={(e) => setTaskNameInput(e.target.value)}
                placeholder="Task Name"
                className="flex-1 w-full"
              />
              <Input
                type="number"
                placeholder="Duration"
                min={1}
                className="w-24"
                value={taskDurationInput.toString()}
                onChange={(e) =>
                  setTaskDurationInput(Number.parseInt(e.target.value))
                }
              />
            </div>
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addTask()}
                >
                  Add Task
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {tasks.filter((t) => !t.done).length < 1 && (
        <div className="w-full flex items-center justify-center flex-col pt-2">
          <div className="text-2xl text-muted-foreground">All done!</div>
        </div>
      )}
      {tasks.filter((t) => !t.done).length > 0 && (
        <div className="w-full flex items-center justify-center flex-col pt-2">
          <div className="text-lg font-medium">Finish at</div>
          <div className="text-4xl font-medium">
            {`${finishTimeValues.finish
              .getHours()
              .toString()
              .padStart(2, "0")}:${finishTimeValues.finish
              .getMinutes()
              .toString()
              .padStart(2, "0")}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {`${finishTimeValues.sessionHours} Hours ${finishTimeValues.sessionMinutes} Minutes`}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
