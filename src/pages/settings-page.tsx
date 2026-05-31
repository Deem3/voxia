"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  CloudIcon as Cloud,
  CodeIcon as Code,
  DownloadIcon as Download,
  PaintBrushIcon as PaintBrush,
  PaletteIcon as Palette,
  TranslateIcon as Translate,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DeveloperToolsPanel } from "@/components/developer-tools-panel"
import { CaptionAppearanceSection } from "@/features/settings/caption-appearance-section"
import { ModelsAndKeysPanel } from "@/features/settings/models-and-keys-panel"
import { UpdatesSection } from "@/features/settings/updates-section"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useSettingsStore, type Theme } from "@/store/useSettingsStore"
import { cn } from "@/lib/utils"

const preferencesSchema = z.object({
  defaultTranslatorProvider: z.string().min(1, "Required"),
  defaultSourceLang: z.string(),
  defaultTargetLang: z.string(),
  modelsDirOverride: z.string(),
})
type PreferencesForm = z.infer<typeof preferencesSchema>

const applyThemePreference = (value: Theme, setNextTheme: (t: string) => void) => {
  setNextTheme(value)
  useSettingsStore.getState().setTheme(value)
}

type SectionProps = {
  id?: string
  icon: React.ReactNode
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
  index?: number
}

const Section = ({ id, icon, eyebrow, title, description, children, index = 0 }: SectionProps) => {
  const delayMap = ["delay-0", "delay-50", "delay-75", "delay-100", "delay-125", "delay-150", "delay-175", "delay-200"]
  const delay = delayMap[index] ?? "delay-200"

  return (
    <section
      className={cn("space-y-5 animate-fade-up", delay)}
      aria-labelledby={id ?? `section-${index}`}
    >
      {/* Section header */}
      <div className="flex items-start gap-3">
        <span className={cn(
          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center",
          "border border-border/60 bg-signal-muted text-signal",
        )}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-signal/70">
            {eyebrow}
          </p>
          <h2 id={id ?? `section-${index}`} className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground/70">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Section content */}
      <div className="border-l border-border/40 pl-4 space-y-4">
        {children}
      </div>
    </section>
  )
}

const ThemeOption = ({
  value,
  label,
  description,
  current,
}: {
  value: Theme
  label: string
  description: string
  current: Theme
}) => {
  const id = `theme-${value}`
  const active = current === value
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 border bg-card/30 p-3",
        "transition-all duration-150 hover:bg-card/60",
        active
          ? "border-signal/40 bg-signal-muted/50"
          : "border-border/50 hover:border-border",
      )}
    >
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <div className="space-y-0.5 min-w-0">
        <p className={cn(
          "text-xs font-semibold transition-colors",
          active ? "text-signal" : "text-foreground",
        )}>
          {label}
        </p>
        <p className="text-[0.65rem] text-muted-foreground/70">{description}</p>
      </div>
    </Label>
  )
}

export const SettingsPage = () => {
  const hydrated = useSettingsStore((s) => s.hydrated)
  const theme = useSettingsStore((s) => s.theme)
  const defaultTranslatorProvider = useSettingsStore((s) => s.defaultTranslatorProvider)
  const defaultSourceLang = useSettingsStore((s) => s.defaultSourceLang)
  const defaultTargetLang = useSettingsStore((s) => s.defaultTargetLang)
  const modelsDirOverride = useSettingsStore((s) => s.modelsDirOverride)
  const setDefaultTranslatorProvider = useSettingsStore((s) => s.setDefaultTranslatorProvider)
  const setDefaultSourceLang = useSettingsStore((s) => s.setDefaultSourceLang)
  const setDefaultTargetLang = useSettingsStore((s) => s.setDefaultTargetLang)
  const setModelsDirOverride = useSettingsStore((s) => s.setModelsDirOverride)
  const developerMode = useSettingsStore((s) => s.developerMode)
  const setDeveloperMode = useSettingsStore((s) => s.setDeveloperMode)

  const { setTheme } = useTheme()

  const form = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultTranslatorProvider,
      defaultSourceLang,
      defaultTargetLang,
      modelsDirOverride: modelsDirOverride ?? "",
    },
  })

  useEffect(() => {
    if (!hydrated) return
    form.reset({
      defaultTranslatorProvider,
      defaultSourceLang,
      defaultTargetLang,
      modelsDirOverride: modelsDirOverride ?? "",
    })
  }, [hydrated, defaultTranslatorProvider, defaultSourceLang, defaultTargetLang, modelsDirOverride, form])

  const handleSubmit = (values: PreferencesForm) => {
    setDefaultTranslatorProvider(values.defaultTranslatorProvider)
    setDefaultSourceLang(values.defaultSourceLang)
    setDefaultTargetLang(values.defaultTargetLang)
    setModelsDirOverride(values.modelsDirOverride.trim() === "" ? null : values.modelsDirOverride.trim())
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">

      {/* ── Page hero ── */}
      <header className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-[2px] w-6 rounded-full bg-signal" aria-hidden />
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-signal/80">
            Preferences
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground/70">
          Appearance, translation defaults, models, and updates.
        </p>
      </header>

      {/* ── Appearance ── */}
      <Section
        id="appearance-heading"
        icon={<Palette className="size-4" weight="duotone" />}
        eyebrow="Appearance"
        title="Theme"
        description="Choose light, dark, or follow your system preference."
        index={0}
      >
        <RadioGroup
          value={theme}
          onValueChange={(v) => applyThemePreference(v as Theme, setTheme)}
          className="grid gap-2 sm:grid-cols-3"
          aria-label="Color theme"
        >
          <ThemeOption value="light" label="Light" description="Soft paper with cyan accent." current={theme} />
          <ThemeOption value="dark" label="Dark" description="Deep cool surface, low glare." current={theme} />
          <ThemeOption value="system" label="System" description="Follow your OS preference." current={theme} />
        </RadioGroup>
      </Section>

      {/* ── Captions ── */}
      <Section
        icon={<PaintBrush className="size-4" weight="duotone" />}
        eyebrow="Captions"
        title="Caption overlay defaults"
        description="Global defaults for typography and positioning. Projects can override these."
        index={1}
      >
        <CaptionAppearanceSection />
      </Section>

      {/* ── Translation defaults ── */}
      <Section
        id="defaults-heading"
        icon={<Translate className="size-4" weight="duotone" />}
        eyebrow="Translation"
        title="Translation defaults"
        description="Provider and language defaults applied when opening the editor."
        index={2}
      >
        {!hydrated ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/30 shimmer" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="defaultTranslatorProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Default provider</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder="google"
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[0.65rem]">
                      google · deepseek · nllb · azure. Google works without an API key.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defaultSourceLang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Source language</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" placeholder="auto" className="font-mono text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTargetLang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Target language</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" placeholder="mn" className="font-mono text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="modelsDirOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Models directory override</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder="Leave empty for app default"
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[0.65rem]">
                      Absolute path. Clear to use the default app data directory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default" size="sm">
                Save preferences
              </Button>
            </form>
          </Form>
        )}
      </Section>

      {/* ── Updates ── */}
      <Section
        id="updates-heading"
        icon={<Download className="size-4" weight="duotone" />}
        eyebrow="Updates"
        title="App updates"
        description="Signed releases from GitHub Releases."
        index={3}
      >
        <UpdatesSection />
      </Section>

      {/* ── Models & keys ── */}
      <Section
        id="models-keys-heading"
        icon={<Cloud className="size-4" weight="duotone" />}
        eyebrow="Models · API keys"
        title="Local models and cloud keys"
        description="Whisper GGML weights, NLLB translation bundles, and provider API keys."
        index={4}
      >
        <ModelsAndKeysPanel />
      </Section>

      {/* ── Developer ── */}
      <Section
        id="dev-heading"
        icon={<Code className="size-4" weight="duotone" />}
        eyebrow="Developer"
        title="Developer options"
        description="Enable to reveal low-level debugging tools."
        index={5}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">Developer mode</p>
            <p className="text-[0.65rem] text-muted-foreground/70">Show smoke tools and Rust integration calls.</p>
          </div>
          <Switch
            checked={developerMode}
            onCheckedChange={setDeveloperMode}
            aria-label="Toggle developer mode"
          />
        </div>
        {developerMode && (
          <div className="mt-4 space-y-4 border-t border-border/40 pt-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-signal/70">Smoke tools</p>
            <DeveloperToolsPanel />
          </div>
        )}
      </Section>
    </div>
  )
}
