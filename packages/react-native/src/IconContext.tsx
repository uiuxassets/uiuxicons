import { createContext } from "react";
import type { ColorValue } from "react-native";
import type { IconVariant, IconWeight } from "./types";

export interface IconDefaults {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: ColorValue;
  accentColor?: ColorValue;
}

export const IconContext = createContext<IconDefaults>({});
