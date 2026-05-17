use super::errors::TranslateError;
use async_trait::async_trait;
use serde::Deserialize;

pub struct AzureTranslator {
    pub key: String,
    pub region: Option<String>,
}

#[derive(Deserialize)]
struct AzureItem {
    translations: Vec<AzureTr>,
}

#[derive(Deserialize)]
struct AzureTr {
    text: String,
}

#[async_trait]
impl super::Translator for AzureTranslator {
    fn id(&self) -> &'static str {
        "azure"
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
        let mut out = Vec::with_capacity(items.len());
        let mut done = 0usize;
        for chunk in items.chunks(100) {
            let url = if src.is_empty() {
                format!(
                    "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to={tgt}"
                )
            } else {
                format!(
                    "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from={src}&to={tgt}"
                )
            };
            let body: Vec<serde_json::Value> = chunk
                .iter()
                .map(|t| serde_json::json!({ "Text": t }))
                .collect();
            let mut req = reqwest::Client::new()
                .post(&url)
                .header("Ocp-Apim-Subscription-Key", &self.key)
                .json(&body);
            if let Some(r) = &self.region {
                req = req.header("Ocp-Apim-Subscription-Region", r);
            }
            let resp = req
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
            let parsed: Vec<AzureItem> = resp
                .json()
                .await
                .map_err(|e| TranslateError::Network(e.to_string()))?;
            for row in parsed {
                let t = row
                    .translations
                    .first()
                    .map(|x| x.text.clone())
                    .unwrap_or_default();
                out.push(t);
            }
            done += chunk.len();
            progress(done, items.len());
        }
        Ok(out)
    }
}
