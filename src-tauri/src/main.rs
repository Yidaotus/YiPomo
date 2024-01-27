// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use serde::Serialize;
use std::{
    str::FromStr,
    sync::{Arc, Mutex},
};
use tauri::{Manager, State};

#[derive(Clone, serde::Serialize)]
struct StartTimerEventPayload {
    duration: i32,
}

#[derive(Clone, serde::Serialize)]
struct SetActiveTaskPayload {
    task: String,
}

enum WorkPeriod {
    Work,
    SmallBreak,
    BigBreak,
}

#[derive(Clone, Serialize)]
struct Task {
    name: String,
    done: bool,
}

struct TaskList {
    tasks: Mutex<Vec<Arc<Task>>>,
}

struct TaskLog {
    period: i32,
    task: Arc<Task>,
}

struct AppState {
    task_list: TaskList,
    period_history: Mutex<Vec<TaskLog>>,
    active_task: Mutex<Option<Arc<Task>>>,
    current_period: Mutex<WorkPeriod>,
    popup: Mutex<Option<tauri::Window>>,
}

#[tauri::command]
fn start_timer(handle: tauri::AppHandle, duration: i32, state: State<AppState>) {
    let tasklist = state.task_list.tasks.lock().unwrap();
    let mut period = state.current_period.lock().unwrap();
    *period = WorkPeriod::Work;
    handle.emit_all("start-timer", StartTimerEventPayload { duration: 25 });

    if let Some(tasklist_first_task) = tasklist.first() {
        let mut at = state.active_task.lock().unwrap();
        *at = Some(Arc::clone(tasklist_first_task));
        handle.emit_all(
            "set-active-task",
            SetActiveTaskPayload {
                task: tasklist_first_task.name.clone(),
            },
        );
    }
}

#[tauri::command]
async fn close_popup(state: State<'_, AppState>) -> Result<(), ()> {
    let mut popup_m = state.popup.lock().unwrap();
    if let Some(popup) = popup_m.as_ref() {
        let _ = popup.close();
    }
    *popup_m = None;
    Ok(())
}

#[tauri::command]
async fn open_popup(handle: tauri::AppHandle, state: State<'_, AppState>) -> Result<(), ()> {
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
    let mut tasklist = state.task_list.tasks.lock().unwrap();
    tasklist.push(Arc::new(Task {
        name: String::from_str(name).unwrap(),
        done: false,
    }));

    let cloned = tasklist.iter().map(|f| f.as_ref().clone()).collect();
    return cloned;
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let app_state = AppState {
        task_list: TaskList {
            tasks: Mutex::new(Vec::new()),
        },
        active_task: Mutex::new(None),
        period_history: Mutex::new(Vec::new()),
        current_period: Mutex::new(WorkPeriod::Work),
        popup: Mutex::new(None),
    };
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            open_popup,
            start_timer,
            add_task,
            close_popup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
