import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { create } from "zustand";

export type Task = {
  id: string;
  pomodoros: number;
  name: string;
  done: boolean;
};

type AddTaskPayload = Omit<Task, "id">;
type AppState = {
  tasks: Array<Task>;
  activeTask: Task | null;
  addTask: (taskPayload: AddTaskPayload) => void;
  removeTask: (taskId: string) => void;
  moveTask: (ids: [string, string]) => void;
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

type MutationEvent = AddTaskMutation | RemoveTaskMutation | MoveTaskMutation;

const StateEvent = {
  mutate: "mutate_state",
  synch: "synch_state",
  getState: "get_state",
} as const;

type SynchEventPayload = {
  [key: string]: {
    value: AppState[keyof AppState];
  };
};

const emit = (mutation: MutationEvent) => {
  console.debug({ mutation });
  invoke(StateEvent.mutate, {
    value: { [mutation.name]: mutation.value },
  });
};

const useAppState = create<AppState>(() => ({
  tasks: [],
  activeTask: null,
  moveTask: (ids: [string, string]) => {
    emit({ name: "SwapTasks", value: ids });
  },
  addTask: (taskPayload: AddTaskPayload) => {
    emit({ name: "AddTask", value: taskPayload });
  },
  removeTask: (taskId: string) => {
    emit({ name: "RemoveTask", value: taskId });
  },
}));

const useSynchAppState = () => {
  const [isSynching, setIsSynching] = useState(false);

  useEffect(() => {
    const synchInitialState = async () => {
      const currentState = await invoke<AppState>(StateEvent.getState);
      console.debug({ currentState });
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
      console.debug({ event });
      for (const [key, value] of Object.entries(event.payload)) {
        useAppState.setState({
          [key]: value,
        });
      }
    },
  );

  return async () => {
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
