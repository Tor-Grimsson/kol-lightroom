use std::fs;
use std::path::Path;

/// Read a file's bytes and return them as a raw IPC response (efficient binary,
/// not a JSON number array). The frontend hands the path from a native open
/// dialog; this is how the desktop app opens raws from anywhere on disk.
#[tauri::command]
fn read_file_bytes(path: String) -> Result<tauri::ipc::Response, String> {
    fs::read(&path)
        .map(tauri::ipc::Response::new)
        .map_err(|e| format!("read {path}: {e}"))
}

const RAW_EXTS: &[&str] = &[
    "nef", "dng", "cr2", "cr3", "arw", "raf", "rw2", "orf", "tif", "tiff",
];

/// List raw files in a folder (non-recursive), for batch processing.
#[tauri::command]
fn list_raws(dir: String) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    for entry in fs::read_dir(&dir).map_err(|e| format!("read_dir {dir}: {e}"))? {
        let p = entry.map_err(|e| e.to_string())?.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                if RAW_EXTS.contains(&ext.to_ascii_lowercase().as_str()) {
                    out.push(p.to_string_lossy().into_owned());
                }
            }
        }
    }
    out.sort();
    Ok(out)
}

/// Write bytes to a path (for native export / batch output).
#[tauri::command]
fn write_file_bytes(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, bytes).map_err(|e| format!("write {path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_file_bytes,
            list_raws,
            write_file_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
