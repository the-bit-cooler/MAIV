import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks';
import { getBibleVersionMeta } from '@/utilities';

interface Props {
  version: string;
}

export function BibleCopyrightPage({ version }: Props) {
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const secondary = useThemeColor({}, 'secondaryText');

  const meta = getBibleVersionMeta(version);

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[styles.container, { backgroundColor: bg }]}
    >
      {/* Watermark */}
      <ThemedText type="subtitle" style={[styles.watermark, { color: secondary }]}>
        {meta.shortname.replace(/\(.*?\)/, '').trim()}
      </ThemedText>

      {/* Golden divider */}
      <View style={[styles.divider, { borderBottomColor: text }]} />

      {/* Title */}
      <ThemedText type="title" style={[styles.fullname, { color: text }]}>
        {meta.fullname}
      </ThemedText>

      {/* Description */}
      <ThemedText type="default" style={[styles.description, { color: secondary }]}>
        {meta.description}
      </ThemedText>

      {/* Copyright */}
      <ThemedText type="defaultSemiBold" style={[styles.copyright, { color: text }]}>
        {meta.copyright}
      </ThemedText>

      {/* Footer */}
      <ThemedText type="default" style={[styles.footer, { color: secondary }]}>
        Published by ScripturAI • MAIV Bible Reader
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  watermark: {
    position: 'absolute',
    top: 90,
    opacity: 0.06,
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  divider: {
    marginVertical: 20,
    width: 80,
    borderBottomWidth: 2,
    opacity: 0.4,
  },

  fullname: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 16,
  },

  copyright: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },

  footer: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 20,
  },
});
