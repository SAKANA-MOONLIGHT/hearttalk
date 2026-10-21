import { STAGES, Topic } from '../topics';
import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
import { Locale } from './strings';

export interface StageCopy {
  name: string;
  subtitle: string;
  hints: string[];
  topics: string[];
}

export const content: Record<Locale, StageCopy[]> = { zh: STAGES, en, ja, ko };

// Identity, ordering and colors come from the original data in every language.
export function localizedStage(month: number, locale: Locale) {
  const index = Math.min(Math.max(month, 1), 12) - 1;
  return { ...STAGES[index], ...content[locale][index] };
}

export function localizedTopic(topic: Topic, locale: Locale): string {
  return content[locale][topic.month - 1].topics[topic.indexInMonth - 1];
}

export function localizedHint(topic: Topic, locale: Locale): string {
  const stage = localizedStage(topic.month, locale);
  return stage.hints[topic.id % stage.hints.length];
}
