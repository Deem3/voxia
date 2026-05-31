import { useVirtualizer } from "@tanstack/react-virtual"
import { TranslateIcon as Translate } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatMsHms, parseHmsToMs } from "@/lib/timecode"
import { cn } from "@/lib/utils"
import type { Cue } from "@/types/voxia"

const ROW_H = 200

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
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 8,
  })

  return (
    <div
      ref={parent}
      className={cn(
        "h-[min(60vh,520px)] overflow-auto bg-background",
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
              data-index={vi.index}
              ref={virtualizer.measureElement}
              className={cn(
                "absolute top-0 left-0 w-full border-b border-border/50 transition-colors duration-100",
                active && "bg-signal-muted/30",
              )}
              style={{ transform: `translateY(${vi.start}px)` }}
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
    <div className={cn(
      "relative p-2 space-y-2",
      active && "border-l-2 border-signal",
    )}>
      {/* Timecode + actions row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "w-7 text-left font-mono text-[0.6rem] tabular-nums font-semibold transition-colors",
            active ? "text-signal" : "text-muted-foreground/60 hover:text-foreground",
          )}
          onClick={() => { onSelect(index); onSeek(cue.startMs) }}
        >
          {String(index + 1).padStart(2, "0")}
        </button>
        <Input
          aria-label={`Cue ${index + 1} start`}
          className="h-6 w-[110px] font-mono text-[0.6rem] px-1.5"
          value={startStr}
          onChange={(e) => setStartStr(e.target.value)}
          onBlur={handleBlurTimes}
        />
        <span className="text-[0.6rem] text-muted-foreground/40" aria-hidden>→</span>
        <Input
          aria-label={`Cue ${index + 1} end`}
          className="h-6 w-[110px] font-mono text-[0.6rem] px-1.5"
          value={endStr}
          onChange={(e) => setEndStr(e.target.value)}
          onBlur={handleBlurTimes}
        />
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="ml-auto shrink-0 text-muted-foreground/50 hover:text-signal"
          aria-label={`Translate cue ${index + 1}`}
          onClick={() => onTranslateOne(index)}
          title="Translate this cue"
        >
          <Translate className="size-3" weight="duotone" aria-hidden />
        </Button>
      </div>

      {/* Text fields */}
      <div className="space-y-1.5">
        <div>
          <label className="mb-0.5 block text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Transcribed
          </label>
          <Textarea
            aria-label={`Cue ${index + 1} transcribed text`}
            className="min-h-[46px] resize-y text-xs leading-snug"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => onSelect(index)}
            onBlur={() => onCommitText(index, draft)}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Translation
          </label>
          <Textarea
            aria-label={`Cue ${index + 1} translated text`}
            className="min-h-[46px] resize-y border-l-2 border-signal/30 text-xs leading-snug placeholder:text-muted-foreground/30"
            rows={2}
            placeholder={bilingual ? "No translation yet" : "Translate or type manually"}
            value={translationDraft}
            onChange={(e) => setTranslationDraft(e.target.value)}
            onFocus={() => onSelect(index)}
            onBlur={() => onCommitTranslatedText(index, translationDraft)}
          />
        </div>
      </div>
    </div>
  )
}
