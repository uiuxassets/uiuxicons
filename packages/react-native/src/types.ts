import type { ReactNode, Ref } from "react";
import type { ColorValue } from "react-native";
import type Svg from "react-native-svg";
import type { SvgProps } from "react-native-svg";

export type IconVariant = "line" | "duotone" | "solid";
export type IconWeight = "light" | "regular" | "bold";

/** Renders one variant; `accent` fills the duotone accent layer. */
export type VariantRenderer = (accent: ColorValue) => ReactNode;

export type VariantMap = {
  [V in IconVariant]: {
    [W in IconWeight]: VariantRenderer;
  };
};

export interface IconProps extends Omit<SvgProps, "children" | "color" | "ref"> {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: ColorValue;
  /** Duotone accent layer color (rendered at 25% opacity). Defaults to `color`. */
  accentColor?: ColorValue;
  ref?: Ref<Svg>;
  children?: never;
}

export interface IconProviderProps {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: ColorValue;
  accentColor?: ColorValue;
  children: ReactNode;
}

export interface IconInternalProps extends IconProps {
  variants: VariantMap;
}
