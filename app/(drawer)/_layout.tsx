import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { AppDefaults } from '@/constants/app-defaults';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useVerseContext } from '@/hooks/use-verse-context';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';
import {
  getBibleVersionDisplayName,
  getSupportedBibleVersions,
} from '@/utilities/get-bible-version-info';
import { getFirstVerseOnPage } from '@/utilities/get-first-verse-on-page';
import { Picker } from '@react-native-picker/picker';
import { PlatformPressable } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Dispatch, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';

export default function DrawerLayout() {
  const router = useRouter();
  const { readingLocation } = useAppPreferences();
  const [showReadingLocationPickerModal, setShowReadingLocationPickerModal] = useState(false);

  return (
    <>
      <Drawer
        screenOptions={{
          headerShown: true,
          drawerType: 'front',
          drawerStyle: { width: '85%' },
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
            <PlatformPressable onPress={() => router.push({ pathname: '/settings' })}>
              <IconSymbol
                size={28}
                name="gearshape.fill"
                color={tintColor!}
                style={{ marginRight: 15 }}
              />
            </PlatformPressable>
          ),
        }}>
        <Drawer.Screen
          name={AppDefaults.version}
          options={{ title: getBibleVersionDisplayName(AppDefaults.version) }}
        />
        {getSupportedBibleVersions()
          .filter((v) => v.key !== AppDefaults.version)
          .map((version) => (
            <Drawer.Screen
              key={version.key}
              name={version.key} // points to your dynamic route file
              // initialParams={{ version: version.key }}
              options={{
                drawerLabel: version.fullname, // you can map to full names if needed
              }}
            />
          ))}
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: () => null,
            drawerItemStyle: { height: 0 },
          }}
        />
      </Drawer>
      <ReadingLocationPicker
        showReadingLocationPickerModal={showReadingLocationPickerModal}
        setShowReadingLocationPickerModal={setShowReadingLocationPickerModal}
      />
    </>
  );
}

type ReadingLocationPickerParams = {
  showReadingLocationPickerModal: boolean;
  setShowReadingLocationPickerModal: Dispatch<React.SetStateAction<boolean>>;
};

function ReadingLocationPicker({
  showReadingLocationPickerModal,
  setShowReadingLocationPickerModal,
}: ReadingLocationPickerParams) {
  const { readingLocation, setReadingLocation } = useAppPreferences();
  const { verseToPageMap, totalChapterVerseCount } = useVerseContext();
  const [selectedVerse, setSelectedVerse] = useState(
    getFirstVerseOnPage(readingLocation.page ?? 0, verseToPageMap),
  );
  const lastManualSelectionRef = useRef<number | null>(null);
  const modalBackgroundColor = useThemeColor({}, 'cardBackground');
  const modalPickerColor = useThemeColor({}, 'text');

  useEffect(() => {
    console.log(JSON.stringify(verseToPageMap));
    // if the user manually picked a verse, don’t auto-reset
    if (lastManualSelectionRef.current != null) {
      // skip syncing completely; keep showing their chosen verse
      lastManualSelectionRef.current = null;
      return;
    }

    // otherwise, sync picker to the first verse on the current page
    const verse = getFirstVerseOnPage(readingLocation.page ?? 0, verseToPageMap);
    setSelectedVerse(verse);
  }, [readingLocation.page, verseToPageMap]);

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
          {/* ✝️ Verse Picker (computed page jump) */}
          {totalChapterVerseCount > 0 && (
            <Picker
              style={{ opacity: 0.95 }}
              selectedValue={selectedVerse}
              onValueChange={(vs) => {
                lastManualSelectionRef.current = vs;
                setSelectedVerse(vs); // update local value
                const pageNumber = verseToPageMap?.[vs] ?? 0;
                setReadingLocation({
                  ...readingLocation,
                  page: pageNumber,
                });
              }}
              itemStyle={{
                borderRadius: 200,
                color: modalPickerColor,
                backgroundColor: modalBackgroundColor,
                fontWeight: 'bold',
                marginTop: 30,
              }}>
              {Array.from({ length: totalChapterVerseCount }, (_, i) => i + 1).map((vs) => (
                <Picker.Item key={vs} label={`Verse ${vs}`} value={vs} />
              ))}
            </Picker>
          )}
        </View>
      </View>
    </Modal>
  );
}
