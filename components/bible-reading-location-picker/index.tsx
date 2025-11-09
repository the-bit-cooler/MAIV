import { Dispatch } from 'react';
import { Platform } from 'react-native';

import AndroidBibleReadingLocationPicker from '@/components/bible-reading-location-picker/android';
import IOSBibleReadingLocationPicker from '@/components/bible-reading-location-picker/ios';

type BibleReadingLocationPickerParams = {
  showBibleReadingLocationPickerModal: boolean;
  setShowBibleReadingLocationPickerModal: Dispatch<React.SetStateAction<boolean>>;
};

export function BibleReadingLocationPicker({
  showBibleReadingLocationPickerModal,
  setShowBibleReadingLocationPickerModal,
}: BibleReadingLocationPickerParams) {
  return Platform.OS === 'ios' ? (
    <IOSBibleReadingLocationPicker
      showBibleReadingLocationPickerModal={showBibleReadingLocationPickerModal}
      setShowBibleReadingLocationPickerModal={setShowBibleReadingLocationPickerModal}
    />
  ) : (
    <AndroidBibleReadingLocationPicker
      showBibleReadingLocationPickerModal={showBibleReadingLocationPickerModal}
      setShowBibleReadingLocationPickerModal={setShowBibleReadingLocationPickerModal}
    />
  );
}
