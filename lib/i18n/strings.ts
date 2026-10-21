export const languages = [
  { code: 'zh', name: '中文', tag: 'zh-CN' },
  { code: 'en', name: 'English', tag: 'en-US' },
  { code: 'ja', name: '日本語', tag: 'ja-JP' },
  { code: 'ko', name: '한국어', tag: 'ko-KR' },
] as const;
export type Locale = (typeof languages)[number]['code'];

const zh = {
  appName: '心动话题', slogan: '366 天，从心动到相守',
  featureTopics: '31 个暧昧话题，335 个情侣话题，慢慢走近彼此。',
  featureStages: '12 个主题自由选择，按你们的节奏聊。',
  featureHints: '随机抽取不重复，每个话题都有开场提示。',
  featureSave: '历史和收藏自动保存在这台设备上。',
  start: '开启我们的 366 天', welcomeHint: '今天，就是故事的第 1 天',
  language: '语言', languageHint: '界面和全部话题会一起切换。', close: '关闭',
  month: '第 {n} 月', day: '第 {n} / 366 天', question: '第 {n} 题',
  flirting: '暧昧篇', couple: '情侣篇',
  placeholder: '准备好更了解彼此了吗？点击下方按钮，抽取一个话题。',
  hintTitle: '如何自然开启', hint: '开场提示', hideHint: '收起提示',
  save: '收藏话题', unsave: '取消收藏', draw: '抽取话题', drawAgain: '再聊一个话题',
  remaining: '还有 {n} 个话题可以聊', exhausted: '这个主题已聊完，试试其他主题吧。',
  complete: '「{name}」已全部聊完。换个主题，继续你们的故事吧。',
  history: '历史记录', favorites: '我的收藏', journey: '我们的旅程',
  emptyHistory: '还没有聊天记录。抽取第一个话题，开始你们的故事吧。',
  emptyFavorites: '点一下话题上的爱心，把想再聊的话题留在这里。',
  days: '当前天数', discussed: '已聊话题', saved: '收藏话题', left: '剩余话题',
  chooseStage: '点击选择这个主题', started: '旅程始于 {date}',
  reset: '重新开始旅程', resetTitle: '重新开始旅程？',
  resetBody: '将清空这台设备上的历史、收藏与进度，从第 1 天重新开始。语言设置会保留。',
  cancel: '取消', confirmReset: '确认重置', loading: '正在准备你们的话题…',
  storageError: '暂时无法保存，请检查设备空间后重试。', retry: '重试',
};
export type MessageKey = keyof typeof zh;
export const messages: Record<Locale, Record<MessageKey, string>> = {
  zh,
  en: {
    appName: 'HeartTalk', slogan: '366 days of growing closer',
    featureTopics: '31 flirty questions and 335 couple questions to discover each other.',
    featureStages: 'Choose from 12 themes and go at your own pace.',
    featureHints: 'No repeats, with a conversation starter for every question.',
    featureSave: 'Your history and favorites stay saved on this device.',
    start: 'Begin our 366 days', welcomeHint: 'Your first day starts here',
    language: 'Language', languageHint: 'Changes the interface and every question.', close: 'Close',
    month: 'Month {n}', day: 'Day {n} of 366', question: 'Question {n}',
    flirting: 'Getting closer', couple: 'Together',
    placeholder: 'Ready to know each other better? Draw a question to start a conversation.',
    hintTitle: 'Start the conversation', hint: 'Show hint', hideHint: 'Hide hint',
    save: 'Save question', unsave: 'Remove favorite', draw: 'Draw a question', drawAgain: 'Another question',
    remaining: '{n} questions left to explore', exhausted: 'You have explored this theme. Try another one.',
    complete: 'You have explored every question in “{name}”. Choose another theme to keep talking.',
    history: 'History', favorites: 'Favorites', journey: 'Our journey',
    emptyHistory: 'Your story starts with a question. Draw your first one to begin.',
    emptyFavorites: 'Tap the heart on a question to keep it here for another conversation.',
    days: 'Current day', discussed: 'Explored', saved: 'Favorites', left: 'Remaining',
    chooseStage: 'Tap to choose this theme', started: 'Started on {date}',
    reset: 'Start over', resetTitle: 'Start a new journey?',
    resetBody: 'This clears history, favorites and progress on this device. Your language choice stays saved.',
    cancel: 'Cancel', confirmReset: 'Reset journey', loading: 'Getting your questions ready…',
    storageError: 'Could not save. Check your device storage and try again.', retry: 'Try again',
  },
  ja: {
    appName: 'ふたりの話題', slogan: '366 日、少しずつ近づくふたり',
    featureTopics: '恋が始まる 31 問と、恋人同士で話す 335 問。',
    featureStages: '12 のテーマから、ふたりのペースで選べます。',
    featureHints: '同じ質問は出ません。会話のきっかけも用意しました。',
    featureSave: '履歴とお気に入りは、この端末に保存されます。',
    start: 'ふたりの 366 日を始める', welcomeHint: '今日が、物語の 1 日目',
    language: '言語', languageHint: '画面とすべての質問の言語が切り替わります。', close: '閉じる',
    month: '{n} か月目', day: '366 日のうち {n} 日目', question: '{n} 問目',
    flirting: '恋の始まり', couple: '恋人同士',
    placeholder: 'お互いのこと、もっと知ってみませんか？ボタンを押して、会話を始めましょう。',
    hintTitle: '会話のきっかけ', hint: 'ヒントを見る', hideHint: 'ヒントを閉じる',
    save: 'お気に入りに追加', unsave: 'お気に入りから削除', draw: '話題を引く', drawAgain: '次の話題を引く',
    remaining: 'まだ話していない質問が {n} 問あります', exhausted: 'このテーマはすべて話しました。別のテーマもどうぞ。',
    complete: '「{name}」の質問はすべて話しました。別のテーマで、ふたりの話を続けましょう。',
    history: '履歴', favorites: 'お気に入り', journey: 'ふたりの歩み',
    emptyHistory: '履歴はまだありません。最初の質問を引いてみましょう。',
    emptyFavorites: '質問のハートを押すと、また話したい話題をここに残せます。',
    days: '今日の日数', discussed: '話した質問', saved: 'お気に入り', left: '残りの質問',
    chooseStage: 'タップしてテーマを選択', started: '{date} にスタート',
    reset: '最初から始める', resetTitle: '新しく始めますか？',
    resetBody: 'この端末の履歴、お気に入り、進捗を削除し、1 日目から始めます。言語設定は残ります。',
    cancel: 'キャンセル', confirmReset: 'リセットする', loading: '話題を準備しています…',
    storageError: '保存できませんでした。端末の空き容量を確認し、もう一度お試しください。', retry: '再試行',
  },
  ko: {
    appName: '우리의 대화', slogan: '366일, 조금씩 더 가까워지는 우리',
    featureTopics: '설레는 썸 질문 31개와 연인을 위한 질문 335개.',
    featureStages: '12가지 테마 중 우리에게 맞는 주제를 골라요.',
    featureHints: '질문은 중복 없이, 대화를 여는 힌트와 함께 나와요.',
    featureSave: '기록과 즐겨찾기는 이 기기에 저장돼요.',
    start: '우리의 366일 시작하기', welcomeHint: '오늘이 우리 이야기의 첫날이에요',
    language: '언어', languageHint: '화면과 모든 질문의 언어가 함께 바뀌어요.', close: '닫기',
    month: '{n}개월째', day: '366일 중 {n}일째', question: '{n}번째 질문',
    flirting: '설레는 시작', couple: '연인 사이',
    placeholder: '서로를 더 알아갈 준비가 됐나요? 질문을 뽑아 이야기를 시작해 보세요.',
    hintTitle: '이렇게 대화를 열어 보세요', hint: '힌트 보기', hideHint: '힌트 닫기',
    save: '즐겨찾기에 추가', unsave: '즐겨찾기 해제', draw: '질문 뽑기', drawAgain: '다음 질문 뽑기',
    remaining: '아직 나눌 질문이 {n}개 남았어요', exhausted: '이 테마의 질문을 모두 나눴어요. 다른 테마를 골라 보세요.',
    complete: '「{name}」의 질문을 모두 나눴어요. 다른 테마로 우리 이야기를 이어 가요.',
    history: '대화 기록', favorites: '즐겨찾기', journey: '우리의 여정',
    emptyHistory: '아직 대화 기록이 없어요. 첫 질문으로 우리 이야기를 시작해 보세요.',
    emptyFavorites: '질문의 하트를 누르면 다시 나누고 싶은 이야기를 여기에 모을 수 있어요.',
    days: '함께한 날', discussed: '나눈 질문', saved: '즐겨찾기', left: '남은 질문',
    chooseStage: '눌러서 테마 선택하기', started: '{date}에 시작했어요',
    reset: '처음부터 시작하기', resetTitle: '새로운 여정을 시작할까요?',
    resetBody: '이 기기의 기록, 즐겨찾기와 진행 상황을 지우고 첫날부터 시작해요. 언어 설정은 유지돼요.',
    cancel: '취소', confirmReset: '초기화하기', loading: '질문을 준비하고 있어요…',
    storageError: '저장하지 못했어요. 기기 저장 공간을 확인하고 다시 시도해 주세요.', retry: '다시 시도',
  },
};

export function resolveLocale(tag: string | null | undefined): Locale {
  const code = tag?.toLowerCase().split(/[-_]/)[0];
  return languages.some((item) => item.code === code) ? code as Locale : 'en';
}

export function translate(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}) {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

export function formatDate(iso: string, locale: Locale) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(languages.find((item) => item.code === locale)!.tag,
    { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month - 1, day));
}
