import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useVerseContext } from '@/hooks/use-verse-context';
import { getBibleBookChapterCount } from '@/utilities/get-bible-book-chapter-count';
import { getBibleBookList } from '@/utilities/get-bible-book-list';
import { getFirstVerseOnPage } from '@/utilities/get-first-verse-on-page';
import { Picker } from '@react-native-picker/picker';
import { Dispatch, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type BibleReadingLocationPickerParams = {
  showBibleReadingLocationPickerModal: boolean;
  setShowBibleReadingLocationPickerModal: Dispatch<React.SetStateAction<boolean>>;
};

export default function BibleReadingLocationPicker({
  showBibleReadingLocationPickerModal,
  setShowBibleReadingLocationPickerModal,
}: BibleReadingLocationPickerParams) {
  const { readingLocation, setReadingLocation } = useAppPreferences();
  const { verseToPageMap, totalChapterVerseCount } = useVerseContext();
  const [selectedVerse, setSelectedVerse] = useState(
    getFirstVerseOnPage(readingLocation.bible.page ?? 0, verseToPageMap),
  );
  const lastManualSelectionRef = useRef<number | null>(null);

  const cardBackground = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (lastManualSelectionRef.current != null) {
      lastManualSelectionRef.current = null;
      return;
    }
    const verse = getFirstVerseOnPage(readingLocation.bible.page ?? 0, verseToPageMap);
    setSelectedVerse(verse);
  }, [readingLocation.bible.page, verseToPageMap]);

  if (!showBibleReadingLocationPickerModal) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Select Reading Location</Text>
          <TouchableOpacity
            onPress={() => setShowBibleReadingLocationPickerModal(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ width: '100%' }}>
          {/* 📖 Book Picker */}
          <Text style={[styles.label, { color: accentColor }]}>Book</Text>
          <View style={[styles.pickerContainer, { borderColor: accentColor + '40' }]}>
            <Picker
              mode="dropdown"
              dropdownIconColor={accentColor}
              style={[styles.picker, { color: textColor }]}
              selectedValue={readingLocation.bible.book}
              onValueChange={(bk) =>
                setReadingLocation({
                  ...readingLocation,
                  bible: { book: bk, chapter: 1, page: 0 },
                })
              }>
              {getBibleBookList().map((bk) => (
                <Picker.Item key={bk} label={bk} value={bk} />
              ))}
            </Picker>
          </View>

          {/* 📜 Chapter Picker */}
          <Text style={[styles.label, { color: accentColor }]}>Chapter</Text>
          <View style={[styles.pickerContainer, { borderColor: accentColor + '40' }]}>
            <Picker
              mode="dropdown"
              dropdownIconColor={accentColor}
              style={[styles.picker, { color: textColor }]}
              selectedValue={readingLocation.bible.chapter}
              onValueChange={(ch) =>
                setReadingLocation({
                  ...readingLocation,
                  bible: { ...readingLocation.bible, chapter: ch, page: 0 },
                })
              }>
              {Array.from(
                { length: getBibleBookChapterCount(readingLocation.bible.book) },
                (_, i) => i + 1,
              ).map((ch) => (
                <Picker.Item key={ch} label={`Chapter ${ch}`} value={ch} />
              ))}
            </Picker>
          </View>

          {/* ✝️ Verse Picker */}
          {totalChapterVerseCount > 0 && (
            <>
              <Text style={[styles.label, { color: accentColor }]}>Verse</Text>
              <View style={[styles.pickerContainer, { borderColor: accentColor + '40' }]}>
                <Picker
                  mode="dropdown"
                  dropdownIconColor={accentColor}
                  style={[styles.picker, { color: textColor }]}
                  selectedValue={selectedVerse}
                  onValueChange={(vs) => {
                    lastManualSelectionRef.current = vs;
                    setSelectedVerse(vs);
                    const pageNumber = verseToPageMap?.[vs] ?? 0;
                    setReadingLocation({
                      ...readingLocation,
                      bible: { ...readingLocation.bible, page: pageNumber },
                    });
                  }}>
                  {Array.from({ length: totalChapterVerseCount }, (_, i) => i + 1).map((vs) => (
                    <Picker.Item key={vs} label={`Verse ${vs}`} value={vs} />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#00000066',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  picker: {
    width: '100%',
  },
});
