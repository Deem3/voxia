import { create } from "zustand"

type PlayerState = {
  currentTimeMs: number
  durationMs: number
  playing: boolean
  setCurrentTimeMs: (ms: number) => void
  setDurationMs: (ms: number) => void
  setPlaying: (v: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTimeMs: 0,
  durationMs: 0,
  playing: false,
  setCurrentTimeMs: (ms) => set({ currentTimeMs: ms }),
  setDurationMs: (ms) => set({ durationMs: ms }),
  setPlaying: (v) => set({ playing: v }),
}))
