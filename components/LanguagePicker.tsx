import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../lib/i18n/context';
import { languages } from '../lib/i18n/strings';

export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={t('language')}
      onPress={() => setVisible(true)} style={styles.trigger}>
      <Text style={styles.triggerText}>◎ {languages.find((item) => item.code === locale)!.name}</Text>
    </Pressable>
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={[styles.mask, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Pressable accessibilityLabel={t('close')} accessibilityRole="button"
          style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>{t('language')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('close')}
              onPress={() => setVisible(false)} style={styles.close}><Text style={styles.text}>✕</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.hint}>{t('languageHint')}</Text>
            {languages.map((item) => <Pressable key={item.code}
              accessibilityRole="radio" accessibilityState={{ checked: locale === item.code }}
              aria-checked={locale === item.code}
              accessibilityLabel={item.name}
              onPress={() => { setLocale(item.code); setVisible(false); }}
              style={[styles.option, locale === item.code && styles.selected]}>
              <Text accessibilityLanguage={item.tag} style={styles.optionText}>{item.name}</Text>
              <Text style={styles.check}>{locale === item.code ? '✓' : ''}</Text>
            </Pressable>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center',
    borderRadius: 22, backgroundColor: '#ffffff15', borderWidth: 1, borderColor: '#ffffff30', maxWidth: '100%' },
  triggerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  mask: { flex: 1, backgroundColor: '#090518bb', justifyContent: 'center', paddingHorizontal: 20 },
  panel: { width: '100%', maxWidth: 440, maxHeight: '100%', alignSelf: 'center', backgroundColor: '#211634',
    borderRadius: 24, borderWidth: 1, borderColor: '#ffffff30', padding: 20, flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', flex: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 20 },
  content: { gap: 10, paddingBottom: 4 },
  hint: { color: '#d6c9e6', fontSize: 14, lineHeight: 22, marginBottom: 10, textAlign: 'left' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ffffff25' },
  selected: { borderColor: '#ff9ec7', backgroundColor: '#ff9ec719' },
  optionText: { color: '#fff', flex: 1, fontSize: 17, lineHeight: 25, textAlign: 'left' },
  check: { color: '#ff9ec7', fontSize: 21, fontWeight: '700' },
});
