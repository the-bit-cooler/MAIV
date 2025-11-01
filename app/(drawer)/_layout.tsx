import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { AppDefaults } from '@/constants/app-defaults';
import { UserPreferences } from '@/constants/user-preferences';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ReadingLocation } from '@/types/reading-location';
import { getCacheSync } from '@/utilities/cache';
import {
  getBibleVersionDisplayName,
  getKeyListOfSupportedBibleVersions,
  getSupportedBibleVersions,
} from '@/utilities/get-bible-version-info';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { PlatformPressable } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { View } from 'react-native';

export default function DrawerLayout() {
  const router = useRouter();

  // Synchronously read before render
  let drawerSelection =
    getCacheSync<ReadingLocation>(UserPreferences.saved_reading_location)?.drawerSelection ??
    AppDefaults.drawerSelection;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: 'front',
        drawerStyle: { width: '85%' },
        headerTitle: '', // Default to empty; Drawer pages will override
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
      <Drawer.Screen name="index" initialParams={{ drawerSelection }} />
      <Drawer.Screen
        data-maiv="MAIV"
        name={AppDefaults.drawerSelection}
        options={{ drawerLabel: getBibleVersionDisplayName(AppDefaults.drawerSelection) }}
      />
      {getSupportedBibleVersions()
        .filter((v) => v.key !== AppDefaults.drawerSelection)
        .map((version) => (
          <Drawer.Screen
            key={version.key}
            name={version.key} // points to your dynamic route file
            options={{
              drawerLabel: version.fullname, // you can map to full names if needed
            }}
          />
        ))}
    </Drawer>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const activeTintColor = useThemeColor({}, 'tint');
  const inactiveTintColor = useThemeColor({}, 'text');
  const supportedBibleVersions = getKeyListOfSupportedBibleVersions();

  // Create mapping of route.key to original index
  const routeIndexMap = new Map(
    props.state.routes.map((route: any, index: number) => [route.key, index]),
  );

  return (
    <DrawerContentScrollView {...props}>
      {/* Subtitle header for the group */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ThemedText type="subtitle" style={{ color: inactiveTintColor }}>
          Bible Versions
        </ThemedText>
      </View>

      {/* Manually render items, grouped under the subtitle */}
      {props.state.routes
        .filter((route: any) => supportedBibleVersions.includes(route.name)) // Hide index
        .map((route: any, index: number) => {
          const descriptor = props.descriptors[route.key];
          const label =
            descriptor.options.drawerLabel !== undefined
              ? descriptor.options.drawerLabel
              : descriptor.options.title !== undefined
                ? descriptor.options.title
                : route.name;

          // Lookup original index for accurate focused check
          const originalIndex = routeIndexMap.get(route.key)!;
          const focused = originalIndex === props.state.index;

          return (
            <DrawerItem
              key={route.key}
              label={label}
              focused={focused}
              activeTintColor={activeTintColor} // Customize active/inactive colors
              inactiveTintColor={inactiveTintColor}
              onPress={
                () => props.navigation.navigate(route.name, { timestamp: Date.now() }) // Match your custom navigation with timestamp
              }
            />
          );
        })}
    </DrawerContentScrollView>
  );
}
