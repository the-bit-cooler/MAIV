import { Picker } from '@react-native-picker/picker';
import { Dispatch, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Modal from 'react-native-modal';

import { useAppContext } from '@/hooks/use-app-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';
import { getFirstVerseOnPage } from '@/utilities/get-first-verse-on-page';

type BibleReadingLocationPickerParams = {
  showBibleReadingLocationPickerModal: boolean;
  setShowBibleReadingLocationPickerModal: Dispatch<React.SetStateAction<boolean>>;
};

export default function BibleReadingLocationPicker({
  showBibleReadingLocationPickerModal,
  setShowBibleReadingLocationPickerModal,
}: BibleReadingLocationPickerParams) {
  const { readingLocation, setReadingLocation, verseToPageMap, totalChapterVerseCount } =
    useAppContext();
  const [selectedVerse, setSelectedVerse] = useState(
    getFirstVerseOnPage(readingLocation.bible.page ?? 0, verseToPageMap),
  );
  const lastManualSelectionRef = useRef<number | null>(null);
  const modalBackgroundColor = useThemeColor({}, 'cardBackground');
  const modalPickerColor = useThemeColor({}, 'text');

  useEffect(() => {
    // if the user manually picked a verse, don’t auto-reset
    if (lastManualSelectionRef.current != null) {
      // skip syncing completely; keep showing their chosen verse
      lastManualSelectionRef.current = null;
      return;
    }

    // otherwise, sync picker to the first verse on the current page
    const verse = getFirstVerseOnPage(readingLocation.bible.page ?? 0, verseToPageMap);
    setSelectedVerse(verse);
  }, [readingLocation.bible.page, verseToPageMap]);

  return (
    <Modal
      key="bible-reading-location-picker-modal"
      isVisible={showBibleReadingLocationPickerModal}
      backdropOpacity={0.02}
      onBackdropPress={() => setShowBibleReadingLocationPickerModal(false)}
      onSwipeComplete={() => setShowBibleReadingLocationPickerModal(false)}
      swipeDirection={['left', 'right']}
      animationIn="slideInDown"
      animationOut="slideOutUp">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ padding: 16, width: '80%' }}>
          <Picker
            style={{ opacity: 0.95 }}
            selectedValue={readingLocation.bible.book}
            onValueChange={(bk) => {
              setReadingLocation({ ...readingLocation, bible: { book: bk, chapter: 1, page: 0 } });
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
            selectedValue={readingLocation.bible.chapter}
            onValueChange={(ch) => {
              setReadingLocation({
                ...readingLocation,
                bible: { ...readingLocation.bible, chapter: ch, page: 0 },
              });
            }}
            itemStyle={{
              borderRadius: 200,
              color: modalPickerColor,
              backgroundColor: modalBackgroundColor,
              fontWeight: 'bold',
            }}>
            {Array.from(
              { length: getBibleBookChapterCount(readingLocation.bible.book) },
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
                  bible: { ...readingLocation.bible, page: pageNumber },
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
