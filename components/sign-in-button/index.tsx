import AppleSignInButton from '@/components/sign-in-button/apple-sign-in-button';
import GoogleSignInButton from '@/components/sign-in-button/google-sign-in-button';
import { UserPreferences } from '@/constants/user-preferences';
import { useAppPreferences } from '@/hooks/use-app-preferences-provider';
import { constructAPIUrl } from '@/utilities/construct-api-url';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

export default function SignInButton() {
  const { setSessionToken } = useAppPreferences();

  async function signIn(params: { provider: 'apple' | 'google'; idToken: string }) {
    try {
      const { provider, idToken } = params;
      const apiUrl = constructAPIUrl(`auth-sign-in/${provider}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const { sessionToken } = (await response.json()) as { sessionToken: string };
        if (sessionToken) {
          const existingToken = await SecureStore.getItemAsync(UserPreferences.session_token);

          setSessionToken(sessionToken);
          await SecureStore.setItemAsync(UserPreferences.session_token, sessionToken);

          if (existingToken) {
            Alert.alert('Welcome Back 👋', 'Your session has been securely refreshed.');
          } else {
            Alert.alert('Welcome ✨', 'Your account has been created and verified successfully.');
          }
        } else {
          // should never get here but
        }
      } else if (response.status === 401) {
        Alert.alert(
          'Couldn’t Verify You ⚠️',
          'Your credentials couldn’t be verified. Please try signing in again.',
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

  if (Platform.OS === 'ios') {
    return <AppleSignInButton onSignIn={signIn} />;
  }

  return <GoogleSignInButton onSignIn={signIn} />;
}
