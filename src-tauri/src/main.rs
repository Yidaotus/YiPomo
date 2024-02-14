// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tauri::{AppHandle, Manager, State};

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
enum SessionType {
    Start,
    Idle,
    Pause,
    Working,
    SmallBreak,
    BigBreak,
    Finish,
}

#[derive(Copy, Clone, Serialize, Deserialize, Debug, PartialEq)]
struct SessionState {
    start: u64,
    session_type: SessionType,
}

struct PopupState {
    popup: Mutex<Option<tauri::Window>>,
}

struct AppState {
    tasks: TaskList,
    active_task: Mutex<Option<TaskItem>>,
    session_history: Mutex<Vec<SessionState>>,
    active_session: Mutex<SessionState>,
}

impl AppState {
    fn calculate_next_state(
        pomodoros_left: u32,
        active_session_type: SessionType,
        session_history: &Vec<SessionState>,
    ) -> SessionType {
        let new_active_state;
        match active_session_type {
            SessionType::Working => {
                if pomodoros_left > 0 {
                    new_active_state = SessionType::Idle;
                } else {
                    new_active_state = SessionType::Finish;
                }
            }
            SessionType::Start => {
                if pomodoros_left > 0 {
                    new_active_state = SessionType::Working;
                } else {
                    new_active_state = SessionType::Start;
                }
            }
            SessionType::Idle => {
                if session_history.iter().last().unwrap().session_type == SessionType::Working {
                    let mut small_pauses = 0;
                    for session in session_history.iter().rev() {
                        if session.session_type == SessionType::BigBreak {
                            break;
                        };
                        if session.session_type == SessionType::SmallBreak {
                            small_pauses += 1;
                        }
                    }

                    if small_pauses >= 3 {
                        new_active_state = SessionType::BigBreak;
                    } else {
                        new_active_state = SessionType::SmallBreak;
                    }
                } else {
                    new_active_state = SessionType::Working;
                }
            }
            SessionType::Finish => {
                new_active_state = SessionType::Start;
            }
            SessionType::Pause => {
                new_active_state = session_history.iter().last().unwrap().session_type;
            }
            _ => {
                new_active_state = SessionType::Idle;
            }
        }

        new_active_state
    }

    fn pause(&self) {
        let mut active_session = self.active_session.lock().unwrap();
        let mut session_history = self.session_history.lock().unwrap();

        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let new_session = SessionState {
            session_type: SessionType::Pause,
            start: now,
        };
        *active_session = new_session;
        session_history.push(new_session);
    }

    fn peek_next(&self) -> SessionType {
        let tasks = self.tasks.lock().unwrap();
        let active_session = self.active_session.lock().unwrap();
        let session_history = self.session_history.lock().unwrap();

        let mut pomodoros_left = tasks
            .iter()
            .filter(|t| t.lock().unwrap().done == false)
            .map(|t| {
                let unf_t = t.lock().unwrap();
                unf_t.length - unf_t.completed
            })
            .sum();
        if active_session.session_type == SessionType::Working {
            pomodoros_left -= 1;
        }

        Self::calculate_next_state(
            pomodoros_left,
            active_session.session_type,
            &session_history,
        )
    }

    fn advance(&self) {
        let tasks = self.tasks.lock().unwrap();
        let mut active_task = self.active_task.lock().unwrap();
        let mut active_session = self.active_session.lock().unwrap();
        let mut session_history = self.session_history.lock().unwrap();

        let mut unfinished_tasks = tasks.iter().filter(|t| t.lock().unwrap().done == false);
        match active_session.session_type {
            SessionType::Working => {
                if let Some(t) = active_task.as_ref() {
                    let mut task = t.lock().unwrap();

                    task.completed += 1;
                    if task.completed >= task.length {
                        task.done = true;
                    }
                }

                if let Some(next_task) = unfinished_tasks.next() {
                    *active_task = Some(next_task.clone());
                } else {
                    *active_task = None;
                }
            }
            SessionType::Start => {
                if let Some(next_task) = unfinished_tasks.next() {
                    *active_task = Some(next_task.clone());
                } else {
                    *active_task = None;
                }
            }
            _ => {}
        }

        let pomodoros_left = tasks
            .iter()
            .filter(|t| t.lock().unwrap().done == false)
            .map(|t| {
                let unf_t = t.lock().unwrap();
                unf_t.length - unf_t.completed
            })
            .sum();

        let next_state = Self::calculate_next_state(
            pomodoros_left,
            active_session.session_type,
            &session_history,
        );

        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        session_history.push(*active_session);
        *active_session = SessionState {
            session_type: next_state,
            start: now,
        };
    }
}

#[derive(Serialize)]
struct AppStateFrontend {
    tasks: Vec<Task>,
    #[serde(rename = "activeTask")]
    active_task: Option<Task>,
    #[serde(rename = "activeSession")]
    active_session: SessionType,
    #[serde(rename = "upcommingSession")]
    upcomming_session: SessionType,
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
            StateSynchEvent::SessionState(state.active_session.lock().unwrap().clone()),
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

    let state_lock = state.active_session.lock().unwrap();
    let active_session = state_lock.session_type.clone();

    drop(tasklist);
    drop(state_lock);

    AppStateFrontend {
        tasks: tasks_fr,
        active_task: active_task_fr,
        active_session,
        upcomming_session: state.peek_next(),
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
    eprintln!("Got Command! {value:?}");
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
async fn toggle_popup(handle: tauri::AppHandle, state: State<'_, PopupState>) -> Result<(), ()> {
    let mut popup_m = state.popup.lock().unwrap();
    if let Some(popup) = popup_m.as_ref() {
        let _ = popup.close();
        *popup_m = None;
    } else {
        let docs_window = tauri::WindowBuilder::new(
            &handle,
            "popup", /* the unique window label */
            tauri::WindowUrl::App("popup.html".into()),
        )
        .inner_size(375.0, 165.0)
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
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let app_state = AppState {
        tasks: Mutex::new(Vec::new()),
        active_task: Mutex::new(None),
        session_history: Mutex::new(vec![SessionState {
            session_type: SessionType::Start,
            start: now,
        }]),
        active_session: Mutex::new(SessionState {
            session_type: SessionType::Start,
            start: now,
        }),
    };
    let popup_state = PopupState {
        popup: Mutex::new(None),
    };
    tauri::Builder::default()
        .manage(app_state)
        .manage(popup_state)
        .invoke_handler(tauri::generate_handler![
            toggle_popup,
            get_state,
            mutate_state,
            advance_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
