//! Local NLLB weights are downloaded by [`crate::models`]; Candle inference is intentionally not wired in this pass.

use super::errors::TranslateError;
use async_trait::async_trait;
use tauri::AppHandle;

pub struct NllbTranslator {
    pub app: AppHandle,
}

fn nllb_weights_ready(app: &AppHandle) -> bool {
    let Ok(root) = crate::models::kind_dir(app, crate::models::ModelKind::Nllb) else {
        return false;
    };
    let p = root.join("pytorch_model.bin");
    p.exists()
}

#[async_trait]
impl super::Translator for NllbTranslator {
    fn id(&self) -> &'static str {
        "nllb"
    }

    fn supports(&self, _src: &str, _tgt: &str) -> bool {
        true
    }

    async fn translate_batch(
        &self,
        _items: &[String],
        _src: &str,
        _tgt: &str,
        _progress: &(dyn Fn(usize, usize) + Send + Sync),
    ) -> Result<Vec<String>, TranslateError> {
        if !nllb_weights_ready(&self.app) {
            return Err(TranslateError::ModelNotInstalled(
                "download model kind=nllb id=nllb-200-distilled-600M first".into(),
            ));
        }
        Err(TranslateError::LocalEnginePending(
            "Candle NLLB forward pass not bundled in this logic-only milestone".into(),
        ))
    }
}
