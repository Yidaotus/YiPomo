import { GripIcon } from "lucide-react";
import { useInitializeAppState } from "../lib/app-state";
import SessionState from "@/components/SessionState";

const Popup = () => {
  useInitializeAppState();

  return (
    <div
      className="hover:opacity-100 opacity-100 bg-background flex items-center justify-center  rounded-xl relative transition-opacity group/container border border-muted"
      style={{ transitionDuration: "500ms" }}
    >
      <div
        className="opacity-0 group-hover/container:opacity-100 absolute right-2 top-2 w-4 h-4 select-none z-50 rounded cursor-move transition-opacity"
        data-tauri-drag-region
      >
        <GripIcon className="h-4 w-4 text-muted-foreground select-none pointer-events-none" />
      </div>
      <div className="py-2 flex flex-col gap-2 justify-center items-center w-full">
        <SessionState />
      </div>
    </div>
  );
};

export default Popup;
