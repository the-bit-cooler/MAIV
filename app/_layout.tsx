import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Dispatch, useEffect, useState } from 'react';
import { PlatformPressable } from '@react-navigation/elements';
import { TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';

import { AppThemeProvider } from '@/hooks/use-app-theme-provider';
import { AppPreferencesProvider, useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useThemeColor } from '@/hooks/use-theme-color';

import {
  getSupportedBibleVersions,
  getBibleVersionDisplayName,
} from '@/utilities/get-bible-version-info';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';
import { purgeExpiredCache } from '@/utilities/cache';

import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function App() {
  useEffect(() => {
    purgeExpiredCache(); // runs once at launch
  }, []);

  return (
    <ActionSheetProvider>
      <AppPreferencesProvider>
        <AppThemeProvider>
          <AppDrawer />
          <StatusBar style="auto" />
        </AppThemeProvider>
      </AppPreferencesProvider>
    </ActionSheetProvider>
  );
}

function AppDrawer() {
  const [showReadingLocationPickerModal, setShowReadingLocationPickerModal] = useState(false);
  const router = useRouter();
  const { version, readingLocation } = useAppPreferences();

  return (
    <>
      <Drawer>
        <Drawer.Screen
          name="(stack)"
          options={{
            title: `Bible: ${getBibleVersionDisplayName(version)}`,
            headerTitle: () => (
              <TouchableOpacity
                onPress={() => setShowReadingLocationPickerModal(true)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                <IconSymbol name="chevron.down" size={16} color="#666" style={{ marginRight: 6 }} />
                <ThemedText type="subtitle">
                  {`${readingLocation.book} ${readingLocation.chapter}`}
                </ThemedText>
              </TouchableOpacity>
            ),
            headerRight: ({ tintColor }) => (
              <PlatformPressable onPress={() => router.push({ pathname: '/(stack)/settings' })}>
                <IconSymbol
                  size={28}
                  name="gearshape.fill"
                  color={tintColor!}
                  style={{ marginRight: 15 }}
                />
              </PlatformPressable>
            ),
          }}
        />
      </Drawer>
      <ReadingLocatinPicker
        showReadingLocationPickerModal={showReadingLocationPickerModal}
        setShowReadingLocationPickerModal={setShowReadingLocationPickerModal}
      />
    </>
  );
}

type ReadingLocatinPickerParams = {
  showReadingLocationPickerModal: boolean;
  setShowReadingLocationPickerModal: Dispatch<React.SetStateAction<boolean>>;
};

function ReadingLocatinPicker({
  showReadingLocationPickerModal,
  setShowReadingLocationPickerModal,
}: ReadingLocatinPickerParams) {
  const { version, setVersion, readingLocation, setReadingLocation } = useAppPreferences();

  const modalBackgroundColor = useThemeColor({}, 'cardBackground');
  const modalPickerColor = useThemeColor({}, 'text');

  return (
    <Modal
      key="reading-location-picker-modal"
      isVisible={showReadingLocationPickerModal}
      backdropOpacity={0.02}
      onBackdropPress={() => setShowReadingLocationPickerModal(false)}
      onSwipeComplete={() => setShowReadingLocationPickerModal(false)}
      swipeDirection={['left', 'right']}
      animationIn="slideInDown"
      animationOut="slideOutUp">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 16, width: '80%' }}>
          <Picker
            style={{ opacity: 0.95 }}
            selectedValue={version}
            onValueChange={(version) => setVersion(version)}
            itemStyle={{
              borderRadius: 200,
              color: modalPickerColor,
              backgroundColor: modalBackgroundColor,
              fontWeight: 'bold',
              marginBottom: 30,
            }}>
            {getSupportedBibleVersions().map((version) => {
              return (
                <Picker.Item key={version.key} label={version.shortname} value={version.key} />
              );
            })}
          </Picker>
          <Picker
            style={{ opacity: 0.95 }}
            selectedValue={readingLocation.book}
            onValueChange={(bk) => {
              setReadingLocation({ ...readingLocation, book: bk, chapter: 1, page: 0 });
            }}
            itemStyle={{
              borderRadius: 200,
              color: modalPickerColor,
              backgroundColor: modalBackgroundColor,
              fontWeight: 'bold',
              marginBottom: 30,
            }}>
            {getBibleBookList().map((bk) => (
              <Picker.Item key={bk} label={bk} value={bk} />
            ))}
          </Picker>
          <Picker
            style={{ opacity: 0.95 }}
            selectedValue={readingLocation.chapter}
            onValueChange={(ch) => {
              setReadingLocation({ ...readingLocation, chapter: ch, page: 0 });
            }}
            itemStyle={{
              borderRadius: 200,
              color: modalPickerColor,
              backgroundColor: modalBackgroundColor,
              fontWeight: 'bold',
            }}>
            {Array.from(
              { length: getBibleBookChapterCount(readingLocation.book!) },
              (_, i) => i + 1,
            ).map((ch) => (
              <Picker.Item key={ch} label={`Chapter ${ch}`} value={ch} />
            ))}
          </Picker>
        </View>
      </View>
    </Modal>
  );
}
