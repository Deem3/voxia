//! Unofficial Google Translate web endpoint (no API key).
//!
//! Uses the same `translate_a/single` client as the public translate widget (`client=gtx`).
//! This may break if Google changes the endpoint; use the official `google` provider with an API key for production workloads.

use super::errors::TranslateError;
use async_trait::async_trait;
use serde_json::Value;
use std::time::Duration;

const ENDPOINT: &str = "https://translate.googleapis.com/translate_a/single";
const ITEM_DELAY_MS: u64 = 100;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const MAX_RETRIES: u32 = 3;
/// Above this length, use POST body instead of query string to avoid proxy/url limits.
const MAX_QUERY_LEN: usize = 1800;

pub struct GoogleFreeTranslator {
    client: reqwest::Client,
}

impl GoogleFreeTranslator {
    pub fn new() -> Result<Self, TranslateError> {
        let client = reqwest::Client::builder()
            .user_agent(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 \
                 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            )
            .timeout(REQUEST_TIMEOUT)
            .build()
            .map_err(|e| TranslateError::Network(e.to_string()))?;
        Ok(Self { client })
    }

    async fn fetch_translation(
        &self,
        text: &str,
        src: &str,
        tgt: &str,
    ) -> Result<String, TranslateError> {
        let sl = if src.is_empty() { "auto" } else { src };
        let mut last_err: Option<TranslateError> = None;

        for attempt in 0..MAX_RETRIES {
            if attempt > 0 {
                let backoff = Duration::from_millis(400 * u64::from(attempt));
                tokio::time::sleep(backoff).await;
            }

            match self.fetch_translation_once(text, sl, tgt).await {
                Ok(value) => return Ok(value),
                Err(e) if is_retryable(&e) && attempt + 1 < MAX_RETRIES => {
                    log::warn!(
                        "google_free translate retry {}/{}: {}",
                        attempt + 1,
                        MAX_RETRIES,
                        e
                    );
                    last_err = Some(e);
                }
                Err(e) => return Err(e),
            }
        }

        Err(last_err.unwrap_or_else(|| {
            TranslateError::Network("Google Translate failed after retries".into())
        }))
    }

    async fn fetch_translation_once(
        &self,
        text: &str,
        sl: &str,
        tgt: &str,
    ) -> Result<String, TranslateError> {
        let use_post = text.len() > MAX_QUERY_LEN;
        let resp = if use_post {
            self.client
                .post(ENDPOINT)
                .header("Referer", "https://translate.google.com/")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(form_body(sl, tgt, text))
                .send()
                .await
                .map_err(|e| TranslateError::Network(e.to_string()))?
        } else {
            let mut url = reqwest::Url::parse(ENDPOINT)
                .map_err(|e| TranslateError::Network(e.to_string()))?;
            {
                let mut pairs = url.query_pairs_mut();
                pairs.append_pair("client", "gtx");
                pairs.append_pair("sl", sl);
                pairs.append_pair("tl", tgt);
                pairs.append_pair("dt", "t");
                pairs.append_pair("q", text);
            }
            self.client
                .get(url)
                .header("Referer", "https://translate.google.com/")
                .send()
                .await
                .map_err(|e| TranslateError::Network(e.to_string()))?
        };

        let status = resp.status();
        let body = resp
            .text()
            .await
            .map_err(|e| TranslateError::Network(e.to_string()))?;

        if status.as_u16() == 429 {
            return Err(TranslateError::Network(
                "Google Translate rate-limited this client; wait a moment and retry".into(),
            ));
        }
        if status.as_u16() >= 500 {
            return Err(TranslateError::Network(format!(
                "Google Translate server error HTTP {}",
                status
            )));
        }
        if !status.is_success() {
            return Err(TranslateError::Network(format!(
                "Google Translate HTTP {}: {}",
                status,
                truncate_err(&body, 200)
            )));
        }

        parse_gtx_response(&body)
    }
}

fn form_body(sl: &str, tgt: &str, text: &str) -> String {
    let mut body = format!(
        "client=gtx&sl={}&tl={}&dt=t&q=",
        url_encode(sl),
        url_encode(tgt),
    );
    body.push_str(&url_encode(text));
    body
}

fn url_encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for byte in s.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char);
            }
            b' ' => out.push('+'),
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

fn is_retryable(err: &TranslateError) -> bool {
    match err {
        TranslateError::Network(msg) => {
            msg.contains("rate-limited")
                || msg.contains("server error")
                || msg.contains("timed out")
                || msg.contains("connection")
                || msg.contains("request failed")
        }
        _ => false,
    }
}

fn truncate_err(s: &str, max: usize) -> String {
    if s.len() <= max {
        return s.to_string();
    }
    format!("{}…", &s[..max])
}

/// One `q` → `response[0]` is an array of sentence segments; join them for the full line.
fn parse_gtx_response(body: &str) -> Result<String, TranslateError> {
    let root: Value =
        serde_json::from_str(body).map_err(|e| TranslateError::Network(e.to_string()))?;

    let rows = root.get(0).and_then(|v| v.as_array()).ok_or_else(|| {
        TranslateError::Network("unexpected Google Translate response shape".into())
    })?;

    let translated: String = rows.iter().filter_map(segment_translation).collect();

    if translated.is_empty() && !body.trim().is_empty() {
        return Err(TranslateError::Network(
            "Google Translate returned an empty translation".into(),
        ));
    }

    Ok(translated)
}

fn segment_translation(row: &Value) -> Option<String> {
    if let Some(s) = row.as_str() {
        return Some(s.to_string());
    }
    row.as_array()
        .and_then(|parts| parts.first())
        .and_then(|v| v.as_str())
        .map(str::to_string)
}

#[async_trait]
impl super::Translator for GoogleFreeTranslator {
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
        let mut out = Vec::with_capacity(items.len());

        for (index, item) in items.iter().enumerate() {
            let translated = if item.trim().is_empty() {
                String::new()
            } else {
                self.fetch_translation(item, src, tgt).await?
            };
            out.push(translated);
            progress(index + 1, items.len());

            if index + 1 < items.len() {
                tokio::time::sleep(Duration::from_millis(ITEM_DELAY_MS)).await;
            }
        }

        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_single_segment() {
        let body = r#"[[["Hola","Hello",null,null,3]],null,"es",null,null,null,null,[]]"#;
        assert_eq!(parse_gtx_response(body).unwrap(), "Hola");
    }

    #[test]
    fn parse_multi_segment_single_query() {
        let body = r#"[[["Hello ","Hello ",null,null,3],["world","world",null,null,3]],null,"es"]"#;
        assert_eq!(parse_gtx_response(body).unwrap(), "Hello world");
    }
}
