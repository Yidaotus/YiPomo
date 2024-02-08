// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

#[derive(Clone, Serialize)]
struct StartTimerEventPayload {
    duration: i32,
}

#[derive(Clone, Serialize)]
struct SetActiveTaskPayload {
    task: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct Task {
    id: String,
    length: u32,
    completed: u32,
    name: String,
    done: bool,
}

type TaskItem = Arc<Mutex<Task>>;
type TaskList = Mutex<Vec<TaskItem>>;

#[derive(Copy, Clone, Serialize, Deserialize, Debug, PartialEq)]
enum SessionState {
    Idle,
    Working,
    SmallBreak,
    BigBreak,
    Finish,
}

struct PopupState {
    popup: Mutex<Option<tauri::Window>>,
}

struct AppState {
    tasks: TaskList,
    active_task: Mutex<Option<TaskItem>>,
    session_state: Mutex<SessionState>,
    pause_iterations: Mutex<u32>,
}

impl AppState {
    fn advance(&self) -> SessionState {
        let tasks = self.tasks.lock().unwrap();
        let mut active_task = self.active_task.lock().unwrap();
        let mut session_state = self.session_state.lock().unwrap();
        let mut pause_iterations = self.pause_iterations.lock().unwrap();

        let mut new_state = *session_state;
        match *session_state {
            SessionState::Working => {
                if let Some(t) = active_task.as_ref() {
                    let mut task = t.lock().unwrap();

                    task.completed += 1;
                    if task.completed >= task.length {
                        task.done = true;
                    }
                }

                let mut tasks_left = tasks.iter().filter(|t| t.lock().unwrap().done == false);
                if let Some(next_task) = tasks_left.next() {
                    *active_task = Some(next_task.clone());
                    if *pause_iterations % 4 != 0 {
                        new_state = SessionState::SmallBreak;
                    } else {
                        new_state = SessionState::BigBreak;
                    }
                } else {
                    *active_task = None;
                    new_state = SessionState::Finish;
                }
            }
            SessionState::Idle => {
                *pause_iterations = 1;
                let mut tasks_left = tasks.iter().filter(|t| t.lock().unwrap().done == false);
                if let Some(next_task) = tasks_left.next() {
                    *active_task = Some(next_task.clone());
                    new_state = SessionState::Working;
                }
            }
            SessionState::Finish => {
                new_state = SessionState::Idle;
            }
            _ => {
                *pause_iterations += 1;
                new_state = SessionState::Working;
            }
        }

        *session_state = new_state;
        new_state
    }
}

#[derive(Serialize)]
struct AppStateFrontend {
    tasks: Vec<Task>,
    #[serde(rename = "activeTask")]
    active_task: Option<Task>,
    #[serde(rename = "sessionState")]
    session_state: SessionState,
}

#[tauri::command]
fn advance_state(state: State<AppState>, handle: AppHandle) {
    state.advance();
    let tasks = state.tasks.lock().unwrap();
    let cloned = tasks.iter().map(|f| f.lock().unwrap().clone()).collect();
    handle
        .emit_all("synch_state", StateSynchEvent::Tasks(cloned))
        .unwrap();

    let active_task = state.active_task.lock().unwrap();
    if let Some(task) = active_task.as_ref() {
        handle
            .emit_all(
                "synch_state",
                StateSynchEvent::ActiveTask(Some(task.lock().unwrap().id.clone())),
            )
            .unwrap();
    } else {
        handle
            .emit_all("synch_state", StateSynchEvent::ActiveTask(None))
            .unwrap();
    }

    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::SessionState(state.session_state.lock().unwrap().clone()),
        )
        .unwrap();
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
        session_state: *state.session_state.lock().unwrap(),
    }
}

#[tauri::command]
fn start_timer(handle: tauri::AppHandle, duration: i32, state: State<AppState>) {
    let tasklist = state.tasks.lock().unwrap();
    let mut period = state.session_state.lock().unwrap();
    *period = SessionState::Working;
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
    #[serde(rename = "activeTask")]
    ActiveTask(Option<String>),
    #[serde(rename = "sessionState")]
    SessionState(SessionState),
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct AddTaskPayload {
    length: u32,
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
            completed: 0,
            done: self.done,
            length: self.length,
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
            let target_task_id;
            let mut tasks = state.tasks.lock().unwrap();
            {
                let mut target_task = tasks
                    .iter()
                    .find(|t| t.lock().unwrap().id == task_id)
                    .unwrap()
                    .lock()
                    .unwrap();
                target_task.done = checked;
                if checked {
                    target_task.completed = target_task.length;
                } else {
                    target_task.completed = 0;
                }
                target_task_id = target_task.id.clone();
            }

            if !checked {
                let task_index = tasks
                    .iter()
                    .position(|t| t.lock().unwrap().id == target_task_id);
                if let Some(index) = task_index {
                    let len = tasks.len() - 1;
                    tasks.swap(index, len);
                }
            }
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
        session_state: Mutex::new(SessionState::Idle),
        pause_iterations: Mutex::new(0),
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
            close_popup,
            advance_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
