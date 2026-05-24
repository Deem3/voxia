mod errors;

pub mod azure;
pub mod deepseek;
pub mod google;
pub mod google_free;
pub mod nllb;

pub use errors::TranslateError;

use async_trait::async_trait;
use tauri::AppHandle;

#[async_trait]
pub trait Translator: Send + Sync {
    fn id(&self) -> &'static str;
    fn supports(&self, src: &str, tgt: &str) -> bool;
    async fn translate_batch(
        &self,
        items: &[String],
        src: &str,
        tgt: &str,
        progress: &(dyn Fn(usize, usize) + Send + Sync),
    ) -> Result<Vec<String>, TranslateError>;
}

pub enum TranslatorKind {
    Azure(azure::AzureTranslator),
    DeepSeek(deepseek::DeepSeekTranslator),
    Google(google::GoogleTranslator),
    GoogleFree(google_free::GoogleFreeTranslator),
    Nllb(nllb::NllbTranslator),
}

#[async_trait]
impl Translator for TranslatorKind {
    fn id(&self) -> &'static str {
        match self {
            TranslatorKind::Azure(t) => t.id(),
            TranslatorKind::DeepSeek(t) => t.id(),
            TranslatorKind::Google(t) => t.id(),
            TranslatorKind::GoogleFree(t) => t.id(),
            TranslatorKind::Nllb(t) => t.id(),
        }
    }

    fn supports(&self, src: &str, tgt: &str) -> bool {
        match self {
            TranslatorKind::Azure(t) => t.supports(src, tgt),
            TranslatorKind::DeepSeek(t) => t.supports(src, tgt),
            TranslatorKind::Google(t) => t.supports(src, tgt),
            TranslatorKind::GoogleFree(t) => t.supports(src, tgt),
            TranslatorKind::Nllb(t) => t.supports(src, tgt),
        }
    }

    async fn translate_batch(
        &self,
        items: &[String],
        src: &str,
        tgt: &str,
        progress: &(dyn Fn(usize, usize) + Send + Sync),
    ) -> Result<Vec<String>, TranslateError> {
        match self {
            TranslatorKind::Azure(t) => t.translate_batch(items, src, tgt, progress).await,
            TranslatorKind::DeepSeek(t) => t.translate_batch(items, src, tgt, progress).await,
            TranslatorKind::Google(t) => t.translate_batch(items, src, tgt, progress).await,
            TranslatorKind::GoogleFree(t) => t.translate_batch(items, src, tgt, progress).await,
            TranslatorKind::Nllb(t) => t.translate_batch(items, src, tgt, progress).await,
        }
    }
}

pub fn build_translator(
    app: &AppHandle,
    provider_id: &str,
    azure_key: Option<String>,
    azure_region: Option<String>,
    google_key: Option<String>,
    deepseek_key: Option<String>,
) -> Result<TranslatorKind, TranslateError> {
    match provider_id {
        "azure" => {
            let key = azure_key.ok_or_else(|| {
                TranslateError::AuthFailed("missing Azure subscription key in keyring".into())
            })?;
            Ok(TranslatorKind::Azure(azure::AzureTranslator {
                key,
                region: azure_region,
            }))
        }
        "deepseek" => {
            let api_key = deepseek_key.filter(|k| !k.trim().is_empty()).ok_or_else(|| {
                TranslateError::AuthFailed("missing DeepSeek API key in keyring".into())
            })?;
            Ok(TranslatorKind::DeepSeek(deepseek::DeepSeekTranslator { api_key }))
        }
        "google" | "google_free" => {
            if let Some(api_key) = google_key.filter(|k| !k.trim().is_empty()) {
                Ok(TranslatorKind::Google(google::GoogleTranslator { api_key }))
            } else {
                Ok(TranslatorKind::GoogleFree(
                    google_free::GoogleFreeTranslator::new()?,
                ))
            }
        }
        "nllb" => Ok(TranslatorKind::Nllb(nllb::NllbTranslator {
            app: app.clone(),
        })),
        other => Err(TranslateError::Network(format!("unknown provider {other}"))),
    }
}
