import { useCallback } from 'react';
import { Alert } from 'react-native';

import * as SecureStore from 'expo-secure-store';

import { UserPreferences } from '@/constants';
import { useAppContext } from '@/hooks/useAppContext';

export function useSignIn() {
  const { setSessionToken, constructAPIUrl } = useAppContext();
  const signIn = useCallback(
    async (params: { provider: 'apple' | 'google'; idToken: string }) => {
      try {
        const { provider, idToken } = params;
        const apiUrl = constructAPIUrl(`auth-sign-in/${provider}`);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          const { sessionToken, newUser } = (await response.json()) as {
            sessionToken: string;
            newUser: boolean;
          };
          if (sessionToken) {
            setSessionToken(sessionToken);
            await SecureStore.setItemAsync(UserPreferences.session_token, sessionToken);

            if (newUser) {
              Alert.alert('Welcome ✨', 'Your account has been created and verified successfully.');
            } else {
              Alert.alert('Welcome Back 👋', 'Your session has been securely refreshed.');
            }
          }
        } else if (response.status === 401) {
          Alert.alert(
            'Couldn’t Verify You ⚠️',
            'Your credentials couldn’t be verified. Please try signing in again.',
          );
        } else if (response.status === 500) {
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
    },
    [setSessionToken, constructAPIUrl],
  );

  return { signIn };
}
