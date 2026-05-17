import { invoke, type InvokeArgs } from "@tauri-apps/api/core"

import { formatInvokeError } from "@/lib/format-invoke-error"
import type {
  CreateProjectResponse,
  ExportSubtitlesResponse,
  ListModelsResponse,
  TranscribeResponse,
  VoxiaProject,
} from "@/types/voxia"

const invokeVoxia = async <T>(cmd: string, args?: InvokeArgs): Promise<T> => {
  try {
    return await invoke<T>(cmd, args)
  } catch (e) {
    throw new Error(formatInvokeError(e))
  }
}

export const createProject = (videoPath: string) =>
  invokeVoxia<CreateProjectResponse>("create_project", { req: { videoPath } })

export const readProject = (projectPath: string) =>
  invokeVoxia<VoxiaProject>("read_project", { arg: { projectPath } })

export const saveProject = (projectPath: string, project: VoxiaProject) =>
  invokeVoxia<void>("save_project", { req: { projectPath, project } })

export const downloadModel = (kind: string, id: string) =>
  invokeVoxia<void>("download_model", { req: { kind, id } })

export const deleteModel = (kind: string, id: string) =>
  invokeVoxia<void>("delete_model", { req: { kind, id } })

export const listModels = () => invokeVoxia<ListModelsResponse>("list_models", {})

export const transcribeProject = (payload: {
  projectPath: string
  modelId: string
  language?: string | null
  taskId?: string | null
}) => invokeVoxia<TranscribeResponse>("transcribe_project", { req: payload })

export const cancelTranscribe = (taskId: string) =>
  invokeVoxia<boolean>("cancel_transcribe", { req: { taskId } })

export const translateCues = (payload: {
  projectPath: string
  providerId: string
  src: string
  tgt: string
  cueIndices?: number[] | null
}) => invokeVoxia<VoxiaProject>("translate_cues", { req: payload })

export const exportSubtitles = (payload: {
  projectPath: string
  format: string
  mode: string
  outputPath?: string | null
}) => invokeVoxia<ExportSubtitlesResponse>("export_subtitles", { req: payload })

export const setProviderKey = (provider: string, key: string) =>
  invokeVoxia<void>("set_provider_key", { req: { provider, key } })

export const clearProviderKey = (provider: string) =>
  invokeVoxia<void>("clear_provider_key", { req: { provider } })

export const hasProviderKey = (provider: string) =>
  invokeVoxia<boolean>("has_provider_key", { req: { provider } })
