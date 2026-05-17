//! SRT / VTT serialization (pure functions, unit-tested).

use crate::project::Cue;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ExportMode {
    Original,
    Translated,
    Bilingual,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Srt,
    Vtt,
}

/// `ms` wall-clock milliseconds → SRT `HH:MM:SS,mmm`.
pub fn format_timestamp_srt(ms: i64) -> String {
    let ms = ms.max(0);
    let h = ms / 3_600_000;
    let m = (ms % 3_600_000) / 60_000;
    let s = (ms % 60_000) / 1000;
    let frac = ms % 1000;
    format!("{h:02}:{m:02}:{s:02},{frac:03}")
}

/// `ms` wall-clock milliseconds → WebVTT `HH:MM:SS.mmm`.
pub fn format_timestamp_vtt(ms: i64) -> String {
    let ms = ms.max(0);
    let h = ms / 3_600_000;
    let m = (ms % 3_600_000) / 60_000;
    let s = (ms % 60_000) / 1000;
    let frac = ms % 1000;
    format!("{h:02}:{m:02}:{s:02}.{frac:03}")
}

fn cue_lines(mode: ExportMode, cue: &Cue) -> Vec<String> {
    match mode {
        ExportMode::Original => vec![cue.text.clone()],
        ExportMode::Translated => vec![cue
            .translated_text
            .clone()
            .unwrap_or_else(|| cue.text.clone())],
        ExportMode::Bilingual => {
            let t = cue.translated_text.clone().unwrap_or_default();
            vec![cue.text.clone(), t]
        }
    }
}

pub fn to_srt(cues: &[Cue], mode: ExportMode) -> String {
    let mut out = String::new();
    for (i, cue) in cues.iter().enumerate() {
        let n = i + 1;
        let start = format_timestamp_srt(cue.start_ms);
        let end = format_timestamp_srt(cue.end_ms);
        out.push_str(&format!("{n}\n{start} --> {end}\n"));
        for line in cue_lines(mode, cue) {
            out.push_str(&line);
            out.push('\n');
        }
        out.push('\n');
    }
    out
}

pub fn to_vtt(cues: &[Cue], mode: ExportMode) -> String {
    let mut out = String::from("WEBVTT\n\n");
    for cue in cues {
        let start = format_timestamp_vtt(cue.start_ms);
        let end = format_timestamp_vtt(cue.end_ms);
        out.push_str(&format!("{start} --> {end}\n"));
        for line in cue_lines(mode, cue) {
            out.push_str(&line);
            out.push('\n');
        }
        out.push('\n');
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_srt_timestamp(line: &str) -> Option<(i64, i64, i64, i64)> {
        let line = line.trim();
        let (time, frac_s) = line.split_once(',')?;
        let mut it = time.split(':');
        let h: i64 = it.next()?.parse().ok()?;
        let m: i64 = it.next()?.parse().ok()?;
        let s: i64 = it.next()?.parse().ok()?;
        let frac: i64 = frac_s.parse().ok()?;
        Some((h, m, s, frac))
    }

    fn srt_ts_to_ms(h: i64, m: i64, s: i64, frac_ms: i64) -> i64 {
        ((h * 60 + m) * 60 + s) * 1000 + frac_ms
    }

    #[test]
    fn srt_timestamp_roundtrip_property() {
        for ms in [0i64, 10, 1500, 60_000, 3_666_010] {
            let s = format_timestamp_srt(ms);
            let rest = parse_srt_timestamp(&s).expect("parse");
            let back = srt_ts_to_ms(rest.0, rest.1, rest.2, rest.3);
            assert_eq!(back, ms, "srt ts {s}");
        }
    }

    #[test]
    fn vtt_timestamp_has_dot_separator() {
        let s = format_timestamp_vtt(1500);
        assert!(s.contains('.'));
        assert!(!s.contains(','));
    }

    #[test]
    fn bilingual_srt_two_lines() {
        let cues = vec![Cue {
            id: "1".into(),
            start_ms: 0,
            end_ms: 1000,
            text: "Hi".into(),
            translated_text: Some("Сайн".into()),
        }];
        let s = to_srt(&cues, ExportMode::Bilingual);
        assert!(s.contains("Hi\nСайн"));
    }
}
