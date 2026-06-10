import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ALL_TOPICS,
  MONTH_DAYS,
  STAGES,
  TOTAL_DAYS,
  Topic,
  hintForTopic,
  monthForDay,
  stageForMonth,
  topicById,
} from './lib/topics';
import {
  AppState,
  DEFAULT_STATE,
  dayNumber,
  formatDateCN,
  loadState,
  resetState,
  saveState,
  todayStr,
} from './lib/storage';

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
  children,
}: {
  onPress: () => void;
  style?: object;
  containerStyle?: object;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={containerStyle}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
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

const THEME_CHIP_STEP = 92; // 估算的单个主题块宽度（含间距），用于自动定位

function ThemeSelector({ month, onSelect }: { month: number; onSelect: (m: number) => void }) {
  const scrollRef = useRef<ScrollView>(null);

  // 自动滚动到当前选中的主题，保证它始终可见
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: Math.max(0, (month - 1) * THEME_CHIP_STEP - 110),
      animated: true,
    });
  }, [month]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.themeScroll}
      contentContainerStyle={styles.themeScrollContent}
    >
      {STAGES.map((s) => {
        const active = s.month === month;
        return (
          <Pressable
            key={s.month}
            onPress={() => onSelect(s.month)}
            style={[
              styles.themeChip,
              active && { backgroundColor: s.accent + '33', borderColor: s.accent },
            ]}
          >
            <Text
              style={[styles.themeChipMonth, active && { color: s.accent }]}
              maxFontSizeMultiplier={1.2}
            >
              {s.month}月
            </Text>
            <Text
              style={[styles.themeChipName, active && { color: '#fff' }]}
              maxFontSizeMultiplier={1.2}
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
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fade, float]);

  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <Animated.View style={{ flex: 1, opacity: fade }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.welcome,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 },
        ]}
      >
      <Animated.View style={[styles.logoCircle, { transform: [{ translateY: ty }] }]}>
        <Text style={styles.logoEmoji}>💞</Text>
      </Animated.View>
      <Text style={styles.welcomeTitle}>心动话题</Text>
      <Text style={styles.welcomeSlogan}>366 天 · 从暧昧到相守的对话之旅</Text>

      <View style={styles.featureBox}>
        {[
          ['🌙', '暧昧篇 31 题 + 情侣篇 335 题，共 366 个话题'],
          ['🎯', '12 个主题阶段自由切换，想聊哪个聊哪个'],
          ['🎲', '随机抽取永不重复，每题配开场提示'],
          ['📖', '自动保存历史与收藏，记录你们的故事'],
        ].map(([icon, text]) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{icon}</Text>
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <ScalePressable
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
          <Text style={styles.primaryBtnText} maxFontSizeMultiplier={1.2}>
            开启我们的 366 天 ✨
          </Text>
        </LinearGradient>
      </ScalePressable>
        <Text style={styles.welcomeHint}>今天就是旅程的第 1 天</Text>
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
          <Text style={styles.cardText}>{topic.text}</Text>
          {showHint && (
            <View style={[styles.hintBox, { borderColor: cardAccent + '55' }]}>
              <Text style={[styles.hintTitle, { color: cardAccent }]}>💡 如何自然开启</Text>
              <Text style={styles.hintText}>{hintForTopic(topic)}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              {stage.name} · 第 {topic.indexInMonth} 题
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={8}
                onPress={onToggleHint}
                style={[
                  styles.hintBtn,
                  { borderColor: cardAccent + '77' },
                  showHint && { backgroundColor: cardAccent + '26' },
                ]}
              >
                <Text style={[styles.hintBtnText, { color: cardAccent }]} maxFontSizeMultiplier={1.2}>
                  {showHint ? '收起提示' : '💡 提示'}
                </Text>
              </Pressable>
              <Pressable hitSlop={12} onPress={onToggleFav}>
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
            {notice ?? '点击下方按钮\n抽取属于你们的话题'}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>心动话题 · HeartTalk</Text>
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
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.tabRow}>
            {(
              [
                ['history', `历史记录 ${state.history.length}`],
                ['favs', `我的收藏 ${state.favs.length}`],
              ] as const
            ).map(([key, label]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={styles.tabBtn}>
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                {tab === key && <View style={styles.tabUnderline} />}
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={10} onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          {data.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>{tab === 'history' ? '🫧' : '🤍'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'history'
                  ? '还没有抽过话题，去抽一个吧'
                  : '点击话题卡片右下角的 ♡ 收藏喜欢的话题'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const t = topicById(item.id);
                if (!t) return null;
                const stage = stageForMonth(t.month);
                const fav = state.favs.includes(t.id);
                return (
                  <View style={styles.listItem}>
                    <View style={styles.listItemTop}>
                      <Chip label={`第${t.month}月 · ${stage.name}`} color={stage.accent} />
                      {!!item.date && <Text style={styles.listDate}>{item.date}</Text>}
                      <View style={{ flex: 1 }} />
                      <Pressable hitSlop={10} onPress={() => onToggleFav(t.id)}>
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
                    <Text style={styles.listText}>{t.text}</Text>
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
  const insets = useSafeAreaInsets();

  const confirmReset = () => {
    Alert.alert('重新开始旅程？', '将清空所有历史、收藏与进度，从第 1 天重新开始。', [
      { text: '取消', style: 'cancel' },
      { text: '确认重置', style: 'destructive', onPress: onReset },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalMask}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.tabRow}>
            <Text style={styles.journeyTitle}>🧭 我们的旅程</Text>
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={10} onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.statRow}>
            {(
              [
                [`${day}`, '当前天数'],
                [`${state.used.length}`, '已聊话题'],
                [`${state.favs.length}`, '收藏话题'],
                [`${TOTAL_DAYS - state.used.length}`, '待解锁'],
              ] as const
            ).map(([num, label]) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statNum}>{num}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={STAGES}
            keyExtractor={(s) => String(s.month)}
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            renderItem={({ item: s }) => {
              const current = s.month === month;
              const usedInMonth = state.used.filter(
                (id) => ALL_TOPICS[id]?.month === s.month
              ).length;
              return (
                <Pressable
                  style={[styles.stageRow, current && styles.stageRowCurrent]}
                  onPress={() => {
                    onSelectMonth(s.month);
                    onClose();
                  }}
                >
                  <View style={[styles.stageDot, { backgroundColor: s.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageName}>
                      第 {s.month} 月 · {s.name}
                      {s.month === 1 ? '（暧昧篇）' : '（情侣篇）'}
                    </Text>
                    <Text style={styles.stageSub}>{s.subtitle} · 点击切换到此主题</Text>
                  </View>
                  <Text style={[styles.stageCount, { color: s.accent }]}>
                    {usedInMonth}/{MONTH_DAYS[s.month - 1]}
                  </Text>
                </Pressable>
              );
            }}
            ListFooterComponent={
              <View>
                <Text style={styles.journeyStart}>
                  旅程始于 {state.startDate ? formatDateCN(state.startDate) : '—'}
                </Text>
                <Pressable style={styles.resetBtn} onPress={confirmReset}>
                  <Text style={styles.resetText}>重新开始旅程</Text>
                </Pressable>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// ---------- 主界面 ----------

function Main() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<AppState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [listVisible, setListVisible] = useState(false);
  const [listTab, setListTab] = useState<'history' | 'favs'>('history');
  const [journeyVisible, setJourneyVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const cardAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void loadState().then(setState);
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    void saveState(next);
  }, []);

  const animateCard = useCallback(
    (midway: () => void) => {
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        midway();
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }).start();
      });
    },
    [cardAnim]
  );

  if (!state) {
    return <View style={{ flex: 1, backgroundColor: '#1a1033' }} />;
  }

  const started = !!state.startDate;
  const day = started ? dayNumber(state.startDate!) : 1;
  // 玩家自由选择主题；未选择时默认跟随真实日期所在的月份
  const month =
    state.selectedMonth != null && state.selectedMonth >= 1 && state.selectedMonth <= 12
      ? state.selectedMonth
      : monthForDay(day);
  const stage = stageForMonth(month);
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
    if (monthPool.length === 0) {
      haptic('light');
      animateCard(() => {
        setNotice('「' + stage.name + '」的话题已经全部聊完 ✨\n试试切换其他主题吧');
        update({ ...state, lastTopicId: null });
      });
      return;
    }
    haptic('medium');
    const pick = monthPool[Math.floor(Math.random() * monthPool.length)];
    animateCard(() => {
      setNotice(null);
      setShowHint(false);
      update({
        ...state,
        used: [...state.used, pick.id],
        history: [{ id: pick.id, date: todayStr() }, ...state.history],
        lastTopicId: pick.id,
      });
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
      {!started ? (
        <WelcomeScreen onStart={() => update({ ...state, startDate: todayStr() })} />
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
          {/* 顶部栏 */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>心动话题</Text>
              <Text style={styles.dayText}>
                第 <Text style={[styles.dayNum, { color: stage.accent }]}>{day}</Text> /{' '}
                {TOTAL_DAYS} 天
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={10} style={styles.iconBtn} onPress={() => setJourneyVisible(true)}>
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
            <Chip label={month === 1 ? '暧昧篇' : '情侣篇'} color={stage.accent} />
            <Text style={styles.stageBannerSub} numberOfLines={1}>
              {stage.subtitle}
            </Text>
          </View>

          {/* 话题卡片（可滚动：内容超出时自动滚动而不是被裁切） */}
          <ScrollView
            style={styles.cardWrap}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardScrollContent}
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
          </ScrollView>

          {/* 抽取按钮 */}
          <View style={{ paddingHorizontal: 24 }}>
            <ScalePressable style={styles.primaryBtn} onPress={draw}>
              <LinearGradient
                colors={['#ff7eb3', '#ff4f81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText} maxFontSizeMultiplier={1.2}>
                  {currentTopic ? '🎲 再抽一个话题' : '🎲 抽取话题'}
                </Text>
              </LinearGradient>
            </ScalePressable>
            <Text style={styles.remainText}>
              {monthPool.length > 0
                ? `「${stage.name}」还有 ${monthPool.length} 个话题待抽取`
                : `「${stage.name}」已聊完，左右滑动切换其他主题`}
            </Text>
          </View>

          {/* 底部操作 */}
          <View style={styles.bottomRow}>
            {(
              [
                ['🕰️', '历史记录', 'history'],
                ['💖', '我的收藏', 'favs'],
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
                <Text style={styles.bottomBtnIcon} maxFontSizeMultiplier={1.2}>
                  {icon}
                </Text>
                <Text style={styles.bottomBtnText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {label}
                </Text>
              </ScalePressable>
            ))}
          </View>
        </View>
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
          void resetState();
          setNotice(null);
          setState({ ...DEFAULT_STATE });
        }}
      />
    </LinearGradient>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

// ---------- 样式 ----------

const styles = StyleSheet.create({
  // 欢迎页
  welcome: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28 },
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
  welcomeTitle: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  welcomeSlogan: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 10,
    letterSpacing: 1,
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
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 20 },
  featureText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 20 },
  welcomeHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 14 },

  // 通用按钮
  primaryBtn: { alignSelf: 'stretch', borderRadius: 30, overflow: 'hidden' },
  primaryBtnInner: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 2 },

  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // 主界面
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  appName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  dayText: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3, letterSpacing: 1 },
  dayNum: { fontSize: 15, fontWeight: '800' },
  iconBtn: {
    width: 42,
    height: 42,
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
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 2,
  },
  themeChipMonth: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  themeChipName: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },

  stageBanner: {
    paddingHorizontal: 24,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 2, flexShrink: 1 },

  // 卡片
  cardWrap: { flex: 1, minHeight: 0 },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
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
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginVertical: 8,
  },
  cardPlaceholder: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cardMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 1.5 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
  hintTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  hintText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 21 },
  hintBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  hintBtnText: { fontSize: 12, fontWeight: '700' },

  remainText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },

  bottomRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 24, marginTop: 12 },
  bottomBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
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
    letterSpacing: 1,
  },

  // 弹窗
  modalMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#16122b',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
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
    gap: 20,
  },
  tabBtn: { paddingVertical: 8, alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ff4f81',
    alignSelf: 'stretch',
    marginTop: 6,
  },
  modalClose: { color: 'rgba(255,255,255,0.6)', fontSize: 18, padding: 4 },

  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  listItem: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  listItemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listDate: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  listFav: { fontSize: 20 },
  listText: { color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 24 },

  // 旅程弹窗
  journeyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
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
  stageName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stageSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  stageCount: { fontSize: 12, fontWeight: '700' },
  journeyStart: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', marginTop: 12 },
  resetBtn: { alignSelf: 'center', marginTop: 10, padding: 8 },
  resetText: { color: '#ff6b81', fontSize: 13, fontWeight: '600' },
});
