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

type SectionHeaderProps = {
  id?: string
  icon: React.ReactNode
  eyebrow: string
  title: string
  description?: string
}

const SectionHeader = ({ id, icon, eyebrow, title, description }: SectionHeaderProps) => (
  <div className="flex items-start gap-3">
    <span
      className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center border border-border bg-card text-signal"
      aria-hidden
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 id={id} className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  </div>
)

const ThemeOption = ({
  value,
  label,
  description,
  current,
  onSelect,
}: {
  value: Theme
  label: string
  description: string
  current: Theme
  onSelect: (v: Theme) => void
}) => {
  const id = `theme-${value}`
  const active = current === value
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 border bg-card/40 p-3 transition-colors hover:bg-card",
        active ? "border-signal bg-signal-muted" : "border-border",
      )}
    >
      <RadioGroupItem value={value} id={id} className="mt-1" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onSelect(value)}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />
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
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1 w-8 bg-signal" aria-hidden />
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Preferences
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance, defaults, models, and updates. Persisted via Tauri plugin-store.
        </p>
      </header>

      {/* Appearance */}
      <section className="space-y-4" aria-labelledby="appearance-heading">
        <SectionHeader
          id="appearance-heading"
          icon={<Palette className="size-5" weight="duotone" />}
          eyebrow="Appearance"
          title="Theme"
          description="Choose light, dark, or follow the system."
        />
        <RadioGroup
          value={theme}
          onValueChange={(v) => applyThemePreference(v as Theme, setTheme)}
          className="grid gap-3 sm:grid-cols-3"
          aria-label="Color theme"
        >
          <ThemeOption
            value="light"
            label="Light"
            description="Soft paper with cyan accent."
            current={theme}
            onSelect={(v) => applyThemePreference(v, setTheme)}
          />
          <ThemeOption
            value="dark"
            label="Dark"
            description="Deep cool surface, low glare."
            current={theme}
            onSelect={(v) => applyThemePreference(v, setTheme)}
          />
          <ThemeOption
            value="system"
            label="System"
            description="Follow your OS preference."
            current={theme}
            onSelect={(v) => applyThemePreference(v, setTheme)}
          />
        </RadioGroup>
      </section>

      {/* Captions */}
      <section className="space-y-4" aria-labelledby="captions-heading">
        <SectionHeader
          icon={<PaintBrush className="size-5" weight="duotone" />}
          eyebrow="Captions"
          title="Caption overlay defaults"
          description="Defaults for typography and positioning. Per-project overrides live in the editor."
        />
        <div className="border-l-2 border-border pl-4">
          <CaptionAppearanceSection />
        </div>
      </section>

      {/* Translation defaults */}
      <section className="space-y-4" aria-labelledby="defaults-heading">
        <SectionHeader
          id="defaults-heading"
          icon={<Translate className="size-5" weight="duotone" />}
          eyebrow="Translation"
          title="Translation defaults"
          description="Provider and language defaults for new projects."
        />
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 border-l-2 border-border pl-4">
              <FormField
                control={form.control}
                name="defaultTranslatorProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default translator provider</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" placeholder="nllb" />
                    </FormControl>
                    <FormDescription>
                      Examples: google, deepseek, nllb, azure. Google works without an API key; DeepSeek
                      requires an API key under Models and keys.
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
                      <FormLabel>Default source language</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" placeholder="auto" />
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
                      <FormLabel>Default target language</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" placeholder="mn" />
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
                    <FormLabel>Models directory override</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" placeholder="Leave empty for default" />
                    </FormControl>
                    <FormDescription>
                      Optional absolute path. Clear the field to use the app default.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="default">
                Save preferences
              </Button>
            </form>
          </Form>
        )}
      </section>

      {/* Updates */}
      <section className="space-y-4" aria-labelledby="updates-heading">
        <SectionHeader
          id="updates-heading"
          icon={<Download className="size-5" weight="duotone" />}
          eyebrow="Updates"
          title="App updates"
          description="Check for signed releases from GitHub."
        />
        <div className="border-l-2 border-border pl-4">
          <UpdatesSection />
        </div>
      </section>

      {/* Models & keys */}
      <section className="space-y-4" aria-labelledby="models-keys-heading">
        <SectionHeader
          id="models-keys-heading"
          icon={<Cloud className="size-5" weight="duotone" />}
          eyebrow="Models · API keys"
          title="Local models and cloud keys"
          description="Whisper GGML weights, NLLB translation bundles, and provider API keys."
        />
        <div className="border-l-2 border-border pl-4">
          <ModelsAndKeysPanel />
        </div>
      </section>

      {/* Developer */}
      <section className="space-y-4" aria-labelledby="dev-heading">
        <SectionHeader
          id="dev-heading"
          icon={<Code className="size-5" weight="duotone" />}
          eyebrow="Developer"
          title="Smoke tools"
          description="Direct Rust integration calls. For debugging only."
        />
        <div className="border-l-2 border-border pl-4">
          <DeveloperToolsPanel />
        </div>
      </section>
    </div>
  )
}
