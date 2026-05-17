//! Google Cloud Translation **v2** JSON API (API key) — sufficient for desktop keys; v3 can be swapped later.

use super::errors::TranslateError;
use async_trait::async_trait;
use serde::Deserialize;

pub struct GoogleTranslator {
    pub api_key: String,
}

#[derive(Deserialize)]
struct V2Body {
    data: V2Data,
}

#[derive(Deserialize)]
struct V2Data {
    translations: Vec<V2Tr>,
}

#[derive(Deserialize)]
struct V2Tr {
    #[serde(rename = "translatedText")]
    translated_text: String,
}

#[async_trait]
impl super::Translator for GoogleTranslator {
    fn id(&self) -> &'static str {
        "google"
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
        let url = format!(
            "https://translation.googleapis.com/language/translate/v2?key={}",
            self.api_key
        );
        let mut out = Vec::with_capacity(items.len());
        let mut done = 0usize;
        for chunk in items.chunks(100) {
            let mut body = serde_json::json!({
                "q": chunk,
                "target": tgt,
                "format": "text"
            });
            if !src.is_empty() {
                body["source"] = serde_json::Value::String(src.to_string());
            }
            let resp = reqwest::Client::new()
                .post(&url)
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
                return Err(TranslateError::Network(format!("HTTP {}", resp.status())));
            }
            let parsed: V2Body = resp
                .json()
                .await
                .map_err(|e| TranslateError::Network(e.to_string()))?;
            for t in parsed.data.translations {
                out.push(t.translated_text);
            }
            done += chunk.len();
            progress(done, items.len());
        }
        Ok(out)
    }
}
