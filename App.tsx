import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
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
  MONTH_START_DAY,
  STAGES,
  TOTAL_DAYS,
  Topic,
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
  children,
}: {
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
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
    <Animated.View
      style={[
        styles.welcome,
        { opacity: fade, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 28 },
      ]}
    >
      <Animated.View style={[styles.logoCircle, { transform: [{ translateY: ty }] }]}>
        <Text style={styles.logoEmoji}>💞</Text>
      </Animated.View>
      <Text style={styles.welcomeTitle}>心动话题</Text>
      <Text style={styles.welcomeSlogan}>366 天 · 从暧昧到相守的对话之旅</Text>

      <View style={styles.featureBox}>
        {[
          ['🌙', '第 1 个月 · 31 个暧昧期话题，试探彼此的心意'],
          ['💘', '第 2 ~ 12 个月 · 335 个情侣话题，逐月升温'],
          ['🎲', '每天随机抽取，366 个话题永不重复'],
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
          <Text style={styles.primaryBtnText}>开启我们的 366 天 ✨</Text>
        </LinearGradient>
      </ScalePressable>
      <Text style={styles.welcomeHint}>今天就是旅程的第 1 天</Text>
    </Animated.View>
  );
}

// ---------- 话题卡片 ----------

function TopicCard({
  topic,
  notice,
  accent,
  isFav,
  onToggleFav,
  anim,
}: {
  topic: Topic | null;
  notice: string | null;
  accent: string;
  isFav: boolean;
  onToggleFav: () => void;
  anim: Animated.Value;
}) {
  const stage = topic ? stageForMonth(topic.month) : null;
  const ty = anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const rot = anim.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '0deg'] });

  return (
    <Animated.View
      style={[styles.card, { opacity: anim, transform: [{ translateY: ty }, { rotate: rot }] }]}
    >
      <Text style={[styles.quoteMark, { color: accent }]}>“</Text>
      {topic && stage ? (
        <>
          <Text style={styles.cardText}>{topic.text}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>
              {stage.name} · 第 {topic.indexInMonth} 题
            </Text>
            <Pressable hitSlop={12} onPress={onToggleFav}>
              <Text
                style={[styles.favIcon, { color: isFav ? '#ff4f81' : 'rgba(255,255,255,0.45)' }]}
              >
                {isFav ? '♥' : '♡'}
              </Text>
            </Pressable>
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
  onClose,
  onReset,
}: {
  visible: boolean;
  state: AppState;
  day: number;
  onClose: () => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const month = monthForDay(day);

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
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            renderItem={({ item: s }) => {
              const start = MONTH_START_DAY[s.month - 1];
              const end = start + MONTH_DAYS[s.month - 1] - 1;
              const reached = day >= start;
              const current = s.month === month;
              const usedInMonth = state.used.filter(
                (id) => ALL_TOPICS[id]?.month === s.month
              ).length;
              return (
                <View style={[styles.stageRow, current && styles.stageRowCurrent]}>
                  <View
                    style={[
                      styles.stageDot,
                      { backgroundColor: reached ? s.accent : 'rgba(255,255,255,0.18)' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stageName, !reached && { color: 'rgba(255,255,255,0.4)' }]}>
                      第 {s.month} 月 · {s.name}
                      {s.month === 1 ? '（暧昧篇）' : '（情侣篇）'}
                    </Text>
                    <Text style={styles.stageSub}>
                      第 {start}~{end} 天 · {s.subtitle}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stageCount,
                      { color: reached ? s.accent : 'rgba(255,255,255,0.3)' },
                    ]}
                  >
                    {reached ? `${usedInMonth}/${MONTH_DAYS[s.month - 1]}` : '🔒'}
                  </Text>
                </View>
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
  const month = monthForDay(day);
  const stage = stageForMonth(month);
  const usedSet = new Set(state.used);
  const monthPool = ALL_TOPICS.filter((t) => t.month === month && !usedSet.has(t.id));
  // 当月话题抽完后，可回捞之前月份未抽的情侣话题（第 1 月只属于暧昧篇，不参与回捞）
  const fallbackPool =
    month > 1
      ? ALL_TOPICS.filter((t) => t.month > 1 && t.month <= month && !usedSet.has(t.id))
      : [];
  const drawable = monthPool.length > 0 ? monthPool : fallbackPool;
  const currentTopic = state.lastTopicId != null ? topicById(state.lastTopicId) ?? null : null;

  const draw = () => {
    if (drawable.length === 0) {
      haptic('light');
      animateCard(() => {
        setNotice(
          month === 1
            ? '本月 31 个暧昧话题已全部聊完 🌙\n下个月将解锁情侣篇话题'
            : '当前阶段的话题已全部聊完 💯\n等待下个月解锁新话题吧'
        );
        update({ ...state, lastTopicId: null });
      });
      return;
    }
    haptic('medium');
    const pick = drawable[Math.floor(Math.random() * drawable.length)];
    animateCard(() => {
      setNotice(null);
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

          {/* 阶段信息 */}
          <View style={styles.stageBanner}>
            <Chip label={month === 1 ? '暧昧篇' : '情侣篇'} color={stage.accent} />
            <Text style={styles.stageBannerTitle}>
              第 {month} 月 · {stage.name}
            </Text>
            <Text style={styles.stageBannerSub}>{stage.subtitle}</Text>
          </View>

          {/* 话题卡片 */}
          <View style={styles.cardWrap}>
            <TopicCard
              topic={notice ? null : currentTopic}
              notice={notice}
              accent={stage.accent}
              isFav={currentTopic ? state.favs.includes(currentTopic.id) : false}
              onToggleFav={() => currentTopic && toggleFav(currentTopic.id)}
              anim={cardAnim}
            />
          </View>

          {/* 抽取按钮 */}
          <View style={{ paddingHorizontal: 24 }}>
            <ScalePressable style={styles.primaryBtn} onPress={draw}>
              <LinearGradient
                colors={['#ff7eb3', '#ff4f81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnInner}
              >
                <Text style={styles.primaryBtnText}>
                  {currentTopic ? '🎲 再抽一个话题' : '🎲 抽取话题'}
                </Text>
              </LinearGradient>
            </ScalePressable>
            <Text style={styles.remainText}>
              {monthPool.length > 0
                ? `本月还有 ${monthPool.length} 个话题待解锁`
                : month > 1 && fallbackPool.length > 0
                ? `本月已聊完，可回顾往月剩余 ${fallbackPool.length} 个话题`
                : '当前阶段话题已全部聊完，等待下月解锁'}
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
                style={styles.bottomBtn}
                onPress={() => {
                  setListTab(tab);
                  setListVisible(true);
                }}
              >
                <Text style={styles.bottomBtnIcon}>{icon}</Text>
                <Text style={styles.bottomBtnText}>{label}</Text>
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
  welcome: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },
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
    paddingVertical: 17,
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

  stageBanner: { paddingHorizontal: 24, marginTop: 20, gap: 6 },
  stageBannerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  stageBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 2 },

  // 卡片
  cardWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 26,
    minHeight: 230,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  quoteMark: { fontSize: 56, lineHeight: 56, fontWeight: '900', opacity: 0.9 },
  cardText: {
    color: '#fff',
    fontSize: 23,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardPlaceholder: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 17,
    lineHeight: 30,
    flex: 1,
    textAlign: 'center',
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  cardMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 1.5 },
  favIcon: { fontSize: 26 },

  remainText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 1,
  },

  bottomRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 24, marginTop: 18 },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
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
