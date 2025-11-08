import { makeRedirectUri } from 'expo-auth-session';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { coolDownAsync, maybeCompleteAuthSession, warmUpAsync } from 'expo-web-browser';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

maybeCompleteAuthSession();

type Props = {
  onSignIn: (params: { provider: 'google'; idToken: string }) => void;
};

export default function GoogleSignInButton({ onSignIn }: Props) {
  useEffect(() => {
    warmUpAsync();

    return () => {
      coolDownAsync();
    };
  }, []);

  const redirectUri = makeRedirectUri();

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
    scopes: ['openid'],
  });

  useEffect(() => {
    if (!response) return;

    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        onSignIn({ provider: 'google', idToken });
      } else {
        console.error('No id_token in token response');
        Alert.alert('Sign In Failed', 'Unable to retrieve ID token from Google.');
      }
    } else if (response?.type === 'dismiss' || response.type === 'cancel') {
      console.log('User canceled Google sign-in.');
    } else if (response?.type === 'error') {
      console.error('Google sign-in error:', response.error);
      Alert.alert('Sign In Failed', 'Something went wrong during Google sign-in.');
    } else {
      // Covers cases like response.type === 'cancel' or any unexpected type
      console.warn('Unexpected Google sign-in response:', response);
      Alert.alert(
        'Sign In Canceled',
        'You canceled or closed the Google sign-in window before completion.',
      );
    }
  }, [onSignIn, response]);

  const disabled = !request;

  return (
    <Pressable
      onPress={() => promptAsync()}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <View style={styles.imageWrapper}>
        <Image
          source={require('../../assets/images/google-sign-in-button.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  imageWrapper: {
    width: '100%',
    height: 64,
  },
  logo: {
    width: '100%',
    height: 64,
  },
});
