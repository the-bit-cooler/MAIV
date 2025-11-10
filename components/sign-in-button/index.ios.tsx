import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';

import { UserPreferences } from '@/constants/user-preferences';
import { useAppContext } from '@/hooks/use-app-context';
import { useSignIn } from '@/hooks/use-sign-in';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SignInButton() {
  const [disabled, setDisabled] = useState(false);
  const { sessionToken, setSessionToken, theme } = useAppContext();
  const { signIn } = useSignIn();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  async function handleSignOut() {
    try {
      setDisabled(true);
      // Clear your local session data
      await SecureStore.deleteItemAsync(UserPreferences.session_token);
      setSessionToken(null);
      Alert.alert('Signed Out 👋', 'You have been securely signed out.');
    } catch (error) {
      console.error('Error during sign-out:', error);
      Alert.alert('Sign-Out Error ⚠️', 'Unable to complete sign-out. Please try again.');
    } finally {
      setDisabled(false);
    }
  }

  async function handleSignIn() {
    try {
      setDisabled(true);

      const resp = await AppleAuthentication.signInAsync();
      await signIn({ provider: 'apple', idToken: resp.identityToken ?? '' });
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED' || error?.message?.includes('canceled')) {
        console.log('User canceled Apple sign-in.');
      } else {
        console.error('Apple sign-in error:', error);
        Alert.alert('Sign-In Error ⚠️', 'Something went wrong during Apple sign-in.');
      }
    } finally {
      setDisabled(false);
    }
  }

  return sessionToken ? (
    <Pressable
      onPress={handleSignOut}
      disabled={disabled}
      style={{
        width: '100%',
        height: 48,
        marginVertical: 6,
        borderRadius: 24,
        backgroundColor: backgroundColor,
        borderWidth: 1,
        borderColor: textColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
    </Pressable>
  ) : (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        theme === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
      }
      cornerRadius={24}
      style={{ width: '100%', height: 48, marginVertical: 6 }}
      aria-disabled={disabled}
      onPress={handleSignIn}
    />
  );
}
