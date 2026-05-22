import { useVirtualizer } from "@tanstack/react-virtual"
import { TranslateIcon as Translate } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatMsHms, parseHmsToMs } from "@/lib/timecode"
import { cn } from "@/lib/utils"
import type { Cue } from "@/types/voxia"

const ROW_H = 196

type CueListProps = {
  cues: Cue[]
  selectedIndex: number | null
  bilingual: boolean
  onSelect: (index: number) => void
  onSeek: (ms: number) => void
  onCommitText: (index: number, text: string) => void
  onCommitTranslatedText: (index: number, text: string) => void
  onCommitTimes: (index: number, startMs: number, endMs: number) => void
  onTranslateOne: (index: number) => void
  className?: string
}

export const CueList = ({
  cues,
  selectedIndex,
  bilingual,
  onSelect,
  onSeek,
  onCommitText,
  onCommitTranslatedText,
  onCommitTimes,
  onTranslateOne,
  className,
}: CueListProps) => {
  const parent = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: cues.length,
    getScrollElement: () => parent.current,
    estimateSize: () => ROW_H,
    overscan: 8,
  })

  return (
    <div
      ref={parent}
      className={cn(
        "h-[min(60vh,520px)] overflow-auto rounded-none border border-border bg-background",
        className,
      )}
      role="listbox"
      aria-label="Subtitle cues"
      tabIndex={0}
    >
      <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const cue = cues[vi.index]
          if (!cue) return null
          const active = selectedIndex === vi.index
          return (
            <div
              key={cue.id}
              className="absolute top-0 left-0 w-full border-b border-border p-2"
              style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}
              role="option"
              aria-selected={active}
            >
              <CueRow
                index={vi.index}
                cue={cue}
                active={active}
                bilingual={bilingual}
                onSelect={onSelect}
                onSeek={onSeek}
                onCommitText={onCommitText}
                onCommitTranslatedText={onCommitTranslatedText}
                onCommitTimes={onCommitTimes}
                onTranslateOne={onTranslateOne}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

type CueRowProps = {
  index: number
  cue: Cue
  active: boolean
  bilingual: boolean
  onSelect: (index: number) => void
  onSeek: (ms: number) => void
  onCommitText: (index: number, text: string) => void
  onCommitTranslatedText: (index: number, text: string) => void
  onCommitTimes: (index: number, startMs: number, endMs: number) => void
  onTranslateOne: (index: number) => void
}

const CueRow = ({
  index,
  cue,
  active,
  bilingual,
  onSelect,
  onSeek,
  onCommitText,
  onCommitTranslatedText,
  onCommitTimes,
  onTranslateOne,
}: CueRowProps) => {
  const [startStr, setStartStr] = useState(() => formatMsHms(cue.startMs))
  const [endStr, setEndStr] = useState(() => formatMsHms(cue.endMs))
  const [draft, setDraft] = useState(cue.text)
  const [translationDraft, setTranslationDraft] = useState(cue.translatedText ?? "")

  useEffect(() => {
    setStartStr(formatMsHms(cue.startMs))
    setEndStr(formatMsHms(cue.endMs))
    setDraft(cue.text)
    setTranslationDraft(cue.translatedText ?? "")
  }, [cue.id, cue.startMs, cue.endMs, cue.text, cue.translatedText])

  const handleBlurTimes = () => {
    const s = parseHmsToMs(startStr)
    const e = parseHmsToMs(endStr)
    if (s === null || e === null) {
      setStartStr(formatMsHms(cue.startMs))
      setEndStr(formatMsHms(cue.endMs))
      return
    }
    onCommitTimes(index, s, e)
    setStartStr(formatMsHms(s))
    setEndStr(formatMsHms(e))
  }

  return (
    <div
      className={cn(
        active
          ? "relative bg-signal-muted ring-1 ring-signal/40"
          : "relative",
      )}
    >
      {active ? (
        <span className="absolute inset-y-0 left-0 w-[3px] bg-signal" aria-hidden />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cn(
            "w-8 text-left font-mono text-[0.65rem] tabular-nums",
            active ? "font-semibold text-signal" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            onSelect(index)
            onSeek(cue.startMs)
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </button>
        <Input
          aria-label={`Cue ${index + 1} start`}
          className="h-7 w-[118px] font-mono text-[0.65rem]"
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
          onBlur={handleBlurTimes}
        />
        <Input
          aria-label={`Cue ${index + 1} end`}
          className="h-7 w-[118px] font-mono text-[0.65rem]"
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
          onBlur={handleBlurTimes}
        />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="shrink-0"
          aria-label={`Translate cue ${index + 1}`}
          onClick={() => onTranslateOne(index)}
        >
          <Translate className="size-3.5" weight="duotone" aria-hidden />
        </Button>
      </div>
      <label className="mt-1 block text-[0.65rem] font-medium text-muted-foreground">
        Transcribed
      </label>
      <Textarea
        aria-label={`Cue ${index + 1} transcribed text`}
        className="min-h-[52px] resize-y text-xs"
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => {
          onSelect(index)
        }}
        onBlur={() => {
          onCommitText(index, draft)
        }}
      />
      <label className="mt-2 block text-[0.65rem] font-medium text-muted-foreground">
        Translation
      </label>
      <Textarea
        aria-label={`Cue ${index + 1} translated text`}
        className="min-h-[52px] resize-y border-l-2 border-primary/40 text-xs"
        rows={2}
        placeholder={bilingual ? "No translation yet" : "Translate or type manually"}
        value={translationDraft}
        onChange={(e) => setTranslationDraft(e.target.value)}
        onFocus={() => {
          onSelect(index)
        }}
        onBlur={() => {
          onCommitTranslatedText(index, translationDraft)
        }}
      />
    </div>
  )
}
