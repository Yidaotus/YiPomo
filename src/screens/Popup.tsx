import { confirm } from "@tauri-apps/api/dialog";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { GripIcon } from "lucide-react";
import { useEffect, useState } from "react";

type StartTimerEventPayload = {
    duration: number;
};
const unlisten = await appWindow.onCloseRequested(async (event) => {
    const confirmed = await confirm("Are you sure?");
    if (!confirmed) {
        // user did not confirm closing the window; let's prevent it
        event.preventDefault();
    }
});

const Popup = () => {
    let [timer, setTimer] = useState(0);

    useEffect(() => {
        console.debug("Starting listening");
        let unlisten: Promise<UnlistenFn> | null = null;
        let timerId: ReturnType<typeof setInterval> | null = null;
        unlisten = listen<StartTimerEventPayload>("start-timer", (event) => {
            console.debug("Timer-Start called");
            if (timerId) clearInterval(timerId);
            setTimer(event.payload.duration);
            timerId = setInterval(() => {
                console.debug("Interval called");
                setTimer((currentTimer) => currentTimer - 1);
            }, 5000);
        });

        return () => {
            console.debug("Listening Cleanup");
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
                    <p>Figma MVP Design</p>
                    <div className="rounded-lg bg-muted w-full relative h-3">
                        <div className="rounded-lg bg-red-400 w-1/3 absolute left-[2px] top-[2px] h-2 drop-shadow" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Popup;
