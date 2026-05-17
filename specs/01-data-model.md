# Data model — JSON, commands, events

## `.voxia.json` (project)

```json
{
  "id": "uuid-v4",
  "videoPath": "/absolute/path/to/video.mp4",
  "createdAt": "2026-05-14T12:00:00Z",
  "cues": [
    {
      "id": "cue-uuid",
      "startMs": 0,
      "endMs": 1500,
      "text": "Hello",
      "translatedText": null
    }
  ],
  "language": null,
  "modelId": null
}
```

Field names in JSON use camelCase via `serde(rename = "camelCase")` where applicable.

## Settings store (frontend `tauri-plugin-store`)

Persisted separately from `.voxia.json`:

- `theme`: `"light" | "dark" | "system"`
- `defaultTranslatorProvider`: `"nllb" | "azure" | "google"`
- `defaultSourceLang`: BCP-47 string (e.g. `"auto"`)
- `defaultTargetLang`: BCP-47 string (default `"mn"`)
- `modelsDirOverride`: `string | null` — if set, models download here instead of app data

API keys **never** go in the store; use OS keyring via Rust commands.

## Tauri commands (IPC)

| Command | Args | Returns |
|---------|------|---------|
| `create_project` | `{ videoPath }` | `{ projectPath, project }` |
| `read_project` | `{ projectPath }` | `VoxiaProject` |
| `save_project` | `{ projectPath, project }` | `null` |
| `download_model` | `{ kind, id }` | `null` (progress via events) |
| `list_models` | — | `{ whisper: ModelRow[], nllb: ModelRow[] }` |
| `transcribe_project` | `{ projectPath, modelId, language? }` | `VoxiaProject` (updated cues) |
| `cancel_transcribe` | `{ taskId }` | `null` |
| `translate_cues` | `{ projectPath, providerId, src, tgt, cueIndices? }` | `VoxiaProject` |
| `export_subtitles` | `{ projectPath, format, mode, outputPath? }` | `{ outputPath }` |
| `set_provider_key` | `{ provider, key }` | `null` |
| `clear_provider_key` | `{ provider }` | `null` |
| `has_provider_key` | `{ provider }` | `boolean` |

`provider` for keyring: `azure`, `google`, `google_project` (optional project id for Google v3 path).

## Events (listen)

All payloads are JSON objects.

| Event | Payload |
|-------|---------|
| `voxia:model-progress` | `{ kind, id, bytesReceived, totalBytes?, phase }` |
| `voxia:transcribe-progress` | `{ taskId, percent, lastText? }` |
| `voxia:translate-progress` | `{ done, total, lastText? }` |

## `ModelRow`

```json
{
  "id": "base",
  "kind": "whisper",
  "displayName": "Whisper base",
  "installed": true,
  "bytesOnDisk": 142000000,
  "expectedSha256": "…" 
}
```
