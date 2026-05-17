//! Project document types and filesystem helpers (Rust side uses `std::fs`).

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cue {
    pub id: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub text: String,
    #[serde(default)]
    pub translated_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VoxiaProject {
    pub id: String,
    pub video_path: String,
    pub created_at: String,
    pub cues: Vec<Cue>,
    #[serde(default)]
    pub language: Option<String>,
    #[serde(default)]
    pub model_id: Option<String>,
    #[serde(default)]
    pub caption_font_size_px: Option<i32>,
    #[serde(default)]
    pub caption_max_width_percent: Option<f64>,
    #[serde(default)]
    pub caption_font_family: Option<String>,
    #[serde(default)]
    pub caption_position_x_percent: Option<f64>,
    #[serde(default)]
    pub caption_position_y_percent: Option<f64>,
    #[serde(default)]
    pub caption_text_color: Option<String>,
    #[serde(default)]
    pub caption_background_color: Option<String>,
    #[serde(default)]
    pub caption_background_opacity: Option<f64>,
    #[serde(default)]
    pub caption_vertical_align: Option<String>,
}

impl VoxiaProject {
    pub fn new_for_video(video_path: &Path) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            video_path: video_path.to_string_lossy().to_string(),
            created_at: Utc::now().to_rfc3339(),
            cues: Vec::new(),
            language: None,
            model_id: None,
            caption_font_size_px: None,
            caption_max_width_percent: None,
            caption_font_family: None,
            caption_position_x_percent: None,
            caption_position_y_percent: None,
            caption_text_color: None,
            caption_background_color: None,
            caption_background_opacity: None,
            caption_vertical_align: None,
        }
    }
}

pub fn project_path_for_video(video_path: &Path) -> PathBuf {
    let parent = video_path
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let stem = video_path
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "untitled".to_string());
    parent.join(format!("{stem}.voxia.json"))
}

pub fn read_project_file(path: &Path) -> anyhow::Result<VoxiaProject> {
    let bytes = std::fs::read(path)?;
    let p: VoxiaProject = serde_json::from_slice(&bytes)?;
    Ok(p)
}

pub fn write_project_file(path: &Path, project: &VoxiaProject) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let data = serde_json::to_vec_pretty(project)?;
    std::fs::write(path, data)?;
    Ok(())
}
