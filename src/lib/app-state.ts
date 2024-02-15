import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { create } from "zustand";

export type Task = {
  id: string;
  length: number;
  completed: number;
  name: string;
  done: boolean;
};
type AddTaskPayload = Omit<Task, "id" | "completed">;

export type SessionType =
  | "Start"
  | "Idle"
  | "Pause"
  | "Working"
  | "SmallBreak"
  | "BigBreak"
  | "Finish";

export type SessionState = {
  sessionType: SessionType;
  start: number;
};
type AppState = {
  tasks: Array<Task>;
  activeTask: string | null;
  sessionHistory: Array<SessionState>;
  activeSession: SessionState;
  pause: () => void;
  addTask: (taskPayload: AddTaskPayload) => void;
  removeTask: (taskId: string) => void;
  moveTask: (ids: [string, string]) => void;
  checkTask: ({
    taskId,
    checked,
  }: {
    taskId: string;
    checked: boolean;
  }) => void;
};

type MoveTaskMutation = {
  name: "SwapTasks";
  value: [string, string];
};

type AddTaskMutation = {
  name: "AddTask";
  value: AddTaskPayload;
};

type RemoveTaskMutation = {
  name: "RemoveTask";
  value: string;
};

type CheckTaskMutation = {
  name: "CheckTask";
  value: { taskId: string; checked: boolean };
};

type MutationEvent =
  | AddTaskMutation
  | RemoveTaskMutation
  | MoveTaskMutation
  | CheckTaskMutation;

const StateEvent = {
  advanceState: "advance_state",
  mutate: "mutate_state",
  synch: "synch_state",
  getState: "get_state",
  togglePause: "toggle_pause",
} as const;

type SynchEventPayload = {
  [key: string]: {
    value: AppState[keyof AppState];
  };
};

const emitMutation = (mutation: MutationEvent) => {
  invoke(StateEvent.mutate, {
    value: { [mutation.name]: mutation.value },
  });
};

const useAppState = create<AppState>(() => ({
  tasks: [],
  activeTask: null,
  activeSession: { sessionType: "Start", start: Date.now() },
  sessionHistory: [],
  pause: () => {
    invoke(StateEvent.togglePause);
  },
  moveTask: (ids) => {
    emitMutation({ name: "SwapTasks", value: ids });
  },
  addTask: (taskPayload) => {
    emitMutation({ name: "AddTask", value: taskPayload });
  },
  removeTask: (taskId) => {
    emitMutation({ name: "RemoveTask", value: taskId });
  },
  checkTask: (checkedState) => {
    emitMutation({ name: "CheckTask", value: checkedState });
  },
  advance: () => {
    invoke(StateEvent.advanceState);
  },
}));

const useSynchAppState = () => {
  const [isSynching, setIsSynching] = useState(false);

  useEffect(() => {
    const synchInitialState = async () => {
      const currentState = await invoke<AppState>(StateEvent.getState);
      useAppState.setState(currentState);
      setIsSynching(false);
    };

    setIsSynching(true);
    synchInitialState();
  }, []);

  return { isSynching };
};

const subscribeAppState = async () => {
  const unsubscribeAppState = await listen<SynchEventPayload>(
    StateEvent.synch,
    (event) => {
      for (const [key, value] of Object.entries(event.payload)) {
        useAppState.setState({
          [key]: value,
        });
      }
    },
  );

  return () => {
    unsubscribeAppState();
  };
};

const useSubscribeAppState = () => {
  useEffect(() => {
    const unsub = subscribeAppState();
    return () => {
      unsub.then((us) => us());
    };
  }, []);
};

const useInitializeAppState = () => {
  const { isSynching } = useSynchAppState();
  useSubscribeAppState();

  return { isSynching };
};

const getUpcommingDisplayState = (
  active: SessionType,
  history: Array<SessionState>,
): SessionType => {
  const previousState = history[history.length - 1]?.sessionType || "Start";

  let previousSmallPauses = 0;
  for (const state of history.slice().reverse()) {
    if (state.sessionType === "BigBreak") {
      break;
    }
    if (state.sessionType === "SmallBreak") {
      previousSmallPauses += 1;
    }
  }

  switch (active) {
    case "Working": {
      if (previousSmallPauses >= 3) {
        return "BigBreak";
      }
      return "SmallBreak";
    }
    case "Pause": {
      return previousState;
    }
    case "Idle": {
      if (previousState !== "Idle") {
        return getUpcommingDisplayState(previousState, history);
      } else {
        return previousState;
      }
    }
    default: {
      return "Working";
    }
  }
};

export {
  getUpcommingDisplayState,
  subscribeAppState,
  useAppState,
  useInitializeAppState,
  useSynchAppState,
};
