//! Typed app events (Tauri `Emitter`).

use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelProgressPayload {
    pub kind: String,
    pub id: String,
    pub bytes_received: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_bytes: Option<u64>,
    pub phase: String,
}

pub fn emit_model_progress(app: &AppHandle, payload: ModelProgressPayload) {
    let _ = app.emit("voxia:model-progress", &payload);
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeProgressPayload {
    pub task_id: String,
    pub percent: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_text: Option<String>,
}

pub fn emit_transcribe_progress(app: &AppHandle, payload: TranscribeProgressPayload) {
    let _ = app.emit("voxia:transcribe-progress", &payload);
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateProgressPayload {
    pub done: usize,
    pub total: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_text: Option<String>,
}

pub fn emit_translate_progress(app: &AppHandle, payload: TranslateProgressPayload) {
    let _ = app.emit("voxia:translate-progress", &payload);
}
