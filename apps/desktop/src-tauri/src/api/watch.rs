use notify::{Watcher, RecursiveMode, Event, EventKind};
use notify_debouncer_full::{new_debouncer, DebounceEventResult};
use std::path::{Path, PathBuf};
use std::time::Duration;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum WatchEventKind {
    Status,   // Working tree changes
    Head,     // HEAD changed (checkout)
    Refs,     // Refs changed (branch/tag changes)
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct WatchEvent {
    pub kind: WatchEventKind,
}

// Global state to track active watchers
type WatcherHandle = Arc<Mutex<Option<notify_debouncer_full::Debouncer<notify::RecommendedWatcher, notify_debouncer_full::FileIdMap>>>>;

pub struct WatcherState {
    pub watcher: WatcherHandle,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            watcher: Arc::new(Mutex::new(None)),
        }
    }
}

#[tauri::command]
pub fn start_watch(app_handle: AppHandle, repo_path: String, state: tauri::State<WatcherState>) -> Result<(), String> {
    let path = PathBuf::from(&repo_path);

    if !path.exists() {
        return Err("Repository path does not exist".to_string());
    }

    // Stop any existing watcher
    stop_watch(state.clone())?;

    let app_handle_clone = app_handle.clone();
    let repo_path_clone = repo_path.clone();

    // Create debounced watcher with 300ms debounce
    let mut debouncer = new_debouncer(
        Duration::from_millis(300),
        None,
        move |result: DebounceEventResult| {
            match result {
                Ok(events) => {
                    for event in events {
                        if let Some(kind) = classify_event(&event.event, &repo_path_clone) {
                            let watch_event = WatchEvent { kind };
                            let _ = app_handle_clone.emit("repo-changed", watch_event);
                        }
                    }
                }
                Err(errors) => {
                    eprintln!("Watch errors: {:?}", errors);
                }
            }
        },
    ).map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Watch the entire repository directory
    debouncer
        .watcher()
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch repository: {}", e))?;

    // Watch .git directory specifically
    let git_dir = path.join(".git");
    if git_dir.exists() {
        debouncer
            .watcher()
            .watch(&git_dir, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch .git directory: {}", e))?;
    }

    // Store the watcher so it stays alive
    *state.watcher.lock().unwrap() = Some(debouncer);

    Ok(())
}

#[tauri::command]
pub fn stop_watch(state: tauri::State<WatcherState>) -> Result<(), String> {
    let mut watcher = state.watcher.lock().unwrap();
    *watcher = None; // Dropping the watcher stops watching
    Ok(())
}

// Classify file system events into watch event types
fn classify_event(event: &Event, repo_path: &str) -> Option<WatchEventKind> {
    let repo_path = Path::new(repo_path);

    for path in &event.paths {
        let relative_path = path.strip_prefix(repo_path).ok()?;
        let path_str = relative_path.to_str()?;

        // Check for .git/HEAD changes (branch checkout)
        if path_str == ".git/HEAD" || path_str.contains(".git/HEAD") {
            return Some(WatchEventKind::Head);
        }

        // Check for .git/refs/ changes (branch/tag changes)
        if path_str.starts_with(".git/refs/") {
            return Some(WatchEventKind::Refs);
        }

        // Check for .git/index changes (staging)
        if path_str == ".git/index" || path_str.contains(".git/index") {
            return Some(WatchEventKind::Status);
        }

        // Working tree file changes (but ignore .git/objects/)
        if !path_str.starts_with(".git/objects/") &&
           !path_str.starts_with(".git/logs/") &&
           matches!(event.kind, EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)) {
            return Some(WatchEventKind::Status);
        }
    }

    None
}
