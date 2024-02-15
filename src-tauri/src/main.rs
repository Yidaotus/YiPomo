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
type TaskList = Vec<TaskItem>;

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
    start: u128,
    #[serde(rename = "sessionType")]
    session_type: SessionType,
}

struct PopupState {
    popup: Mutex<Option<tauri::Window>>,
}

type TauriAppState = Mutex<AppState>;

struct AppState {
    tasks: TaskList,
    active_task: Option<TaskItem>,
    session_history: Vec<SessionState>,
    active_session: SessionState,
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

    fn toggle_pause(&mut self) {
        let new_session_type;
        if self.active_session.session_type == SessionType::Pause {
            new_session_type = self.session_history.iter().last().unwrap().session_type;
        } else {
            new_session_type = SessionType::Pause;
        }

        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis();
        let new_session = SessionState {
            session_type: new_session_type,
            start: now,
        };
        self.session_history.push(self.active_session);
        self.active_session = new_session;
    }

    fn peek_next(&self) -> SessionType {
        let mut pomodoros_left = self
            .tasks
            .iter()
            .filter(|t| t.lock().unwrap().done == false)
            .map(|t| {
                let unlocked_task = t.lock().unwrap();
                unlocked_task.length - unlocked_task.completed
            })
            .sum();
        if self.active_session.session_type == SessionType::Working {
            pomodoros_left -= 1;
        }

        Self::calculate_next_state(
            pomodoros_left,
            self.active_session.session_type,
            &self.session_history,
        )
    }

    fn advance(&mut self) {
        let mut unfinished_tasks = self
            .tasks
            .iter()
            .filter(|t| t.lock().unwrap().done == false);
        match self.active_session.session_type {
            SessionType::Working => {
                if let Some(t) = self.active_task.as_ref() {
                    let mut task = t.lock().unwrap();

                    task.completed += 1;
                    if task.completed >= task.length {
                        task.done = true;
                    }
                }

                if let Some(next_task) = unfinished_tasks.next() {
                    self.active_task = Some(next_task.clone());
                } else {
                    self.active_task = None;
                }
            }
            SessionType::Start => {
                if let Some(next_task) = unfinished_tasks.next() {
                    self.active_task = Some(next_task.clone());
                } else {
                    self.active_task = None;
                }
            }
            _ => {}
        }

        let pomodoros_left = self
            .tasks
            .iter()
            .filter(|t| t.lock().unwrap().done == false)
            .map(|t| {
                let unlocked_task = t.lock().unwrap();
                unlocked_task.length - unlocked_task.completed
            })
            .sum();

        let next_state = Self::calculate_next_state(
            pomodoros_left,
            self.active_session.session_type,
            &self.session_history,
        );

        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_millis();
        self.session_history.push(self.active_session);
        self.active_session = SessionState {
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
    active_session: SessionState,
    #[serde(rename = "upcommingSession")]
    session_history: Vec<SessionState>,
}

#[tauri::command]
fn advance_state(tauri_app_state: State<TauriAppState>, handle: AppHandle) {
    let mut state = tauri_app_state.lock().unwrap();
    let previous_state = state.active_session.session_type;
    state.advance();
    let cloned = state
        .tasks
        .iter()
        .map(|f| f.lock().unwrap().clone())
        .collect();
    handle
        .emit_all("synch_state", StateSynchEvent::Tasks(cloned))
        .unwrap();

    let synch_active_state;
    if let Some(task) = state.active_task.as_ref() {
        synch_active_state = Some(task.lock().unwrap().id.clone());
    } else {
        synch_active_state = None;
    }
    eprintln!(
        "Previous: {:?}, Current: {:?}, Upcomming: {:?}",
        previous_state,
        state.active_session.session_type,
        state.peek_next()
    );
    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::ActiveTask(synch_active_state),
        )
        .unwrap();

    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::ActiveSession(state.active_session),
        )
        .unwrap();

    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::SessionHistory(state.session_history.clone()),
        )
        .unwrap();

}

#[tauri::command]
fn get_state(tauri_app_state: State<TauriAppState>) -> AppStateFrontend {
    let state = tauri_app_state.lock().unwrap();
    let tasks_fr: Vec<Task> = state
        .tasks
        .iter()
        .map(|f| f.lock().unwrap().clone())
        .collect();

    let active_task_fr = match state.active_task.as_ref() {
        Some(task) => Some(task.lock().unwrap().clone()),
        None => None,
    };

    let active_session = state.active_session;

    AppStateFrontend {
        tasks: tasks_fr,
        active_task: active_task_fr,
        active_session,
        session_history: state.session_history.clone(),
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
enum StateSynchEvent {
    #[serde(rename = "tasks")]
    Tasks(Vec<Task>),
    #[serde(rename = "activeTask")]
    ActiveTask(Option<String>),
    #[serde(rename = "activeSession")]
    ActiveSession(SessionState),
    #[serde(rename = "sessionHistory")]
    SessionHistory(Vec<SessionState>),
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
    tauri_app_state: State<'_, TauriAppState>,
    handle: tauri::AppHandle,
) -> Result<(), ()> {
    let mut state = tauri_app_state.lock().unwrap();
    match value {
        StateMutateEvent::AddTask(new_task) => {
            state.tasks.push(Arc::new(Mutex::new(new_task.into())));
        }
        StateMutateEvent::SwapTasks((i, y)) => {
            let id1 = state
                .tasks
                .iter()
                .position(|t| t.lock().unwrap().id == i)
                .unwrap();
            let id2 = state
                .tasks
                .iter()
                .position(|t| t.lock().unwrap().id == y)
                .unwrap();
            state.tasks.swap(id1, id2);
        }
        StateMutateEvent::RemoveTask(task_id) => {
            state.tasks = state
                .tasks
                .iter()
                .filter(|task| task.lock().unwrap().id != task_id)
                .cloned()
                .collect();
        }
        StateMutateEvent::CheckTask(TaskCheckStatePayload { task_id, checked }) => {
            {
                let target_task = state
                    .tasks
                    .iter()
                    .find(|t| t.lock().unwrap().id == task_id)
                    .unwrap();

                let mut tar = target_task.lock().unwrap();
                tar.done = checked;
                if checked {
                    tar.completed = tar.length;
                } else {
                    tar.completed = 0;
                }
            }

            if !checked {
                let task_index = state
                    .tasks
                    .iter()
                    .position(|t| t.lock().unwrap().id == task_id);
                if let Some(index) = task_index {
                    let len = state.tasks.len() - 1;
                    state.tasks.swap(index, len);
                }
            }
        }
    }
    let cloned = state
        .tasks
        .iter()
        .map(|f| f.lock().unwrap().clone())
        .collect();
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

#[tauri::command]
fn toggle_pause(handle: tauri::AppHandle, tauri_app_state: State<TauriAppState>) -> Result<(), ()> {
    let mut state = tauri_app_state.lock().unwrap();
    let previous_state = state.active_session.session_type;
    state.toggle_pause();

    let synch_active_state;
    if let Some(task) = state.active_task.as_ref() {
        synch_active_state = Some(task.lock().unwrap().id.clone());
    } else {
        synch_active_state = None;
    }
    eprintln!(
        "Previous: {:?}, Current: {:?}, Upcomming: {:?}",
        previous_state,
        state.active_session.session_type,
        state.peek_next()
    );
    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::ActiveTask(synch_active_state),
        )
        .unwrap();

    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::SessionHistory(state.session_history.clone()),
        )
        .unwrap();

    handle
        .emit_all(
            "synch_state",
            StateSynchEvent::ActiveSession(state.active_session),
        )
        .unwrap();
    Ok(())
}

fn main() {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let app_state = AppState {
        tasks: Vec::new(),
        active_task: None,
        session_history: vec![SessionState {
            session_type: SessionType::Start,
            start: now,
        }],
        active_session: SessionState {
            session_type: SessionType::Start,
            start: now,
        },
    };
    let popup_state = PopupState {
        popup: Mutex::new(None),
    };
    tauri::Builder::default()
        .manage(Mutex::new(app_state))
        .manage(popup_state)
        .invoke_handler(tauri::generate_handler![
            toggle_popup,
            get_state,
            toggle_pause,
            mutate_state,
            advance_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
