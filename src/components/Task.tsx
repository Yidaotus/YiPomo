import { Task } from "@/lib/app-state";
import type { Identifier, XYCoord } from "dnd-core";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Checkbox } from "./ui/checkbox";
import { GripIcon, TrashIcon } from "lucide-react";

export const ItemTypes = {
  TASK: "task",
};

type TaskProps = {
  task: Task;
  index: number;
  checkTask: ({
    taskId,
    checked,
  }: {
    taskId: string;
    checked: boolean;
  }) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (ids: [string, string]) => void;
};

type DragItem = {
  index: number;
  id: string;
  type: string;
  hoverId: string;
};

const TaskView = ({
  task,
  deleteTask,
  moveTask,
  checkTask,
  index,
}: TaskProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.TASK,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!dragRef.current || !previewRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = previewRef.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveTask([item.id, task.id]);
      // moveTask(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.hoverId = task.id;
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.TASK,
    item: () => {
      return { id: task.id, index, hoverId: "" };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(dragRef);
  drop(preview(previewRef));

  return (
    <div
      className="flex gap-4 items-center w-full relative border px-4 py-2 border-muted rounded-xl shadow"
      ref={previewRef}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <Checkbox
        className={`${task.done && "opacity-50"}`}
        id="terms2"
        checked={task.done}
        onCheckedChange={(e) =>
          checkTask({ taskId: task.id, checked: Boolean(e) })
        }
      />
      <div className="flex gap-2 justify-between">
        <div className="flex flex-col">
          <div
            className={`font-medium ${
              task.done && "line-through text-muted"
            } text-secondary-foreground`}
          >
            {task.name}
          </div>
          <div className="text-sm text-muted-foreground">Duration: 0/2</div>
        </div>
      </div>
      <div className="ml-auto flex gap-2">
        <button
          className="cursor-pointer group"
          onClick={() => {
            deleteTask(task.id);
          }}
        >
          <TrashIcon className="h-4 w-4 text-muted-foreground group-hover:text-destructive select-none pointer-events-none" />
        </button>
        <div ref={dragRef} className="cursor-grab">
          <GripIcon className="h-4 w-4 text-muted-foreground select-none pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default TaskView;
