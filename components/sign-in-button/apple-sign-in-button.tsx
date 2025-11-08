import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert } from 'react-native';

type AppleSignInButtonProps = {
  onSignIn: (params: { provider: 'apple'; idToken: string }) => void;
};

export default function AppleSignInButton({ onSignIn }: AppleSignInButtonProps) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={24}
      style={{ width: '100%', height: 48, marginVertical: 6 }}
      onPress={async () => {
        try {
          const resp = await AppleAuthentication.signInAsync();

          onSignIn({ provider: 'apple', idToken: resp.identityToken ?? '' });
        } catch (error: any) {
          // 👇 Ignore user cancel
          if (error?.code === 'ERR_REQUEST_CANCELED' || error?.message?.includes('canceled')) {
            console.log('User canceled Apple sign-in.');
          } else {
            console.error('Apple sign-in error:', error);
            Alert.alert('Sign In Failed', 'Something went wrong during Apple sign-in.');
          }
        }
      }}
    />
  );
}
