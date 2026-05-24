use crate::asr;
use crate::audio;
use crate::events::{
    emit_transcribe_progress, emit_translate_progress, TranscribeProgressPayload,
    TranslateProgressPayload,
};
use crate::export::{self, ExportFormat, ExportMode};
use crate::models::{self, ModelKind};
use crate::project::{self, project_path_for_video, VoxiaProject};
use crate::state::AppState;
use crate::translate::{self, Translator};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectResponse {
    pub project_path: String,
    pub project: VoxiaProject,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    pub video_path: String,
}

#[tauri::command]
pub fn create_project(req: CreateProjectRequest) -> Result<CreateProjectResponse, String> {
    let vp = PathBuf::from(&req.video_path);
    if !vp.exists() {
        return Err("video file does not exist".into());
    }
    let project_path = project_path_for_video(&vp);
    let p = VoxiaProject::new_for_video(&vp);
    project::write_project_file(&project_path, &p).map_err(|e| e.to_string())?;
    Ok(CreateProjectResponse {
        project_path: project_path.to_string_lossy().to_string(),
        project: p,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPathArg {
    pub project_path: String,
}

#[tauri::command]
pub fn read_project(arg: ProjectPathArg) -> Result<VoxiaProject, String> {
    project::read_project_file(Path::new(&arg.project_path)).map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveProjectRequest {
    pub project_path: String,
    pub project: VoxiaProject,
}

#[tauri::command]
pub fn save_project(req: SaveProjectRequest) -> Result<(), String> {
    project::write_project_file(Path::new(&req.project_path), &req.project)
        .map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadModelRequest {
    pub kind: String,
    pub id: String,
}

#[tauri::command]
pub async fn download_model(app: AppHandle, req: DownloadModelRequest) -> Result<(), String> {
    let kind =
        ModelKind::parse(&req.kind).ok_or_else(|| format!("unknown model kind {}", req.kind))?;
    models::download_bundle(app, kind, req.id).await
}

#[tauri::command]
pub fn list_models(app: AppHandle) -> Result<models::ListModelsResponse, String> {
    models::list_models(&app)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteModelRequest {
    pub kind: String,
    pub id: String,
}

#[tauri::command]
pub fn delete_model(app: AppHandle, req: DeleteModelRequest) -> Result<(), String> {
    let kind =
        ModelKind::parse(&req.kind).ok_or_else(|| format!("unknown model kind {}", req.kind))?;
    models::delete_bundle(&app, kind, &req.id)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeRequest {
    pub project_path: String,
    pub model_id: String,
    pub language: Option<String>,
    #[serde(default)]
    pub task_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeResponse {
    pub task_id: String,
    pub project: VoxiaProject,
}

#[tauri::command]
pub async fn transcribe_project(
    app: AppHandle,
    state: State<'_, AppState>,
    req: TranscribeRequest,
) -> Result<TranscribeResponse, String> {
    let task_id = req
        .task_id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    log::info!(
        "[transcribe] start task={task_id} model={} lang={:?}",
        req.model_id,
        req.language
    );
    let token = state.register_transcribe(task_id.clone());
    let project_path = PathBuf::from(&req.project_path);
    let mut proj = project::read_project_file(&project_path).map_err(|e| {
        log::error!("[transcribe] cannot read project: {e}");
        e.to_string()
    })?;
    let video = PathBuf::from(&proj.video_path);
    if !video.exists() {
        log::error!("[transcribe] video file missing: {}", video.display());
        state.finish_transcribe(&task_id);
        return Err("video missing".into());
    }
    log::info!("[transcribe] video ok: {}", video.display());

    let model_path = models::whisper_model_path(&app, &req.model_id)?;
    if !model_path.exists() {
        log::error!(
            "[transcribe] whisper model not found: {}",
            model_path.display()
        );
        state.finish_transcribe(&task_id);
        return Err(format!(
            "whisper model not installed: {} (download first)",
            model_path.display()
        ));
    }
    log::info!("[transcribe] model ok: {}", model_path.display());

    log::info!("[transcribe] extracting PCM audio…");
    let samples = audio::extract_pcm_mono_f32_16k(&app, &video, &token)
        .await
        .inspect_err(|e| {
            log::error!("[transcribe] audio extraction failed: {e}");
            state.finish_transcribe(&task_id);
        })?;
    log::info!(
        "[transcribe] audio extracted: {} samples ({:.1}s)",
        samples.len(),
        samples.len() as f64 / 16000.0
    );

    if token.is_cancelled() {
        log::info!("[transcribe] cancelled after audio extraction");
        state.finish_transcribe(&task_id);
        return Err("cancelled".into());
    }

    emit_transcribe_progress(
        &app,
        TranscribeProgressPayload {
            task_id: task_id.clone(),
            percent: 0,
            last_text: None,
        },
    );

    let app_emit = app.clone();
    let tid = task_id.clone();
    let lang = req.language.clone();
    let model_path2 = model_path.clone();
    log::info!("[transcribe] starting whisper inference…");
    let blocking = tokio::task::spawn_blocking(move || {
        asr::transcribe_f32_samples(
            &model_path2,
            &samples,
            lang.as_deref(),
            token.clone(),
            move |p| {
                emit_transcribe_progress(
                    &app_emit,
                    TranscribeProgressPayload {
                        task_id: tid.clone(),
                        percent: p,
                        last_text: None,
                    },
                );
            },
        )
    })
    .await;

    let cues = match blocking {
        Ok(Ok(cues)) => {
            log::info!("[transcribe] whisper done: {} cues", cues.len());
            cues
        }
        Ok(Err(msg)) => {
            log::error!("[transcribe] whisper error: {msg}");
            state.finish_transcribe(&task_id);
            return Err(msg);
        }
        Err(join_err) => {
            log::error!("[transcribe] worker panic: {join_err}");
            state.finish_transcribe(&task_id);
            return Err(format!("transcription worker failed: {join_err}"));
        }
    };

    proj.cues = cues;
    proj.model_id = Some(req.model_id.clone());
    proj.language = req.language.clone();
    project::write_project_file(&project_path, &proj).map_err(|e| {
        log::error!("[transcribe] save project failed: {e}");
        state.finish_transcribe(&task_id);
        e.to_string()
    })?;
    state.finish_transcribe(&task_id);
    log::info!("[transcribe] task={task_id} complete");
    Ok(TranscribeResponse {
        task_id,
        project: proj,
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelTranscribeRequest {
    pub task_id: String,
}

#[tauri::command]
pub fn cancel_transcribe(
    state: State<'_, AppState>,
    req: CancelTranscribeRequest,
) -> Result<bool, String> {
    Ok(state.cancel_transcribe(&req.task_id))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateCuesRequest {
    pub project_path: String,
    pub provider_id: String,
    pub src: String,
    pub tgt: String,
    #[serde(default)]
    pub cue_indices: Option<Vec<usize>>,
}

#[tauri::command]
pub async fn translate_cues(
    app: AppHandle,
    req: TranslateCuesRequest,
) -> Result<VoxiaProject, String> {
    let path = PathBuf::from(&req.project_path);
    let mut proj = project::read_project_file(&path).map_err(|e| e.to_string())?;

    let azure_key = read_key(&format!("provider_{}", "azure"));
    let azure_region = read_key(&format!("provider_{}", "azure_region"));
    let google_key = read_key(&format!("provider_{}", "google"));
    let deepseek_key = read_key(&format!("provider_{}", "deepseek"));

    let translator = translate::build_translator(
        &app,
        &req.provider_id,
        azure_key,
        azure_region,
        google_key,
        deepseek_key,
    )
    .map_err(|e| serde_json::to_string(&e.to_json()).unwrap())?;

    let src = if req.src == "auto" {
        ""
    } else {
        req.src.as_str()
    };
    if !translator.supports(src, &req.tgt) {
        return Err(
            serde_json::to_string(&translate::TranslateError::UnsupportedPair.to_json()).unwrap(),
        );
    }
    log::info!("translate via {}", translator.id());

    let indices: Vec<usize> = if let Some(ix) = &req.cue_indices {
        ix.clone()
    } else {
        (0..proj.cues.len()).collect()
    };

    let mut texts: Vec<String> = Vec::new();
    for &i in &indices {
        let t = proj
            .cues
            .get(i)
            .map(|c| c.text.clone())
            .ok_or_else(|| format!("cue index out of range {i}"))?;
        texts.push(t);
    }

    let app2 = app.clone();
    let total = texts.len();
    emit_translate_progress(
        &app,
        TranslateProgressPayload {
            done: 0,
            total,
            last_text: None,
        },
    );
    let translated = translator
        .translate_batch(&texts, src, &req.tgt, &|done, tot| {
            emit_translate_progress(
                &app2,
                TranslateProgressPayload {
                    done,
                    total: tot,
                    last_text: None,
                },
            );
        })
        .await
        .map_err(|e| serde_json::to_string(&e.to_json()).unwrap())?;

    for (k, &i) in indices.iter().enumerate() {
        if let Some(cue) = proj.cues.get_mut(i) {
            if let Some(tr) = translated.get(k) {
                cue.translated_text = Some(tr.clone());
            }
        }
    }

    emit_translate_progress(
        &app,
        TranslateProgressPayload {
            done: total,
            total,
            last_text: None,
        },
    );

    project::write_project_file(&path, &proj).map_err(|e| e.to_string())?;
    Ok(proj)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSubtitlesRequest {
    pub project_path: String,
    pub format: String,
    pub mode: String,
    #[serde(default)]
    pub output_path: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSubtitlesResponse {
    pub output_path: String,
}

fn parse_export_format(s: &str) -> Result<ExportFormat, String> {
    match s.to_lowercase().as_str() {
        "srt" => Ok(ExportFormat::Srt),
        "vtt" => Ok(ExportFormat::Vtt),
        _ => Err(format!("unknown format {s}")),
    }
}

fn parse_export_mode(s: &str) -> Result<ExportMode, String> {
    match s.to_lowercase().as_str() {
        "original" => Ok(ExportMode::Original),
        "translated" => Ok(ExportMode::Translated),
        "bilingual" => Ok(ExportMode::Bilingual),
        _ => Err(format!("unknown mode {s}")),
    }
}

#[tauri::command]
pub async fn export_subtitles(
    app: AppHandle,
    req: ExportSubtitlesRequest,
) -> Result<ExportSubtitlesResponse, String> {
    let proj =
        project::read_project_file(Path::new(&req.project_path)).map_err(|e| e.to_string())?;
    let fmt = parse_export_format(&req.format)?;
    let mode = parse_export_mode(&req.mode)?;
    let body = match fmt {
        ExportFormat::Srt => export::to_srt(&proj.cues, mode),
        ExportFormat::Vtt => export::to_vtt(&proj.cues, mode),
    };

    let out = if let Some(p) = req.output_path.clone() {
        PathBuf::from(p)
    } else {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let ext = match fmt {
            ExportFormat::Srt => "srt",
            ExportFormat::Vtt => "vtt",
        };
        app.dialog()
            .file()
            .set_file_name(format!("subtitles.{ext}"))
            .save_file(move |f| {
                let _ = tx.send(f);
            });
        let picked = rx.await.map_err(|_| "dialog closed".to_string())?;
        let fp = picked.ok_or_else(|| "no file picked".to_string())?;
        fp.into_path()
            .map_err(|e| format!("invalid export path: {e:?}"))?
    };

    if let Some(parent) = out.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&out, body).map_err(|e| e.to_string())?;
    Ok(ExportSubtitlesResponse {
        output_path: out.to_string_lossy().to_string(),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetProviderKeyRequest {
    pub provider: String,
    pub key: String,
}

#[tauri::command]
pub fn set_provider_key(req: SetProviderKeyRequest) -> Result<(), String> {
    let account = format!("provider_{}", req.provider);
    write_key(&account, &req.key)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClearProviderKeyRequest {
    pub provider: String,
}

#[tauri::command]
pub fn clear_provider_key(req: ClearProviderKeyRequest) -> Result<(), String> {
    let account = format!("provider_{}", req.provider);
    delete_key(&account)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HasProviderKeyRequest {
    pub provider: String,
}

#[tauri::command]
pub fn has_provider_key(req: HasProviderKeyRequest) -> Result<bool, String> {
    let account = format!("provider_{}", req.provider);
    Ok(read_key(&account).is_some())
}

fn read_key(account: &str) -> Option<String> {
    let entry = keyring::Entry::new("voxia", account).ok()?;
    entry.get_password().ok()
}

fn write_key(account: &str, value: &str) -> Result<(), String> {
    let entry = keyring::Entry::new("voxia", account).map_err(|e| e.to_string())?;
    entry.set_password(value).map_err(|e| e.to_string())
}

fn delete_key(account: &str) -> Result<(), String> {
    let entry = keyring::Entry::new("voxia", account).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}
