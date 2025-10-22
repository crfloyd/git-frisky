#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod domain;
mod api;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
      api::repo::open_repo,
    ])
    .run(tauri::generate_context!())
    .expect("error while running GitFrisky");
}
