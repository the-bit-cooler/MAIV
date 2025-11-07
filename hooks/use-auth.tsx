import { UserPreferences } from '@/constants/user-preferences';
import { getSecureStorageKeyFromEmail } from '@/utilities/get-secure-storage-key-from-email';
import { constructAPIUrl } from '@/utilities/construct-api-url';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import { useAppPreferences } from './use-app-preferences-provider';

export function useAuth() {
  const { setSessionToken } = useAppPreferences();

  async function signIn() {
    try {
      if (Platform.OS === 'ios') {
        // 🍎 Native Apple Sign-In
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        if (!credential.identityToken) throw new Error('No identity token');

        await sendToBackend('apple', credential.identityToken);
      } else {
        // 🤖 Native Google Sign-In
        // ToDO: implement using @react-native-google-signin/google-signin
      }
    } catch (err: any) {
      // 👇 Ignore user cancel
      if (err?.code === 'ERR_CANCELED' || err?.message?.includes('canceled')) {
        console.log('User canceled Apple sign-in.');
        return;
      }

      console.error(err);
      Alert.alert('Sign In Failed', err.message ?? 'Something went wrong');
    }
  }

  async function sendToBackend(provider: 'apple' | 'google', idToken: string) {
    try {
      const apiUrl = constructAPIUrl(`auth-signin/${provider}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const { sessionToken, email } = await response.json();
        if (sessionToken) {
          const secureKey = getSecureStorageKeyFromEmail(email);
          const existingToken = await SecureStore.getItemAsync(secureKey);

          setSessionToken(sessionToken);
          await SecureStore.setItemAsync(UserPreferences.username, email);
          await SecureStore.setItemAsync(secureKey, sessionToken);

          if (existingToken) {
            Alert.alert('Welcome Back 👋', 'Your session has been securely refreshed.');
          } else {
            Alert.alert('Welcome ✨', 'Your account has been created and verified successfully.');
          }
        } else {
          // should never get here but
        }
      } else if (response.status === 400) {
        Alert.alert(
          'Missing Sign-In Token ❌',
          'We couldn’t find your sign-in token. Please try signing in again.',
        );
      } else if (response.status === 401) {
        Alert.alert(
          'Couldn’t Verify You ⚠️',
          'Your credentials couldn’t be verified. Please try signing in again.',
        );
      } else if (response.status === 404) {
        Alert.alert(
          'Missing account email 🔍',
          'We couldn’t retrieve your email from your provider. Please try signing in again.',
        );
      } else if (response.status === 500) {
        // Internal validation failure (server issue)
        Alert.alert(
          'Server Issue ⚙️',
          'We’re having trouble verifying your sign-in right now. Please try again in a moment.',
        );
      } else {
        Alert.alert(
          'Unexpected Error 😅',
          'Something went wrong during sign-in. Please try again.',
        );
      }
    } catch {
      Alert.alert(
        'Connection Problem 🚫',
        'Unable to reach our servers. Please check your internet connection and try again.',
      );
    }
  }

  return { signIn };
}
