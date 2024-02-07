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
import { FootprintsIcon, PlusCircle } from "lucide-react";
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

const PlayIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="#474B50"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 4.8541C1 2.62396 3.34694 1.17347 5.34164 2.17082L27.6334 13.3167C29.8446 14.4223 29.8446 17.5777 27.6334 18.6833L5.34164 29.8292C3.34694 30.8265 1 29.376 1 27.1459V4.8541Z"
      stroke="#474B50"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const TimeLine = () => (
  <svg viewBox="0 0 210 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M43.4483 15.75C43.4483 15.1701 44.0967 14.7 44.8965 14.7C45.6964 14.7 46.3448 15.1701 46.3448 15.75V19.95C46.3448 20.5299 45.6964 21 44.8965 21C44.0967 21 43.4483 20.5299 43.4483 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M52.1379 15.75C52.1379 15.1701 52.7863 14.7 53.5862 14.7C54.3861 14.7 55.0345 15.1701 55.0345 15.75V19.95C55.0345 20.5299 54.3861 21 53.5862 21C52.7863 21 52.1379 20.5299 52.1379 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M60.8276 7.35C60.8276 6.7701 61.476 6.3 62.2759 6.3C63.0757 6.3 63.7241 6.7701 63.7241 7.35V19.95C63.7241 20.5299 63.0757 21 62.2759 21C61.476 21 60.8276 20.5299 60.8276 19.95V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M69.5172 15.75C69.5172 15.1701 70.1657 14.7 70.9655 14.7C71.7654 14.7 72.4138 15.1701 72.4138 15.75V19.95C72.4138 20.5299 71.7654 21 70.9655 21C70.1657 21 69.5172 20.5299 69.5172 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M78.2069 15.75C78.2069 15.1701 78.8553 14.7 79.6552 14.7C80.455 14.7 81.1034 15.1701 81.1034 15.75V19.95C81.1034 20.5299 80.455 21 79.6552 21C78.8553 21 78.2069 20.5299 78.2069 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M86.8965 15.75C86.8965 15.1701 87.545 14.7 88.3448 14.7C89.1447 14.7 89.7931 15.1701 89.7931 15.75V19.95C89.7931 20.5299 89.1447 21 88.3448 21C87.545 21 86.8965 20.5299 86.8965 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M95.5862 15.75C95.5862 15.1701 96.2346 14.7 97.0345 14.7C97.8343 14.7 98.4828 15.1701 98.4828 15.75V19.95C98.4828 20.5299 97.8343 21 97.0345 21C96.2346 21 95.5862 20.5299 95.5862 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M104.276 1.05C104.276 0.470101 104.924 0 105.724 0C106.524 0 107.172 0.470101 107.172 1.05V19.95C107.172 20.5299 106.524 21 105.724 21C104.924 21 104.276 20.5299 104.276 19.95V1.05Z"
      fill="#D9D9D9"
    />
    <path
      d="M111.517 15.75C111.517 15.1701 112.166 14.7 112.966 14.7C113.765 14.7 114.414 15.1701 114.414 15.75V19.95C114.414 20.5299 113.765 21 112.966 21C112.166 21 111.517 20.5299 111.517 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M120.207 15.75C120.207 15.1701 120.855 14.7 121.655 14.7C122.455 14.7 123.103 15.1701 123.103 15.75V19.95C123.103 20.5299 122.455 21 121.655 21C120.855 21 120.207 20.5299 120.207 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M128.897 15.75C128.897 15.1701 129.545 14.7 130.345 14.7C131.145 14.7 131.793 15.1701 131.793 15.75V19.95C131.793 20.5299 131.145 21 130.345 21C129.545 21 128.897 20.5299 128.897 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M137.586 15.75C137.586 15.1701 138.235 14.7 139.034 14.7C139.834 14.7 140.483 15.1701 140.483 15.75V19.95C140.483 20.5299 139.834 21 139.034 21C138.235 21 137.586 20.5299 137.586 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M146.276 7.35C146.276 6.7701 146.924 6.3 147.724 6.3C148.524 6.3 149.172 6.7701 149.172 7.35V19.95C149.172 20.5299 148.524 21 147.724 21C146.924 21 146.276 20.5299 146.276 19.95V13.65V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M154.966 15.75C154.966 15.1701 155.614 14.7 156.414 14.7C157.214 14.7 157.862 15.1701 157.862 15.75V19.95C157.862 20.5299 157.214 21 156.414 21C155.614 21 154.966 20.5299 154.966 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M163.655 15.75C163.655 15.1701 164.304 14.7 165.103 14.7C165.903 14.7 166.552 15.1701 166.552 15.75V19.95C166.552 20.5299 165.903 21 165.103 21C164.304 21 163.655 20.5299 163.655 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M43.4483 15.75C43.4483 15.1701 44.0967 14.7 44.8965 14.7C45.6964 14.7 46.3448 15.1701 46.3448 15.75V19.95C46.3448 20.5299 45.6964 21 44.8965 21C44.0967 21 43.4483 20.5299 43.4483 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M52.1379 15.75C52.1379 15.1701 52.7863 14.7 53.5862 14.7C54.3861 14.7 55.0345 15.1701 55.0345 15.75V19.95C55.0345 20.5299 54.3861 21 53.5862 21C52.7863 21 52.1379 20.5299 52.1379 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M60.8276 7.35C60.8276 6.7701 61.476 6.3 62.2759 6.3C63.0757 6.3 63.7241 6.7701 63.7241 7.35V19.95C63.7241 20.5299 63.0757 21 62.2759 21C61.476 21 60.8276 20.5299 60.8276 19.95V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M69.5172 15.75C69.5172 15.1701 70.1657 14.7 70.9655 14.7C71.7654 14.7 72.4138 15.1701 72.4138 15.75V19.95C72.4138 20.5299 71.7654 21 70.9655 21C70.1657 21 69.5172 20.5299 69.5172 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M78.2069 15.75C78.2069 15.1701 78.8553 14.7 79.6552 14.7C80.455 14.7 81.1034 15.1701 81.1034 15.75V19.95C81.1034 20.5299 80.455 21 79.6552 21C78.8553 21 78.2069 20.5299 78.2069 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M0 15.75C0 15.1701 0.648415 14.7 1.44828 14.7C2.24814 14.7 2.89655 15.1701 2.89655 15.75V19.95C2.89655 20.5299 2.24814 21 1.44828 21C0.648415 21 0 20.5299 0 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M8.68965 15.75C8.68965 15.1701 9.33807 14.7 10.1379 14.7C10.9378 14.7 11.5862 15.1701 11.5862 15.75V19.95C11.5862 20.5299 10.9378 21 10.1379 21C9.33807 21 8.68965 20.5299 8.68965 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M17.3793 7.35C17.3793 6.7701 18.0277 6.3 18.8276 6.3C19.6274 6.3 20.2759 6.7701 20.2759 7.35V19.95C20.2759 20.5299 19.6274 21 18.8276 21C18.0277 21 17.3793 20.5299 17.3793 19.95V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M26.069 15.75C26.069 15.1701 26.7174 14.7 27.5172 14.7C28.3171 14.7 28.9655 15.1701 28.9655 15.75V19.95C28.9655 20.5299 28.3171 21 27.5172 21C26.7174 21 26.069 20.5299 26.069 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M34.7586 15.75C34.7586 15.1701 35.407 14.7 36.2069 14.7C37.0068 14.7 37.6552 15.1701 37.6552 15.75V19.95C37.6552 20.5299 37.0068 21 36.2069 21C35.407 21 34.7586 20.5299 34.7586 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M0 15.75C0 15.1701 0.648415 14.7 1.44828 14.7C2.24814 14.7 2.89655 15.1701 2.89655 15.75V19.95C2.89655 20.5299 2.24814 21 1.44828 21C0.648415 21 0 20.5299 0 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M8.68965 15.75C8.68965 15.1701 9.33807 14.7 10.1379 14.7C10.9378 14.7 11.5862 15.1701 11.5862 15.75V19.95C11.5862 20.5299 10.9378 21 10.1379 21C9.33807 21 8.68965 20.5299 8.68965 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M17.3793 7.35C17.3793 6.7701 18.0277 6.3 18.8276 6.3C19.6274 6.3 20.2759 6.7701 20.2759 7.35V19.95C20.2759 20.5299 19.6274 21 18.8276 21C18.0277 21 17.3793 20.5299 17.3793 19.95V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M26.069 15.75C26.069 15.1701 26.7174 14.7 27.5172 14.7C28.3171 14.7 28.9655 15.1701 28.9655 15.75V19.95C28.9655 20.5299 28.3171 21 27.5172 21C26.7174 21 26.069 20.5299 26.069 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M34.7586 15.75C34.7586 15.1701 35.407 14.7 36.2069 14.7C37.0068 14.7 37.6552 15.1701 37.6552 15.75V19.95C37.6552 20.5299 37.0068 21 36.2069 21C35.407 21 34.7586 20.5299 34.7586 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M172.345 15.75C172.345 15.1701 172.993 14.7 173.793 14.7C174.593 14.7 175.241 15.1701 175.241 15.75V19.95C175.241 20.5299 174.593 21 173.793 21C172.993 21 172.345 20.5299 172.345 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M181.034 15.75C181.034 15.1701 181.683 14.7 182.483 14.7C183.283 14.7 183.931 15.1701 183.931 15.75V19.95C183.931 20.5299 183.283 21 182.483 21C181.683 21 181.034 20.5299 181.034 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M189.724 7.35C189.724 6.7701 190.373 6.3 191.172 6.3C191.972 6.3 192.621 6.7701 192.621 7.35V19.95C192.621 20.5299 191.972 21 191.172 21C190.373 21 189.724 20.5299 189.724 19.95V13.65V7.35Z"
      fill="#D9D9D9"
    />
    <path
      d="M198.414 15.75C198.414 15.1701 199.062 14.7 199.862 14.7C200.662 14.7 201.31 15.1701 201.31 15.75V19.95C201.31 20.5299 200.662 21 199.862 21C199.062 21 198.414 20.5299 198.414 19.95V15.75Z"
      fill="#D9D9D9"
    />
    <path
      d="M207.103 15.75C207.103 15.1701 207.752 14.7 208.552 14.7C209.352 14.7 210 15.1701 210 15.75V19.95C210 20.5299 209.352 21 208.552 21C207.752 21 207.103 20.5299 207.103 19.95V15.75Z"
      fill="#D9D9D9"
    />
  </svg>
);

function App() {
  const tasks = useAppState((state) => state.tasks);
  const [finishTimeValues, setFinishTimeValues] = useState({
    sessionHours: 0,
    sessionMinutes: 0,
    finish: new Date(),
  });

  const stateAddTask = useAppState((state) => state.addTask);
  const stateMoveTask = useAppState((state) => state.moveTask);
  const activeTask = useAppState((state) => state.activeTask);
  useSynchAppState();
  const removeTask = useAppState((state) => state.removeTask);
  const checkTask = useAppState((state) => state.checkTask);
  const [taskNameInput, setTaskNameInput] = useState("");
  const [taskDurationInput, setTaskDurationInput] = useState(1);
  const sessionState = useAppState((state) => state.sessionState);

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

  console.debug({ tasks });

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

    setTimeout(() => {
      calculateTimes();
      timerId = setInterval(() => {
        calculateTimes();
      }, 60 * 1000);
    }, secondsToWholeMinute * 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [calculateTimes]);

  return (
    <div className="h-screen flex flex-col px-4 pb-4 bg-background">
      <div className="w-full flex flex-col gap-4 justify-center items-center py-6">
        <div className="bg-muted w-[248px] h-[75px] rounded-lg shadow-[inset_0_4px_4px_rgba(0,0,0,0.2)] flex items-center overflow-hidden relative">
          <div className="flex justify-start text-5xl text-muted-foreground items-center w-full gap-1.5 h-full left-[6px] relative -translate-x-[432px] font-medium">
            <div className="w-[200px] flex justify-center items-start flex-col h-full relative flex-shrink-0">
              <div className="flex items-center justify-center w-full relative -top-2">
                <PlayIcon />
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0">
                <TimeLine />
              </div>
            </div>
            <div className="w-[210px] flex justify-center items-start flex-col h-full relative flex-shrink-0">
              <div className="flex items-center justify-center w-full relative -top-2">
                05
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0">
                <TimeLine />
              </div>
            </div>
            <div className="w-[210px] flex justify-center items-start flex-col h-full relative flex-shrink-0">
              <div className="flex items-center justify-center w-full relative -top-2">
                10
              </div>
              <div className="w-full h-auto absolute bottom-0 left-0">
                <TimeLine />
              </div>
            </div>
          </div>
        </div>
        <div className="h-12 w-[300px] relative">
          <div className="relative w-full h-full group">
            <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] group-hover:bg-[#E9E9E9] rounded-xl" />
            <button
              className="h-full bg-muted group-hover:bg-gray-100 disabled:text-muted-foreground disabled:cursor-not-allowed w-full rounded-xl flex items-center justify-center text-foreground text-lg font-medium relative shadow-[#D9D9D9] shadow"
              onClick={advanceState}
              disabled={tasks.length < 1}
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-4 flex-1 h-full overflow-auto">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <hr />
        <ul className="flex flex-col gap-3 w-full overflow-auto pb-2">
          {tasks
            .filter((t) => !t.done)
            .map((task, i) => (
              <TaskView
                activeTaskId={activeTask}
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
                activeTaskId={activeTask}
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
      <p>{sessionState}</p>
      {tasks.filter((t) => !t.done).length < 1 && (
        <div className="w-full flex items-center justify-center flex-col pt-2">
          <div className="text-2xl text-muted-foreground">
            All done!
          </div>
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
            {`${finishTimeValues.sessionHours} Hour ${finishTimeValues.sessionMinutes} Minutes`}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
