use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            println!("AI Companion starting...");

            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            // Set window title
            window.set_title("AI 伙伴 - AI Companion").unwrap();

            println!("AI Companion initialized successfully!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
