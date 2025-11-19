// ============================================================================
// ⚛️ React packages
// ============================================================================

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { PlatformPressable } from '@react-navigation/elements';
import { useMemo } from 'react';
import { View } from 'react-native';

// ============================================================================
// 🧩 Expo packages
// ============================================================================

import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { IconSymbol, SignInButton, ThemedText } from '@/components';
import { useAppContext, useThemeColor } from '@/hooks';
import { getKeyListOfSupportedBibleVersions, getSupportedBibleVersions } from '@/utilities';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

export default function DrawerLayout() {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const { readingLocation } = useAppContext();
  const router = useRouter();

  const tintColor = useThemeColor({}, 'tint');

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: 'front',
        drawerStyle: { width: '85%' },
        headerTitle: '', // Default to empty; Drawer pages will override
        headerTintColor: tintColor,
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
      }}
    >
      <Drawer.Screen
        name="index"
        initialParams={{ drawerSelection: readingLocation.drawerSelection }}
      />
      {getSupportedBibleVersions().map((version) => (
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

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

function CustomDrawerContent(props: DrawerContentComponentProps) {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const activeTintColor = useThemeColor({}, 'tint');
  const inactiveTintColor = useThemeColor({}, 'text');

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const supportedBibleVersions = getKeyListOfSupportedBibleVersions();

  // ============================================================================
  // 🧠 MEMOS & CALLBACKS (DERIVED LOGIC)
  // ============================================================================

  const routeMap = useMemo(() => {
    return new Map(props.state.routes.map((route, index) => [route.name, { route, index }]));
  }, [props.state.routes]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <DrawerContentScrollView {...props}>
      {/* 🔐 Sign-In button section */}
      <View style={{ padding: 16, marginBottom: 10 }}>
        <SignInButton />
      </View>

      {/* Subtitle header for the group */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ThemedText type="subtitle" style={{ color: inactiveTintColor }}>
          Bible Versions
        </ThemedText>
      </View>
      {supportedBibleVersions.map((version: string) => {
        const { route } = routeMap.get(version)!;
        if (!route) return null;
        const descriptor = props.descriptors[route.key];
        const label =
          descriptor.options.drawerLabel !== undefined
            ? descriptor.options.drawerLabel
            : descriptor.options.title !== undefined
              ? descriptor.options.title
              : route.name;

        const isFocused = props.state.routes[props.state.index].name === version;

        return (
          <DrawerItem
            key={route.key}
            label={label}
            focused={isFocused}
            activeTintColor={activeTintColor} // Customize active/inactive colors
            inactiveTintColor={inactiveTintColor}
            onPress={async () => {
              props.navigation.navigate(version, { timestamp: Date.now() });
            }}
          />
        );
      })}
    </DrawerContentScrollView>
  );
}
