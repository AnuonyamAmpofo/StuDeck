import React from 'react';
import { Text, TextProps } from 'react-native';

export default function AppText({ style, children, ...rest }: TextProps) {
  return <Text {...rest} style={[{ fontFamily: 'Onest_400Regular', color: '#111827' }, style]}>{children}</Text>;
}
