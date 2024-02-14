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

type SessionType =
  | "Idle"
  | "Working"
  | "SmallBreak"
  | "BigBreak"
  | "Finish"
  | "Start";

type AddTaskPayload = Omit<Task, "id" | "completed">;
type AppState = {
  tasks: Array<Task>;
  activeTask: string | null;
  activeSession: SessionType;
  upcommingSession: SessionType;
  isPaused: boolean;
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

const useAppState = create<AppState>((set) => ({
  tasks: [],
  activeTask: null,
  activeSession: "Start",
  upcommingSession: "Working",
  isPaused: false,
  pause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
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

export {
  subscribeAppState,
  useAppState,
  useInitializeAppState,
  useSynchAppState,
};
