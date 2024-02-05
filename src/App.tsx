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
import { PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
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
  <svg
    width="205"
    height="20"
    viewBox="0 0 205 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 15C0 14.4477 0.447715 14 1 14C1.55228 14 2 14.4477 2 15V19C2 19.5523 1.55228 20 1 20C0.447715 20 0 19.5523 0 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M6 15C6 14.4477 6.44772 14 7 14C7.55228 14 8 14.4477 8 15V19C8 19.5523 7.55228 20 7 20C6.44772 20 6 19.5523 6 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M12 15C12 14.4477 12.4477 14 13 14C13.5523 14 14 14.4477 14 15V19C14 19.5523 13.5523 20 13 20C12.4477 20 12 19.5523 12 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M18 15C18 14.4477 18.4477 14 19 14C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20C18.4477 20 18 19.5523 18 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M24 15C24 14.4477 24.4477 14 25 14C25.5523 14 26 14.4477 26 15V19C26 19.5523 25.5523 20 25 20C24.4477 20 24 19.5523 24 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M30 7C30 6.44772 30.4477 6 31 6C31.5523 6 32 6.44772 32 7V19C32 19.5523 31.5523 20 31 20C30.4477 20 30 19.5523 30 19V7Z"
      fill="#D9D9D9"
    />
    <path
      d="M36 15C36 14.4477 36.4477 14 37 14C37.5523 14 38 14.4477 38 15V19C38 19.5523 37.5523 20 37 20C36.4477 20 36 19.5523 36 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M42 15C42 14.4477 42.4477 14 43 14C43.5523 14 44 14.4477 44 15V19C44 19.5523 43.5523 20 43 20C42.4477 20 42 19.5523 42 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M48 15C48 14.4477 48.4477 14 49 14C49.5523 14 50 14.4477 50 15V19C50 19.5523 49.5523 20 49 20C48.4477 20 48 19.5523 48 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M54 15C54 14.4477 54.4477 14 55 14C55.5523 14 56 14.4477 56 15V19C56 19.5523 55.5523 20 55 20C54.4477 20 54 19.5523 54 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M60 15C60 14.4477 60.4477 14 61 14C61.5523 14 62 14.4477 62 15V19C62 19.5523 61.5523 20 61 20C60.4477 20 60 19.5523 60 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M66 7C66 6.44772 66.4477 6 67 6C67.5523 6 68 6.44772 68 7V19C68 19.5523 67.5523 20 67 20C66.4477 20 66 19.5523 66 19V7Z"
      fill="#D9D9D9"
    />
    <path
      d="M72 15C72 14.4477 72.4477 14 73 14C73.5523 14 74 14.4477 74 15V19C74 19.5523 73.5523 20 73 20C72.4477 20 72 19.5523 72 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M78 15C78 14.4477 78.4477 14 79 14C79.5523 14 80 14.4477 80 15V19C80 19.5523 79.5523 20 79 20C78.4477 20 78 19.5523 78 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M84 15C84 14.4477 84.4477 14 85 14C85.5523 14 86 14.4477 86 15V19C86 19.5523 85.5523 20 85 20C84.4477 20 84 19.5523 84 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M90 15C90 14.4477 90.4477 14 91 14C91.5523 14 92 14.4477 92 15V19C92 19.5523 91.5523 20 91 20C90.4477 20 90 19.5523 90 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M96 15C96 14.4477 96.4477 14 97 14C97.5523 14 98 14.4477 98 15V19C98 19.5523 97.5523 20 97 20C96.4477 20 96 19.5523 96 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M102 1C102 0.447716 102.448 0 103 0C103.552 0 104 0.447715 104 1V19C104 19.5523 103.552 20 103 20C102.448 20 102 19.5523 102 19V1Z"
      fill="#D9D9D9"
    />
    <path
      d="M107 15C107 14.4477 107.448 14 108 14C108.552 14 109 14.4477 109 15V19C109 19.5523 108.552 20 108 20C107.448 20 107 19.5523 107 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M113 15C113 14.4477 113.448 14 114 14C114.552 14 115 14.4477 115 15V19C115 19.5523 114.552 20 114 20C113.448 20 113 19.5523 113 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M119 15C119 14.4477 119.448 14 120 14C120.552 14 121 14.4477 121 15V19C121 19.5523 120.552 20 120 20C119.448 20 119 19.5523 119 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M125 15C125 14.4477 125.448 14 126 14C126.552 14 127 14.4477 127 15V19C127 19.5523 126.552 20 126 20C125.448 20 125 19.5523 125 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M131 15C131 14.4477 131.448 14 132 14C132.552 14 133 14.4477 133 15V19C133 19.5523 132.552 20 132 20C131.448 20 131 19.5523 131 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M137 7C137 6.44772 137.448 6 138 6C138.552 6 139 6.44772 139 7V19C139 19.5523 138.552 20 138 20C137.448 20 137 19.5523 137 19V7Z"
      fill="#D9D9D9"
    />
    <path
      d="M143 15C143 14.4477 143.448 14 144 14C144.552 14 145 14.4477 145 15V19C145 19.5523 144.552 20 144 20C143.448 20 143 19.5523 143 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M149 15C149 14.4477 149.448 14 150 14C150.552 14 151 14.4477 151 15V19C151 19.5523 150.552 20 150 20C149.448 20 149 19.5523 149 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M155 15C155 14.4477 155.448 14 156 14C156.552 14 157 14.4477 157 15V19C157 19.5523 156.552 20 156 20C155.448 20 155 19.5523 155 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M161 15C161 14.4477 161.448 14 162 14C162.552 14 163 14.4477 163 15V19C163 19.5523 162.552 20 162 20C161.448 20 161 19.5523 161 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M167 15C167 14.4477 167.448 14 168 14C168.552 14 169 14.4477 169 15V19C169 19.5523 168.552 20 168 20C167.448 20 167 19.5523 167 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M173 7C173 6.44772 173.448 6 174 6C174.552 6 175 6.44772 175 7V19C175 19.5523 174.552 20 174 20C173.448 20 173 19.5523 173 19V7Z"
      fill="#D9D9D9"
    />
    <path
      d="M179 15C179 14.4477 179.448 14 180 14C180.552 14 181 14.4477 181 15V19C181 19.5523 180.552 20 180 20C179.448 20 179 19.5523 179 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M185 15C185 14.4477 185.448 14 186 14C186.552 14 187 14.4477 187 15V19C187 19.5523 186.552 20 186 20C185.448 20 185 19.5523 185 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M191 15C191 14.4477 191.448 14 192 14C192.552 14 193 14.4477 193 15V19C193 19.5523 192.552 20 192 20C191.448 20 191 19.5523 191 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M197 15C197 14.4477 197.448 14 198 14C198.552 14 199 14.4477 199 15V19C199 19.5523 198.552 20 198 20C197.448 20 197 19.5523 197 19V15Z"
      fill="#D9D9D9"
    />
    <path
      d="M203 15C203 14.4477 203.448 14 204 14C204.552 14 205 14.4477 205 15V19C205 19.5523 204.552 20 204 20C203.448 20 203 19.5523 203 19V15Z"
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

    const longBreaks = Math.floor((numberOfPomodorosLeft - 1) / 4);
    const shortBreaks = numberOfPomodorosLeft - 1 - longBreaks;

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
    const timerId = setInterval(() => {
      calculateTimes();
    }, 60 * 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [calculateTimes]);

  return (
    <div className="h-screen flex flex-col px-4 pb-4">
      <div className="w-full flex flex-col gap-4 justify-center items-center py-6">
        <div className="bg-muted w-[250px] h-[75px] rounded-lg shadow-[inset_0_4px_4px_rgba(0,0,0,0.2)] flex items-center overflow-hidden relative">
          <div className="relative flex justify-start text-5xl text-muted-foreground items-center h-full gap-[4px] -translate-x-[85px]">
            <div className="w-[205px] flex justify-center items-start flex-col h-full">
              <div className="flex-1 flex items-center justify-center w-full">
                25
              </div>
              <div className="mt-auto">
                <TimeLine />
              </div>
            </div>
            <div className="w-[205px] flex justify-center items-start flex-col h-full ml-[-102px]">
              <div className="flex-1 flex items-center justify-center w-full">
                <PlayIcon />
              </div>
              <div className="mt-auto">
                <TimeLine />
              </div>
            </div>
            <div className="w-[205px] flex justify-center items-start flex-col h-full ml-[-102px]">
              <div className="flex-1 flex items-center justify-center w-full">
                05
              </div>
              <div className="mt-auto">
                <TimeLine />
              </div>
            </div>
          </div>
        </div>
        <div className="h-12 w-[300px] relative">
          <div className="relative w-full h-full">
            <div className="h-12 w-full absolute bottom-[-6px] left-0 bg-[#D9D9D9] rounded-xl" />
            <button
              className="h-full bg-muted w-full rounded-xl flex items-center justify-center text-foreground text-lg font-medium relative shadow-[#D9D9D9] shadow"
              onClick={advanceState}
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 pb-4 flex-1 h-full overflow-auto">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <hr />
        <ul className="flex flex-col gap-3 w-full overflow-auto">
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
    </div>
  );
}

export default App;
