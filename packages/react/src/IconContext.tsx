import { createContext } from "react";
import type { IconVariant, IconWeight } from "./types";

export interface IconDefaults {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: string;
}

export const IconContext = createContext<IconDefaults>({});
