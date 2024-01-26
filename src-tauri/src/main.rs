// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{str::FromStr, sync::Mutex};

use serde::Serialize;
use tauri::State;

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

#[tauri::command]
fn add_task(name: &str, state: State<TaskList>) -> Vec<Task> {
    let mut tasklist = state.tasks.lock().unwrap();
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
    tauri::Builder::default()
        .manage(TaskList {
            tasks: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![add_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
