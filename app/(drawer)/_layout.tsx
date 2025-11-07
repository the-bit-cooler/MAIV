import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { AppDefaults } from '@/constants/app-defaults';
import { UserPreferences } from '@/constants/user-preferences';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { useAuth } from '@/hooks/use-auth';
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
import { NavigationRoute, ParamListBase } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Platform, View } from 'react-native';

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
  const { sessionToken } = useAppPreferences();
  const activeTintColor = useThemeColor({}, 'tint');
  const inactiveTintColor = useThemeColor({}, 'text');
  const supportedBibleVersions = getKeyListOfSupportedBibleVersions();
  const { signIn } = useAuth();

  const routeMap = new Map(
    props.state.routes.map((route: NavigationRoute<ParamListBase, string>, index: number) => [
      route.name,
      { route, index },
    ]),
  );

  return (
    <DrawerContentScrollView {...props}>
      {/* 🔐 Sign-In button section */}
      {!sessionToken && (
        <View style={{ padding: 16, borderBottomWidth: 0.5, borderColor: '#ccc' }}>
          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={{ width: '100%', height: 44 }}
              onPress={signIn}
            />
          ) : (
            <></>
          )}
        </View>
      )}

      {/* Subtitle header for the group */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ThemedText type="subtitle" style={{ color: inactiveTintColor }}>
          Bible Versions
        </ThemedText>
      </View>
      {supportedBibleVersions.map((version: string) => {
        const { route, index } = routeMap.get(version)!;
        if (!route) return null;
        const descriptor = props.descriptors[route.key];
        const label =
          descriptor.options.drawerLabel !== undefined
            ? descriptor.options.drawerLabel
            : descriptor.options.title !== undefined
              ? descriptor.options.title
              : route.name;

        return (
          <DrawerItem
            key={route.key}
            label={label}
            focused={index === props.state.index}
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
