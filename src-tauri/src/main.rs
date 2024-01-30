// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::{Deserialize, Serialize};
use std::{
    str::FromStr,
    sync::{Arc, Mutex},
};
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
    task_list: TaskList,
    active_task: Mutex<Option<TaskItem>>,
    current_period: Mutex<WorkPeriod>,
}

#[derive(Serialize)]
struct AppStateFrontend {
    #[serde(rename = "taskList")]
    task_list: Vec<Task>,
    #[serde(rename = "activeTask")]
    active_task: Option<Task>,
    #[serde(rename = "currentPeriod")]
    current_period: WorkPeriod,
}

#[tauri::command]
fn get_state(state: State<AppState>) -> AppStateFrontend {
    let tasklist = state.task_list.lock().unwrap();
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
        task_list: tasks_fr,
        active_task: active_task_fr,
        current_period: *state.current_period.lock().unwrap(),
    }
}

#[tauri::command]
fn start_timer(handle: tauri::AppHandle, duration: i32, state: State<AppState>) {
    let tasklist = state.task_list.lock().unwrap();
    let mut period = state.current_period.lock().unwrap();
    *period = WorkPeriod::Work;
    handle.emit_all("start-timer", StartTimerEventPayload { duration: 25 });

    if let Some(tasklist_first_task) = tasklist.first() {
        let mut at = state.active_task.lock().unwrap();
        *at = Some(Arc::clone(tasklist_first_task));
        handle.emit_all(
            "set-active-task",
            SetActiveTaskPayload {
                task: tasklist_first_task.lock().unwrap().name.clone(),
            },
        );
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[serde(untagged)]
enum StatePayload {
    Tasks(Vec<Task>),
    Task(Task),
    WorkPeriod(WorkPeriod),
}

#[derive(Deserialize, Serialize, Clone)]
struct StateSynchEvent {
    key: String,
    value: StatePayload,
}

#[tauri::command]
fn mutate_state(
    key: String,
    value: StatePayload,
    state: State<'_, AppState>,
    handle: tauri::AppHandle,
) -> Result<(), ()> {
    eprint!("Got Command! {value:?}");
    match key.as_str() {
        "tasks" => {
            if let StatePayload::Tasks(t) = value {
                let mut tasks = state.task_list.lock().unwrap();
                *tasks = t.into_iter().map(|ta| Arc::new(Mutex::new(ta))).collect();

                let cloned = tasks
                    .iter()
                    .map(|f| f.as_ref().lock().unwrap().clone())
                    .collect();

                handle.emit_all(
                    "synch_state",
                    StateSynchEvent {
                        key: String::from("tasks"),
                        value: StatePayload::Tasks(cloned),
                    },
                );
            }
        }
        _ => {}
    }

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

#[tauri::command]
fn add_task(name: &str, state: State<AppState>) -> Vec<Task> {
    let mut tasklist = state.task_list.lock().unwrap();
    tasklist.push(Arc::new(Mutex::new(Task {
        pomodoros: 0,
        name: String::from_str(name).unwrap(),
        done: false,
    })));

    let cloned = tasklist
        .iter()
        .map(|f| f.as_ref().lock().unwrap().clone())
        .collect();
    cloned
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let app_state = AppState {
        task_list: Mutex::new(Vec::new()),
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
            greet,
            open_popup,
            start_timer,
            add_task,
            get_state,
            mutate_state,
            close_popup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
