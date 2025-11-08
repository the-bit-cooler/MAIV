import { useSignIn } from '@/hooks/use-sign-in';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

export default function SignInButton() {
  const [disabled, setDisabled] = useState(false);
  const { signIn } = useSignIn();

  useEffect(() => {
    GoogleSignin.configure();
  }, []);

  const onSignIn = async () => {
    try {
      setDisabled(true);

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const idToken = response.data?.idToken;
        if (idToken) {
          await signIn({ provider: 'google', idToken });
        } else {
          console.error('No id_token in token response');
          Alert.alert(
            'Sign-In Failed 😞',
            'Unable to retrieve ID token from Google. Please try again.',
          );
        }
      } else {
        // 👇 Ignore user cancel
        console.log('User canceled Google sign-in.');
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            Alert.alert(
              'In Progress ⏰',
              'Sign in is already in progress. Please wait until finished.',
            );
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            Alert.alert(
              'Google Play services missing 🔍',
              'We cannot sign you in without Google Play services. Please check if they are available to install.',
            );
            break;
          default:
            Alert.alert(
              'Sign-In Error ⚠️',
              'Something went wrong during Google sign-in. Please try again.',
            );
        }
      } else {
        console.error('Unexpected Google sign-in response:', error);
        Alert.alert(
          'Unexpected Response 🚫',
          'An unexpected issue occurred during Google sign-in.',
        );
      }
    } finally {
      setDisabled(false);
    }
  };

  return (
    <Pressable
      onPress={onSignIn}
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
