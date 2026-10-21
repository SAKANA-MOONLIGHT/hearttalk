import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ALL_TOPICS,
  MONTH_DAYS,
  TOTAL_DAYS,
  Topic,
  monthForDay,
  topicById,
} from './lib/topics';
import {
  AppState,
  DEFAULT_STATE,
  dayNumber,
  loadState,
  saveState,
  todayStr,
} from './lib/storage';
import { I18nProvider, useI18n } from './lib/i18n/context';
import { formatDate } from './lib/i18n/strings';
import { LanguagePicker } from './components/LanguagePicker';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function haptic(kind: 'light' | 'medium' | 'success') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(
        kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    }
  } catch {
    // 设备不支持震动时忽略
  }
}

// ---------- 通用小组件 ----------

function ScalePressable({
  onPress,
  style,
  containerStyle,
  disabled = false,
  children,
}: {
  onPress: () => void;
  style?: object;
  containerStyle?: object;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={containerStyle}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.94, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '88', backgroundColor: color + '1f' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

// ---------- 主题选择器 ----------

function ThemeSelector({ month, onSelect }: { month: number; onSelect: (m: number) => void }) {
  const { stages, t, locale } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<number, number>>({});
  const [layoutVersion, setLayoutVersion] = useState(0);
  const { fontScale } = useWindowDimensions();

  // 自动滚动到当前选中的主题，保证它始终可见
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: Math.max(0, (positions.current[month] ?? 0) - 24),
      animated: true,
    });
  }, [month, locale, fontScale, layoutVersion]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.themeScroll}
      contentContainerStyle={styles.themeScrollContent}
    >
      {stages.map((s) => {
        const active = s.month === month;
        return (
          <Pressable
            key={s.month}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            aria-pressed={active}
            accessibilityLabel={`${t('month', { n: s.month })}, ${s.name}`}
            onLayout={(event) => {
              const x = event.nativeEvent.layout.x;
              if (positions.current[s.month] !== x) {
                positions.current[s.month] = x;
                setLayoutVersion((value) => value + 1);
              }
            }}
            onPress={() => onSelect(s.month)}
            style={[
              styles.themeChip,
              active && { backgroundColor: s.accent + '33', borderColor: s.accent },
            ]}
          >
            <Text
              style={[styles.themeChipMonth, active && { color: s.accent }]}
            >
              {t('month', { n: s.month })}
            </Text>
            <Text
              style={[styles.themeChipName, active && { color: '#fff' }]}
            >
              {s.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------- 欢迎页 ----------

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    Animated.timing(fade, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active && !reduced) loop.start();
    });
    return () => { active = false; loop.stop(); fade.stopAnimation(); };
  }, [fade, float]);

  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <Animated.View style={{ flex: 1, opacity: fade }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.welcome,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 },
        ]}
      >
      <View style={{ alignSelf: 'flex-end', marginBottom: 28 }}><LanguagePicker /></View>
      <Animated.View style={[styles.logoCircle, { transform: [{ translateY: ty }] }]}>
        <Text style={styles.logoEmoji}>💞</Text>
      </Animated.View>
      <Text style={styles.welcomeTitle}>{t('appName')}</Text>
      <Text style={styles.welcomeSlogan}>{t('slogan')}</Text>

      <View style={styles.featureBox}>
        {[
          ['🌙', t('featureTopics')],
          ['🎯', t('featureStages')],
          ['🎲', t('featureHints')],
          ['📖', t('featureSave')],
        ].map(([icon, text]) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1, minHeight: 28 }} />
      <ScalePressable
        containerStyle={{ alignSelf: 'stretch' }}
        style={styles.primaryBtn}
        onPress={() => {
          haptic('success');
          onStart();
        }}
      >
        <LinearGradient
          colors={['#ff7eb3', '#ff4f81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryBtnInner}
        >
          <Text style={styles.primaryBtnText}>
            {t('start')}
          </Text>
        </LinearGradient>
      </ScalePressable>
        <Text style={styles.welcomeHint}>{t('welcomeHint')}</Text>
      </ScrollView>
    </Animated.View>
  );
}

// ---------- 话题卡片 ----------

function TopicCard({
  topic,
  notice,
  accent,
  isFav,
  showHint,
  onToggleFav,
  onToggleHint,
  anim,
}: {
  topic: Topic | null;
  notice: string | null;
  accent: string;
  isFav: boolean;
  showHint: boolean;
  onToggleFav: () => void;
  onToggleHint: () => void;
  anim: Animated.Value;
}) {
  const { t, stageForMonth, topicText, hintForTopic } = useI18n();
  const stage = topic ? stageForMonth(topic.month) : null;
  // 卡片内部配色跟随话题自己所属的主题，避免切换主题后颜色错乱
  const cardAccent = stage ? stage.accent : accent;
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '0deg'] });

  return (
    <Animated.View
      style={[styles.card, { opacity: anim, transform: [{ translateY: ty }, { rotate: rot }] }]}
    >
      <Text style={[styles.quoteMark, { color: cardAccent }]}>“</Text>
      {topic && stage ? (
        <>
          <Text style={styles.cardText} selectable>{topicText(topic)}</Text>
          {showHint && (
            <View style={[styles.hintBox, { borderColor: cardAccent + '55' }]}>
              <Text style={[styles.hintTitle, { color: cardAccent }]}>{t('hintTitle')}</Text>
              <Text style={styles.hintText}>{hintForTopic(topic)}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              {stage.name} · {t('question', { n: topic.indexInMonth })}
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showHint }}
                aria-expanded={showHint}
                accessibilityLabel={t(showHint ? 'hideHint' : 'hint')}
                hitSlop={8}
                onPress={onToggleHint}
                style={[
                  styles.hintBtn,
                  { borderColor: cardAccent + '77' },
                  showHint && { backgroundColor: cardAccent + '26' },
                ]}
              >
                <Text style={[styles.hintBtnText, { color: cardAccent }]}>
                  {t(showHint ? 'hideHint' : 'hint')}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t(isFav ? 'unsave' : 'save')}
                accessibilityState={{ selected: isFav }} aria-pressed={isFav} style={styles.favButton} onPress={onToggleFav}>
                <Text
                  style={[styles.favIcon, { color: isFav ? '#ff4f81' : 'rgba(255,255,255,0.45)' }]}
                >
                  {isFav ? '♥' : '♡'}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.cardPlaceholder}>
            {notice ?? t('placeholder')}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>{t('appName')}</Text>
          </View>
        </>
      )}
    </Animated.View>
  );
}

// ---------- 列表弹窗（历史 / 收藏） ----------

function ListModal({
  visible,
  initialTab,
  state,
  onClose,
  onToggleFav,
}: {
  visible: boolean;
  initialTab: 'history' | 'favs';
  state: AppState;
  onClose: () => void;
  onToggleFav: (id: number) => void;
}) {
  const { t, locale, topicText, stageForMonth } = useI18n();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'history' | 'favs'>(initialTab);
  useEffect(() => {
    if (visible) setTab(initialTab);
  }, [visible, initialTab]);

  const data = useMemo(() => {
    if (tab === 'history') return state.history;
    return [...state.favs].reverse().map((id) => ({ id, date: '' }));
  }, [tab, state]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalMask}>
        <Pressable style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={t('close')} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.tabRow}>
            {(
              [
                ['history', `${t('history')} (${state.history.length})`],
                ['favs', `${t('favorites')} (${state.favs.length})`],
              ] as const
            ).map(([key, label]) => (
              <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} aria-selected={tab === key} onPress={() => setTab(key)} style={styles.tabBtn}>
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                {tab === key && <View style={styles.tabUnderline} />}
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel={t('close')} style={styles.favButton} onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          {data.length === 0 ? (
            <ScrollView contentContainerStyle={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>{tab === 'history' ? '🫧' : '🤍'}</Text>
              <Text style={styles.emptyText}>
                {t(tab === 'history' ? 'emptyHistory' : 'emptyFavorites')}
              </Text>
            </ScrollView>
          ) : (
            <FlatList
              data={data}
              extraData={`${locale}-${state.favs.join(',')}`}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const topicItem = topicById(item.id);
                if (!topicItem) return null;
                const stage = stageForMonth(topicItem.month);
                const fav = state.favs.includes(topicItem.id);
                return (
                  <View style={styles.listItem}>
                    <View style={styles.listItemTop}>
                      <Chip label={`${t('month', { n: topicItem.month })} · ${stage.name}`} color={stage.accent} />
                      {!!item.date && <Text style={styles.listDate}>{item.date}</Text>}
                      <Pressable accessibilityRole="button" accessibilityLabel={t(fav ? 'unsave' : 'save')}
                        accessibilityState={{ selected: fav }} aria-pressed={fav} style={styles.favButton} onPress={() => onToggleFav(topicItem.id)}>
                        <Text
                          style={[
                            styles.listFav,
                            { color: fav ? '#ff4f81' : 'rgba(255,255,255,0.35)' },
                          ]}
                        >
                          {fav ? '♥' : '♡'}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={styles.listText}>{topicText(topicItem)}</Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ---------- 旅程信息弹窗 ----------

function JourneyModal({
  visible,
  state,
  day,
  month,
  onSelectMonth,
  onClose,
  onReset,
}: {
  visible: boolean;
  state: AppState;
  day: number;
  month: number;
  onSelectMonth: (m: number) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const { t, locale, stages } = useI18n();
  const insets = useSafeAreaInsets();
  const [resetVisible, setResetVisible] = useState(false);
  useEffect(() => { if (!visible) setResetVisible(false); }, [visible]);

  const confirmReset = () => {
    if (Platform.OS === 'web') { setResetVisible(true); return; }
    Alert.alert(t('resetTitle'), t('resetBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirmReset'), style: 'destructive', onPress: onReset },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalMask}>
        <Pressable style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={t('close')} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.tabRow}>
            <Text style={styles.journeyTitle}>{t('journey')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('close')} style={styles.favButton} onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          <View style={styles.statRow}>
            {(
              [
                [`${day}`, t('days')],
                [`${state.used.length}`, t('discussed')],
                [`${state.favs.length}`, t('saved')],
                [`${TOTAL_DAYS - state.used.length}`, t('left')],
              ] as const
            ).map(([num, label]) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statNum}>{num}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {stages.map((s) => {
              const current = s.month === month;
              const usedInMonth = state.used.filter(
                (id) => ALL_TOPICS[id]?.month === s.month
              ).length;
              return (
                <Pressable
                  key={s.month}
                  accessibilityRole="button"
                  accessibilityState={{ selected: current }}
                  aria-pressed={current}
                  accessibilityHint={t('chooseStage')}
                  style={[styles.stageRow, current && styles.stageRowCurrent]}
                  onPress={() => {
                    onSelectMonth(s.month);
                    onClose();
                  }}
                >
                  <View style={[styles.stageDot, { backgroundColor: s.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageName}>
                      {t('month', { n: s.month })} · {s.name}
                    </Text>
                    <Text style={styles.stageSub}>{s.subtitle}</Text>
                  </View>
                  <Text style={[styles.stageCount, { color: s.accent }]}>
                    {usedInMonth}/{MONTH_DAYS[s.month - 1]}
                  </Text>
                </Pressable>
              );
            })}
              <View>
                <Text style={styles.journeyStart}>
                  {t('started', { date: state.startDate ? formatDate(state.startDate, locale) : '—' })}
                </Text>
                <Pressable accessibilityRole="button" style={styles.resetBtn} onPress={confirmReset}>
                  <Text style={styles.resetText}>{t('reset')}</Text>
                </Pressable>
                {resetVisible && <View style={styles.hintBox}>
                  <Text style={styles.stageName}>{t('resetTitle')}</Text>
                  <Text style={styles.hintText}>{t('resetBody')}</Text>
                  <View style={styles.cardActions}>
                    <Pressable style={styles.hintBtn} accessibilityRole="button" onPress={() => setResetVisible(false)}>
                      <Text style={styles.hintText}>{t('cancel')}</Text>
                    </Pressable>
                    <Pressable style={styles.resetBtn} accessibilityRole="button" onPress={onReset}>
                      <Text style={styles.resetText}>{t('confirmReset')}</Text>
                    </Pressable>
                  </View>
                </View>}
              </View>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------- 主界面 ----------

function Main() {
  const { t, stageForMonth, ready, saveError: languageSaveError } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const [state, setState] = useState<AppState | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const [noticeMonth, setNotice] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  const mounted = useRef(true);
  const reducedMotion = useRef(false);
  const [listVisible, setListVisible] = useState(false);
  const [listTab, setListTab] = useState<'history' | 'favs'>('history');
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const cardAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void loadState().then((loaded) => { stateRef.current = loaded; setState(loaded); });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { reducedMotion.current = value; });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => { reducedMotion.current = value; });
    mounted.current = true;
    return () => { mounted.current = false; cardAnim.stopAnimation(); subscription.remove(); };
  }, []);

  const update = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
    void saveState(next).then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, []);

  const animateCard = useCallback(
    (midway: () => void) => {
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: reducedMotion.current ? 0 : 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (!finished || !mounted.current) return;
        midway();
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: reducedMotion.current ? 0 : 420,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start(() => { drawingRef.current = false; setDrawing(false); });
      });
    },
    [cardAnim]
  );

  if (!state || !ready) {
    return <View style={styles.loading}><ActivityIndicator color="#ff9ec7" />
      <Text style={styles.hintText}>{t('loading')}</Text></View>;
  }

  const started = !!state.startDate;
  const day = started ? dayNumber(state.startDate!) : 1;
  // 玩家自由选择主题；未选择时默认跟随真实日期所在的月份
  const month =
    state.selectedMonth != null && state.selectedMonth >= 1 && state.selectedMonth <= 12
      ? state.selectedMonth
      : monthForDay(day);
  const stage = stageForMonth(month);
  const notice = noticeMonth === null ? null : t('complete', { name: stageForMonth(noticeMonth).name });
  const usedSet = new Set(state.used);
  const monthPool = ALL_TOPICS.filter((t) => t.month === month && !usedSet.has(t.id));
  const currentTopic = state.lastTopicId != null ? topicById(state.lastTopicId) ?? null : null;

  const selectMonth = (m: number) => {
    if (m === month) return;
    haptic('light');
    setNotice(null);
    update({ ...state, selectedMonth: m });
  };

  const draw = () => {
    if (drawingRef.current) return;
    drawingRef.current = true;
    setDrawing(true);
    if (monthPool.length === 0) {
      haptic('light');
      animateCard(() => {
        setNotice(month);
        if (stateRef.current) update({ ...stateRef.current, lastTopicId: null });
      });
      return;
    }
    haptic('medium');
    const pick = monthPool[Math.floor(Math.random() * monthPool.length)];
    animateCard(() => {
      setNotice(null);
      setShowHint(false);
      const latest = stateRef.current;
      if (latest) {
        update({ ...latest, used: [...latest.used, pick.id],
          history: [{ id: pick.id, date: todayStr() }, ...latest.history], lastTopicId: pick.id });
      }
    });
  };

  const toggleFav = (id: number) => {
    haptic('light');
    const favs = state.favs.includes(id)
      ? state.favs.filter((f) => f !== id)
      : [...state.favs, id];
    update({ ...state, favs });
  };

  const progress = day / TOTAL_DAYS;

  return (
    <LinearGradient colors={stage.gradient} style={{ flex: 1 }}>
      <StatusBar style="light" />
      {(saveError || languageSaveError) && <View style={[styles.errorBanner, { paddingTop: insets.top + 8 }]}>
        <Text accessibilityRole="alert" style={styles.hintText}>{t('storageError')}</Text>
        {saveError && <Pressable accessibilityRole="button" onPress={() => update(state)} style={styles.hintBtn}>
          <Text style={styles.hintText}>{t('retry')}</Text></Pressable>}
      </View>}
      {!started ? (
        <WelcomeScreen onStart={() => update({ ...state, startDate: todayStr() })} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[
          styles.mainContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}>
          {/* 顶部栏 */}
          <View style={styles.header}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.appName}>{t('appName')}</Text>
              <Text style={styles.dayText}>
                {t('day', { n: day })}
              </Text>
            </View>
            <LanguagePicker />
            <Pressable accessibilityRole="button" accessibilityLabel={t('journey')} style={styles.iconBtn} onPress={() => setJourneyVisible(true)}>
              <Text style={styles.iconBtnText}>🧭</Text>
            </Pressable>
          </View>

          {/* 进度条 */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: stage.accent },
              ]}
            />
          </View>

          {/* 主题选择器（自由切换，无锁定） */}
          <ThemeSelector month={month} onSelect={selectMonth} />

          {/* 阶段信息 */}
          <View style={styles.stageBanner}>
            <Chip label={t(month === 1 ? 'flirting' : 'couple')} color={stage.accent} />
            <Text style={styles.stageBannerSub}>
              {stage.subtitle}
            </Text>
          </View>

          {/* 话题卡片（可滚动：内容超出时自动滚动而不是被裁切） */}
          <View
            style={styles.cardWrap}
          >
            <TopicCard
              topic={notice ? null : currentTopic}
              notice={notice}
              accent={stage.accent}
              isFav={currentTopic ? state.favs.includes(currentTopic.id) : false}
              showHint={showHint}
              onToggleFav={() => currentTopic && toggleFav(currentTopic.id)}
              onToggleHint={() => {
                haptic('light');
                setShowHint((v) => !v);
              }}
              anim={cardAnim}
            />
          </View>

          {/* 抽取按钮 */}
          <View style={{ paddingHorizontal: 24 }}>
            <ScalePressable style={styles.primaryBtn} disabled={drawing} onPress={draw}>
              <LinearGradient
                colors={['#ff7eb3', '#ff4f81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText}>
                  {t(currentTopic ? 'drawAgain' : 'draw')}
                </Text>
              </LinearGradient>
            </ScalePressable>
            <Text style={styles.remainText}>
              {monthPool.length > 0
                ? t('remaining', { n: monthPool.length })
                : t('exhausted')}
            </Text>
          </View>

          {/* 底部操作 */}
          <View style={[styles.bottomRow, (width < 350 || fontScale > 1.4) && { flexDirection: 'column' }]}>
            {(
              [
                ['🕰️', t('history'), 'history'],
                ['💖', t('favorites'), 'favs'],
              ] as const
            ).map(([icon, label, tab]) => (
              <ScalePressable
                key={tab}
                containerStyle={{ flex: 1 }}
                style={styles.bottomBtn}
                onPress={() => {
                  setListTab(tab);
                  setListVisible(true);
                }}
              >
                <Text style={styles.bottomBtnIcon}>
                  {icon}
                </Text>
                <Text style={styles.bottomBtnText}>
                  {label}
                </Text>
              </ScalePressable>
            ))}
          </View>
        </ScrollView>
      )}

      <ListModal
        visible={listVisible}
        initialTab={listTab}
        state={state}
        onClose={() => setListVisible(false)}
        onToggleFav={toggleFav}
      />
      <JourneyModal
        visible={journeyVisible}
        state={state}
        day={day}
        month={month}
        onSelectMonth={selectMonth}
        onClose={() => setJourneyVisible(false)}
        onReset={() => {
          setJourneyVisible(false);
          if (drawingRef.current) { cardAnim.stopAnimation(); drawingRef.current = false; setDrawing(false); }
          setNotice(null);
          setShowHint(false);
          update({ ...DEFAULT_STATE });
        }}
      />
    </LinearGradient>
  );
}

export default function App() {
  return (
    <I18nProvider><SafeAreaProvider>
      <Main />
    </SafeAreaProvider></I18nProvider>
  );
}

// ---------- 样式 ----------

const styles = StyleSheet.create({
  mainContent: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  loading: { flex: 1, backgroundColor: '#1a1033', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorBanner: { backgroundColor: '#492037', padding: 16, gap: 8 },
  favButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // 欢迎页
  welcome: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: { fontSize: 52 },
  welcomeTitle: { fontSize: 36, lineHeight: 46, fontWeight: '800', color: '#fff', textAlign: 'center', alignSelf: 'stretch' },
  welcomeSlogan: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    color: '#e0d3eb',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  featureBox: {
    marginTop: 36,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    gap: 16,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { fontSize: 20 },
  featureText: { flex: 1, minWidth: 0, textAlign: 'left', color: '#f0e7f6', fontSize: 15, lineHeight: 24 },
  welcomeHint: { color: '#d0bedc', fontSize: 13, lineHeight: 21, marginTop: 14, textAlign: 'center' },

  // 通用按钮
  primaryBtn: { alignSelf: 'stretch', borderRadius: 30, overflow: 'hidden' },
  primaryBtnInner: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    minHeight: 56,
    alignItems: 'center',
    borderRadius: 30,
  },
  primaryBtnText: { color: '#25102c', fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 25, flexShrink: 1 },

  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700', textAlign: 'left', lineHeight: 18 },

  // 主界面
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 24, gap: 10 },
  appName: { color: '#fff', fontSize: 22, lineHeight: 30, fontWeight: '800', textAlign: 'left' },
  dayText: { color: '#d9cbe4', fontSize: 13, lineHeight: 20, marginTop: 3, textAlign: 'left' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 19 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 24,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },

  themeScroll: { flexGrow: 0, marginTop: 14 },
  themeScrollContent: { paddingHorizontal: 24, gap: 10 },
  themeChip: {
    maxWidth: 220,
    minWidth: 104,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 2,
  },
  themeChipMonth: { color: '#d0c4dc', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  themeChipName: { color: '#eee5f5', fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' },

  stageBanner: {
    paddingHorizontal: 24,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  stageBannerSub: { color: '#dfd2e9', fontSize: 14, lineHeight: 22, flexGrow: 1, flexShrink: 1, flexBasis: 160, textAlign: 'left' },

  // 卡片
  cardWrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 24,
    minHeight: 190,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  quoteMark: { fontSize: 40, lineHeight: 44, fontWeight: '900', opacity: 0.9 },
  cardText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 38,
    fontWeight: '600',
    textAlign: 'left',
    marginVertical: 8,
  },
  cardPlaceholder: {
    color: '#e0d5eb',
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardMeta: { color: '#d8cae4', fontSize: 12, lineHeight: 20, flexShrink: 1, textAlign: 'left', maxWidth: '100%' },
  cardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, maxWidth: '100%' },
  favIcon: { fontSize: 26 },

  hintBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    gap: 6,
  },
  hintTitle: { fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'left' },
  hintText: { color: '#eee4f5', fontSize: 14, lineHeight: 23, textAlign: 'left', flexShrink: 1 },
  hintBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    maxWidth: '100%',
    flexShrink: 1,
  },
  hintBtnText: { fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },

  remainText: {
    color: '#dfd2e9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  bottomRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 16 },
  bottomBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  bottomBtnIcon: { fontSize: 15 },
  bottomBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
    lineHeight: 22,
  },

  // 弹窗
  modalMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#16122b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    minHeight: '55%',
    paddingTop: 10,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 12,
    gap: 8,
  },
  tabBtn: { paddingVertical: 8, minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: '#cdbedc', fontSize: 15, lineHeight: 23, textAlign: 'center', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ff4f81',
    alignSelf: 'stretch',
    marginTop: 6,
  },
  modalClose: { color: 'rgba(255,255,255,0.6)', fontSize: 18, padding: 4 },

  emptyBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 12, flexShrink: 1 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { color: '#d3c5e1', fontSize: 15, lineHeight: 25, textAlign: 'center', flexShrink: 1 },

  listItem: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  listItemTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  listDate: { color: '#cbbbda', fontSize: 12, lineHeight: 19 },
  listFav: { fontSize: 20 },
  listText: { color: '#f4eef9', fontSize: 16, lineHeight: 26, textAlign: 'left' },

  // 旅程弹窗
  journeyTitle: { color: '#fff', fontSize: 20, lineHeight: 30, fontWeight: '700', flex: 1, textAlign: 'left' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statBox: {
    flexGrow: 1,
    flexBasis: '40%',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#d1c2df', fontSize: 13, lineHeight: 21, textAlign: 'center' },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  stageRowCurrent: { backgroundColor: 'rgba(255,255,255,0.07)' },
  stageDot: { width: 10, height: 10, borderRadius: 5 },
  stageName: { color: '#fff', fontSize: 15, lineHeight: 24, fontWeight: '700', textAlign: 'left' },
  stageSub: { color: '#cdbedc', fontSize: 13, lineHeight: 21, marginTop: 2, textAlign: 'left' },
  stageCount: { fontSize: 12, fontWeight: '700' },
  journeyStart: { color: '#cdbedc', fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 16 },
  resetBtn: { alignSelf: 'center', marginTop: 10, minHeight: 44, justifyContent: 'center', padding: 8 },
  resetText: { color: '#ff9fae', fontSize: 14, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
});
