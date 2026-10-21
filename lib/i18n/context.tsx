import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { localizedHint, localizedStage, localizedTopic } from './content';
import { languages, Locale, MessageKey, resolveLocale, translate } from './strings';
import { STAGES, Topic } from '../topics';

export const LANGUAGE_KEY = '@hearttalk/language/v1';
const Context = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  ready: boolean;
  saveError: boolean;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const deviceLocales = useLocales();
  const [preference, setPreference] = useState<Locale | null>(null);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const writes = React.useRef(Promise.resolve());
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(LANGUAGE_KEY).then((value) => {
      if (mounted && languages.some((item) => item.code === value)) setPreference(value as Locale);
    }).catch(() => { if (mounted) setSaveError(true); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  const locale = preference ?? resolveLocale(deviceLocales[0]?.languageCode);
  const setLocale = (next: Locale) => {
    setPreference(next);
    writes.current = writes.current.catch(() => {}).then(() => AsyncStorage.setItem(LANGUAGE_KEY, next))
      .then(() => setSaveError(false)).catch(() => setSaveError(true));
  };
  return <Context.Provider value={{ locale, setLocale, ready, saveError }}>{children}</Context.Provider>;
}

export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error('I18nProvider is required');
  const { locale } = context;
  return {
    ...context,
    t: (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values),
    stages: useMemo(() => STAGES.map((stage) => localizedStage(stage.month, locale)), [locale]),
    stageForMonth: (month: number) => localizedStage(month, locale),
    topicText: (topic: Topic) => localizedTopic(topic, locale),
    hintForTopic: (topic: Topic) => localizedHint(topic, locale),
  };
}
