// This file is a fallback for using MaterialIcons on Android and web.
import Foundation from '@expo/vector-icons/Foundation';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';
// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  'house.fill': { library: 'MaterialIcons', name: 'home' },
  'paperplane.fill': { library: 'MaterialIcons', name: 'send' },
  'chevron.left.forwardslash.chevron.right': {
    library: 'MaterialIcons',
    name: 'code',
  },
  'chevron.right': { library: 'MaterialIcons', name: 'chevron-right' },
  'graph-pie': { library: 'Foundation', name: 'graph-pie' },
  camera: { library: 'Foundation', name: 'camera' },
  'receipt-outline': { library: 'Ionicons', name: 'receipt-outline' },
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: keyof typeof MAPPING;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
}) {
  const iconMapping = MAPPING[name];

  if (!iconMapping) {
    console.error(`Icon "${name}" is not mapped.`);
    return null;
  }

  const { library, name: iconName } = iconMapping;

  switch (library) {
    case 'MaterialIcons':
      return (
        <MaterialIcons
          color={color}
          size={size}
          name={iconName}
          style={style}
        />
      );
    case 'Foundation':
      return (
        <Foundation color={color} size={size} name={iconName} style={style} />
      );
    case 'Ionicons':
      return (
        <Ionicons color={color} size={size} name={iconName} style={style} />
      );
    default:
      console.error(`Unsupported icon library: "${library}"`);
      return null;
  }
}
