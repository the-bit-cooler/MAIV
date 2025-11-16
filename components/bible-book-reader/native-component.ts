import type * as React from 'react';
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeCommands, codegenNativeComponent } from 'react-native';
import type {
  DirectEventHandler,
  Double,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

export type OnPageScrollEventData = Readonly<{
  position: Double;
  offset: Double;
}>;

export type OnPageSelectedEventData = Readonly<{
  position: Double;
}>;

export type OnPageScrollStateChangedEventData = Readonly<{
  pageScrollState: 'idle' | 'dragging' | 'settling';
}>;

export interface NativeProps extends ViewProps {
  scrollEnabled?: WithDefault<boolean, true>;
  layoutDirection?: WithDefault<'ltr' | 'rtl', 'ltr'>;
  initialPage?: Int32;
  orientation?: WithDefault<'horizontal' | 'vertical', 'horizontal'>;
  offscreenPageLimit?: Int32;
  pageMargin?: Int32;
  overScrollMode?: WithDefault<'auto' | 'always' | 'never', 'auto'>;
  overdrag?: WithDefault<boolean, false>;
  keyboardDismissMode?: WithDefault<'none' | 'on-drag', 'none'>;
  onPageScroll?: DirectEventHandler<OnPageScrollEventData>;
  onPageSelected?: DirectEventHandler<OnPageSelectedEventData>;
  onPageScrollStateChanged?: DirectEventHandler<OnPageScrollStateChangedEventData>;
}

type BibleBookReaderNativeComponent = HostComponent<NativeProps>;

export interface NativeCommands {
  setPage: (viewRef: React.ElementRef<BibleBookReaderNativeComponent>, selectedPage: Int32) => void;
  setPageWithoutAnimation: (
    viewRef: React.ElementRef<BibleBookReaderNativeComponent>,
    selectedPage: Int32,
  ) => void;
  setScrollEnabledImperatively: (
    viewRef: React.ElementRef<BibleBookReaderNativeComponent>,
    scrollEnabled: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['setPage', 'setPageWithoutAnimation', 'setScrollEnabledImperatively'],
});

export default codegenNativeComponent<NativeProps>('RNCViewPager') as HostComponent<NativeProps>;
