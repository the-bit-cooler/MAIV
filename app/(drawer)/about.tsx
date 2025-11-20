import { Image, ScrollView, StyleSheet, View } from 'react-native';

import * as Application from 'expo-application';

import { ThemedText, ThemedView } from '@/components';
import { useThemeColor } from '@/hooks';

export default function AboutScreen() {
  const textColor = useThemeColor({}, 'text');

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* App Icon */}
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Title */}
        <ThemedText type="title" style={styles.title}>
          {`${Application.applicationName}: Modern AI Version`}
        </ThemedText>

        {/* Version Info */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Version
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            {`App Version ${Application.nativeApplicationVersion}`}
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            {`Build Number ${Application.nativeBuildVersion}`}
          </ThemedText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: textColor + '20' }]} />

        {/* Copyright */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Copyright
          </ThemedText>
          <ThemedText style={styles.sectionText}>© 2025 ScripturAI</ThemedText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: textColor + '20' }]} />

        {/* Dedication */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Dedication
          </ThemedText>
          <ThemedText style={styles.sectionText}>In ❤️ memory of Charlie Kirk</ThemedText>
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  icon: {
    width: 110,
    height: 110,
    marginBottom: 20,
    borderRadius: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 16,
    marginBottom: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 10,
  },
});
