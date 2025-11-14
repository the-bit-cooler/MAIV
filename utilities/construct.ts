export const constructAPIUrl = (path: string): string => {
  return `${process.env.EXPO_PUBLIC_AZURE_FUNCTION_URL}${path}?code=${process.env.EXPO_PUBLIC_AZURE_FUNCTION_KEY}`;
};
