use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TranslateError {
    #[error("model not installed: {0}")]
    ModelNotInstalled(String),
    #[error("authentication failed: {0}")]
    AuthFailed(String),
    #[error("network: {0}")]
    Network(String),
    #[error("unsupported language pair")]
    UnsupportedPair,
    #[error("local NLLB engine not available yet ({0}); use google or azure")]
    LocalEnginePending(String),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateErrorJson {
    pub kind: String,
    pub message: String,
    pub retryable: bool,
}

impl TranslateError {
    pub fn to_json(&self) -> TranslateErrorJson {
        let (kind, retryable) = match self {
            TranslateError::ModelNotInstalled(_) => ("modelNotInstalled", false),
            TranslateError::AuthFailed(_) => ("authFailed", false),
            TranslateError::Network(_) => ("networkUnavailable", true),
            TranslateError::UnsupportedPair => ("unsupportedPair", false),
            TranslateError::LocalEnginePending(_) => ("localEnginePending", false),
        };
        TranslateErrorJson {
            kind: kind.into(),
            message: self.to_string(),
            retryable,
        }
    }
}
