declare module 'react-native-global-props' {
  import { TextProps, TextInputProps } from 'react-native';

  export function setCustomText(customProps: Partial<TextProps>): void;
  export function setCustomTextInput(customProps: Partial<TextInputProps>): void;
}
