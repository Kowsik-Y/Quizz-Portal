import { Platform } from 'react-native';
import { setCustomText, setCustomTextInput } from 'react-native-global-props';
export function configureFonts() {
  if (Platform.OS === 'web') {
    return;
  }

  const customTextProps = {
    style: {
      fontFamily: 'Poppins_400Regular',
    },
  };

  const customTextInputProps = {
    style: {
      fontFamily: 'Poppins_400Regular',
    },
  };

  setCustomText(customTextProps);
  setCustomTextInput(customTextInputProps);
}
