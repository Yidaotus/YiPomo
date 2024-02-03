// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};

#[derive(Clone, Serialize)]
struct StartTimerEventPayload {
    duration: i32,
}

#[derive(Clone, Serialize)]
struct SetActiveTaskPayload {
    task: String,
}

#[derive(Copy, Clone, Serialize, Deserialize, Debug)]
enum WorkPeriod {
    Work,
    SmallBreak,
    BigBreak,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct Task {
    id: String,
    pomodoros: u32,
    name: String,
    done: bool,
}

type TaskItem = Arc<Mutex<Task>>;
type TaskList = Mutex<Vec<TaskItem>>;

struct PopupState {
    popup: Mutex<Option<tauri::Window>>,
}

struct AppState {
    tasks: TaskList,
    active_task: Mutex<Option<TaskItem>>,
    current_period: Mutex<WorkPeriod>,
}

#[derive(Serialize)]
struct AppStateFrontend {
    tasks: Vec<Task>,
    #[serde(rename = "activeTask")]
    active_task: Option<Task>,
    #[serde(rename = "currentPeriod")]
    current_period: WorkPeriod,
}

#[tauri::command]
fn get_state(state: State<AppState>) -> AppStateFrontend {
    let tasklist = state.tasks.lock().unwrap();
    let tasks_fr: Vec<Task> = tasklist
        .iter()
        .map(|f| f.as_ref().lock().unwrap().clone())
        .collect();

    let active_task = state.active_task.lock().unwrap();
    let active_task_fr = match active_task.as_ref() {
        Some(task) => Some(task.lock().unwrap().clone()),
        None => None,
    };

    AppStateFrontend {
        tasks: tasks_fr,
        active_task: active_task_fr,
        current_period: *state.current_period.lock().unwrap(),
    }
}

#[tauri::command]
fn start_timer(handle: tauri::AppHandle, duration: i32, state: State<AppState>) {
    let tasklist = state.tasks.lock().unwrap();
    let mut period = state.current_period.lock().unwrap();
    *period = WorkPeriod::Work;
    handle
        .emit_all("start-timer", StartTimerEventPayload { duration: 25 })
        .unwrap();

    if let Some(tasklist_first_task) = tasklist.first() {
        let mut at = state.active_task.lock().unwrap();
        *at = Some(Arc::clone(tasklist_first_task));
        handle
            .emit_all(
                "set-active-task",
                SetActiveTaskPayload {
                    task: tasklist_first_task.lock().unwrap().name.clone(),
                },
            )
            .unwrap();
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
enum StateSynchEvent {
    #[serde(rename = "tasks")]
    Tasks(Vec<Task>),
    #[serde(rename = "task")]
    Task(Task),
    #[serde(rename = "workPeriod")]
    WorkPeriod(WorkPeriod),
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct AddTaskPayload {
    pomodoros: u32,
    name: String,
    done: bool,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct TaskCheckStatePayload {
    #[serde(rename = "taskId")]
    task_id: String,
    checked: bool,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
enum StateMutateEvent {
    AddTask(AddTaskPayload),
    RemoveTask(String),
    SwapTasks((String, String)),
    CheckTask(TaskCheckStatePayload),
}

impl Into<Task> for AddTaskPayload {
    fn into(self) -> Task {
        let nid = nanoid!();
        Task {
            id: nid,
            name: self.name,
            done: self.done,
            pomodoros: self.pomodoros,
        }
    }
}

#[tauri::command]
fn mutate_state(
    value: StateMutateEvent,
    state: State<'_, AppState>,
    handle: tauri::AppHandle,
) -> Result<(), ()> {
    eprint!("Got Command! {value:?}");
    match value {
        StateMutateEvent::AddTask(new_task) => {
            let mut tasks = state.tasks.lock().unwrap();
            tasks.push(Arc::new(Mutex::new(new_task.into())));
        }
        StateMutateEvent::SwapTasks((i, y)) => {
            let mut tasks = state.tasks.lock().unwrap();
            let id1 = tasks
                .iter()
                .position(|t| t.lock().unwrap().id == i)
                .unwrap();
            let id2 = tasks
                .iter()
                .position(|t| t.lock().unwrap().id == y)
                .unwrap();
            tasks.swap(id1, id2);
        }
        StateMutateEvent::RemoveTask(task_id) => {
            let mut tasks = state.tasks.lock().unwrap();
            *tasks = tasks
                .iter()
                .filter(|task| task.lock().unwrap().id != task_id)
                .cloned()
                .collect();
        }
        StateMutateEvent::CheckTask(TaskCheckStatePayload { task_id, checked }) => {
            let tasks = state.tasks.lock().unwrap();
            let target_task = tasks
                .iter()
                .find(|t| t.lock().unwrap().id == task_id)
                .unwrap();
            target_task.lock().unwrap().done = checked;
        }
    }
    let tasks = state.tasks.lock().unwrap();
    let cloned = tasks.iter().map(|f| f.lock().unwrap().clone()).collect();
    handle
        .emit_all("synch_state", StateSynchEvent::Tasks(cloned))
        .unwrap();

    Ok(())
}

#[tauri::command]
async fn close_popup(state: State<'_, PopupState>) -> Result<(), ()> {
    let mut popup_m = state.popup.lock().unwrap();
    if let Some(popup) = popup_m.as_ref() {
        let _ = popup.close();
    }
    *popup_m = None;
    Ok(())
}

#[tauri::command]
async fn open_popup(handle: tauri::AppHandle, state: State<'_, PopupState>) -> Result<(), ()> {
    let mut popup_m = state.popup.lock().unwrap();
    if let Some(popup) = popup_m.as_ref() {
        popup.show().unwrap();
    } else {
        let docs_window = tauri::WindowBuilder::new(
            &handle,
            "popup", /* the unique window label */
            tauri::WindowUrl::App("popup.html".into()),
        )
        .inner_size(300.0, 125.0)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .transparent(true)
        .build()
        .unwrap();

        *popup_m = Some(docs_window);
    }
    Ok(())
}

fn main() {
    let app_state = AppState {
        tasks: Mutex::new(Vec::new()),
        active_task: Mutex::new(None),
        current_period: Mutex::new(WorkPeriod::Work),
    };
    let popup_state = PopupState {
        popup: Mutex::new(None),
    };
    tauri::Builder::default()
        .manage(app_state)
        .manage(popup_state)
        .invoke_handler(tauri::generate_handler![
            open_popup,
            start_timer,
            get_state,
            mutate_state,
            close_popup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
