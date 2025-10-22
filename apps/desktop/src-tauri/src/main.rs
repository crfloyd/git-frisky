#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod domain;
mod api;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(api::watch::WatcherState::new())
    .invoke_handler(tauri::generate_handler![
      api::repo::open_repo,
      api::repo::status,
      api::repo::get_diff,
      api::repo::stage,
      api::repo::unstage,
      api::repo::commit,
      api::repo::stage_hunk,
      api::repo::unstage_hunk,
      api::watch::start_watch,
      api::watch::stop_watch,
    ])
    .run(tauri::generate_context!())
    .expect("error while running GitFrisky");
}
