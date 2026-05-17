mod asr;
mod audio;
mod commands;
mod events;
mod export;
mod models;
mod project;
mod state;
mod translate;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::create_project,
            commands::read_project,
            commands::save_project,
            commands::download_model,
            commands::delete_model,
            commands::list_models,
            commands::transcribe_project,
            commands::cancel_transcribe,
            commands::translate_cues,
            commands::export_subtitles,
            commands::set_provider_key,
            commands::clear_provider_key,
            commands::has_provider_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
