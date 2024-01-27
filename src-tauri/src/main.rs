// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::time::Duration;
use std::{str::FromStr, sync::Mutex};

use serde::Serialize;
use tauri::async_runtime::spawn;
use tauri::{LogicalSize, Manager, PhysicalSize, State};

#[derive(Clone, serde::Serialize)]
struct StartTimerEventPayload {
    duration: i32,
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
    tasks: Mutex<Vec<Task>>,
}

struct AppState {
    task_list: TaskList,
    period: WorkPeriod,
    popup: Mutex<Option<tauri::Window>>,
}
#[tauri::command]
fn start_timer(handle: tauri::AppHandle, duration: i32) {
    handle.emit_all("start-timer", StartTimerEventPayload { duration: 25 });
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
        popup.show();
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
    tasklist.push(Task {
        name: String::from_str(name).unwrap(),
        done: false,
    });

    return tasklist.clone();
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
        period: WorkPeriod::Work,
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
