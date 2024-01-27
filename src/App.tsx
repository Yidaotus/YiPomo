import { invoke } from "@tauri-apps/api/tauri";
import {
    BotIcon,
    MenuIcon,
    PlayIcon,
    PlusIcon,
    ShieldCloseIcon,
} from "lucide-react";
import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";

type Task = {
    name: string;
    done: boolean;
};

function App() {
    const [taskInputText, setTaskInputText] = useState("");
    const [tasks, setTasks] = useState<Array<Task>>([]);

    const closePopup = async () => {
        await invoke("close_popup", {});
    };

    const showPopup = async () => {
        await invoke("open_popup", {});
    };

    const startTimer = async () => {
        await invoke("start_timer", { duration: 25 });
    };

    const addTask = async () => {
        const name = taskInputText;
        const tasks = await invoke("add_task", { name });
        setTasks(tasks as Task[]);
        setTaskInputText("");
    };

    return (
        <div className="h-screen">
            <div className="bg-primary text-primary-foreground h-44 flex flex-col rounded-b-3xl drop-shadow-md">
                <div className="flex justify-between px-8 py-2 ">
                    <h1 className="text-4xl font-bold">YiPomo</h1>
                    <div>
                        <MenuIcon className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex px-8 items-end h-full py-4 gap-4">
                    <h1 className="text-8xl font-bold leading-none">25</h1>
                    <div className="flex gap-2 w-full flex-col pb-4">
                        <p>Figma MVP Design</p>
                        <div className="rounded-lg bg-primary-foreground w-full relative h-3">
                            <div className="rounded-lg bg-red-400 w-1/3 absolute left-[2px] top-[2px] h-2 drop-shadow" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-8 py-8 flex flex-col gap-4 max-h-[60vh] overflow-y-scroll">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <ul className="flex flex-col gap-3">
                    {tasks.map((task) => (
                        <li className="flex gap-2 items-center" key={task.name}>
                            <Checkbox id="terms2" checked={task.done} />
                            <span className="font-medium">{task.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="border-b border-muted-foreground h-1 w-full px-8" />
            <div className="flex gap-2 items-center px-8">
                <Input
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addTask();
                        }
                    }}
                    className="w-full"
                    type="text"
                    placeholder="New Task"
                    value={taskInputText}
                    onChange={(e) => setTaskInputText(e.target.value)}
                />
                <Button onClick={() => addTask()}>
                    <PlusIcon className="w-4 h-4" />
                </Button>
                <Button onClick={() => showPopup()}>
                    <BotIcon className="w-4 h-4" />
                </Button>
                <Button onClick={() => closePopup()}>
                    <ShieldCloseIcon className="w-4 h-4" />
                </Button>
                <Button onClick={() => startTimer()}>
                    <PlayIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

export default App;
