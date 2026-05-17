"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { Separator } from "@/components/ui/separator"
import { useSettingsStore, type Theme } from "@/store/useSettingsStore"

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
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Appearance and defaults persist via Tauri plugin-store.</p>
      </div>

      <section className="space-y-4" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="text-lg font-medium text-foreground">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground">Choose light, dark, or follow the system.</p>
        <RadioGroup
          value={theme}
          onValueChange={(v) => applyThemePreference(v as Theme, setTheme)}
          className="grid gap-3"
          aria-label="Color theme"
        >
          <div className="flex items-center gap-3">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light" className="cursor-pointer font-normal">
              Light
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark" className="cursor-pointer font-normal">
              Dark
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="system" id="theme-system" />
            <Label htmlFor="theme-system" className="cursor-pointer font-normal">
              System
            </Label>
          </div>
        </RadioGroup>
      </section>

      <Separator />

      <CaptionAppearanceSection />

      <Separator />

      <section className="space-y-4" aria-labelledby="defaults-heading">
        <h2 id="defaults-heading" className="text-lg font-medium text-foreground">
          Translation defaults
        </h2>
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      Examples: google, nllb, azure. Google works without an API key; add one in Models
                      for the official API.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="modelsDirOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Models directory override</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" placeholder="Leave empty for default" />
                    </FormControl>
                    <FormDescription>Optional absolute path. Clear the field to use the app default.</FormDescription>
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

      <Separator />

      <UpdatesSection />

      <Separator />

      <ModelsAndKeysPanel />

      <Separator />

      <DeveloperToolsPanel />
    </div>
  )
}
