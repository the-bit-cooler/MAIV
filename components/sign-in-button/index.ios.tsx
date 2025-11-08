import { useSignIn } from '@/hooks/use-sign-in';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function SignInButton() {
  const [disabled, setDisabled] = useState(false);
  const { signIn } = useSignIn();

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={24}
      style={{ width: '100%', height: 48, marginVertical: 6 }}
      aria-disabled={disabled}
      onPress={async () => {
        try {
          setDisabled(true);

          const resp = await AppleAuthentication.signInAsync();

          await signIn({ provider: 'apple', idToken: resp.identityToken ?? '' });
        } catch (error: any) {
          // 👇 Ignore user cancel
          if (error?.code === 'ERR_REQUEST_CANCELED' || error?.message?.includes('canceled')) {
            console.log('User canceled Apple sign-in.');
          } else {
            console.error('Apple sign-in error:', error);
            Alert.alert('Sign-In Error ⚠️', 'Something went wrong during Apple sign-in.');
          }
        } finally {
          setDisabled(false);
        }
      }}
    />
  );
}
