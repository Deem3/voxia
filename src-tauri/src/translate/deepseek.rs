//! DeepSeek Chat API — LLM translation via API key (OpenAI-compatible).

use super::errors::TranslateError;
use async_trait::async_trait;
use serde::Deserialize;

const API_URL: &str = "https://api.deepseek.com/chat/completions";
const MODEL: &str = "deepseek-chat";
const BATCH_SIZE: usize = 12;

pub struct DeepSeekTranslator {
    pub api_key: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatMessage {
    content: String,
}

#[derive(Deserialize)]
struct TranslationPayload {
    translations: Vec<String>,
}

fn source_language_label(src: &str) -> String {
    if src.is_empty() {
        "auto-detect the source language".into()
    } else {
        format!("language code \"{src}\"")
    }
}

fn extract_json_object(content: &str) -> Result<String, TranslateError> {
    let trimmed = content.trim();
    if trimmed.starts_with('{') {
        return Ok(trimmed.to_string());
    }
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            return Ok(trimmed[start..=end].to_string());
        }
    }
    Err(TranslateError::Network(
        "DeepSeek response did not contain JSON".into(),
    ))
}

impl DeepSeekTranslator {
    async fn translate_chunk(
        &self,
        client: &reqwest::Client,
        items: &[String],
        src: &str,
        tgt: &str,
    ) -> Result<Vec<String>, TranslateError> {
        let source = source_language_label(src);
        let inputs = serde_json::to_string(items)
            .map_err(|e| TranslateError::Network(e.to_string()))?;
        let system = format!(
            "You translate subtitle lines accurately. Target language code: \"{tgt}\". \
             Source: {source}. Return ONLY valid JSON with shape \
             {{\"translations\":[\"...\"]}} containing exactly {} strings in the same order \
             as the input. Preserve timing-friendly brevity; do not add numbering or commentary.",
            items.len()
        );
        let user = format!("Translate this JSON array of subtitle lines:\n{inputs}");

        let body = serde_json::json!({
            "model": MODEL,
            "temperature": 0.1,
            "response_format": { "type": "json_object" },
            "messages": [
                { "role": "system", "content": system },
                { "role": "user", "content": user }
            ]
        });

        let resp = client
            .post(API_URL)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .map_err(|e| TranslateError::Network(e.to_string()))?;

        if resp.status() == 401 || resp.status() == 403 {
            return Err(TranslateError::AuthFailed(
                resp.text().await.unwrap_or_default(),
            ));
        }
        if !resp.status().is_success() {
            let status = resp.status();
            let detail = resp.text().await.unwrap_or_default();
            return Err(TranslateError::Network(format!("HTTP {status}: {detail}")));
        }

        let parsed: ChatResponse = resp
            .json()
            .await
            .map_err(|e| TranslateError::Network(e.to_string()))?;
        let content = parsed
            .choices
            .first()
            .map(|c| c.message.content.as_str())
            .ok_or_else(|| TranslateError::Network("DeepSeek returned no choices".into()))?;

        let json_text = extract_json_object(content)?;
        let payload: TranslationPayload = serde_json::from_str(&json_text)
            .map_err(|e| TranslateError::Network(format!("invalid DeepSeek JSON: {e}")))?;

        if payload.translations.len() != items.len() {
            return Err(TranslateError::Network(format!(
                "DeepSeek returned {} translations, expected {}",
                payload.translations.len(),
                items.len()
            )));
        }

        Ok(payload.translations)
    }
}

#[async_trait]
impl super::Translator for DeepSeekTranslator {
    fn id(&self) -> &'static str {
        "deepseek"
    }

    fn supports(&self, _src: &str, _tgt: &str) -> bool {
        true
    }

    async fn translate_batch(
        &self,
        items: &[String],
        src: &str,
        tgt: &str,
        progress: &(dyn Fn(usize, usize) + Send + Sync),
    ) -> Result<Vec<String>, TranslateError> {
        let client = reqwest::Client::new();
        let mut out = Vec::with_capacity(items.len());
        let mut done = 0usize;

        for chunk in items.chunks(BATCH_SIZE) {
            let translated = self.translate_chunk(&client, chunk, src, tgt).await?;
            done += translated.len();
            out.extend(translated);
            progress(done, items.len());
        }

        Ok(out)
    }
}
