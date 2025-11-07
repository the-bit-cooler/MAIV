type UserDirective = {
  title: string;
  message: string;
};

export function getUserDirective(status: string): UserDirective {
  switch (status) {
    case 'retry':
      return {
        title: '⚠️ Try Again',
        message: 'Something went wrong while checking your account. Please try again.',
      };
    case 'signup':
      return {
        title: '⏰ Sign Up or Sign In',
        message:
          'Please sign up or sign in to gain access to a free tier of monthly credits for generating AI content for this feature.\n\nAny content already generated will be made available regardless of sign-in status or exhausted monthly credits.',
      };
    case 'exhausted':
      return {
        title: '🚫 Out of Credits',
        message:
          'You’ve used all your available AI credits. Consider upgrading (if available) or waiting for your next monthly refresh.',
      };
    case 'error':
      return {
        title: '💥 Server Error',
        message: 'A server error occurred while processing your request. Please try again later.',
      };
    default:
      return {
        title: '🤔 Unexpected Issue',
        message: 'An unexpected issue occurred. Please try again.',
      };
  }
}
