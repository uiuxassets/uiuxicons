import type { InjectionKey, SVGAttributes } from "vue";

export type IconVariant = "line" | "duotone" | "solid";
export type IconWeight = "light" | "regular" | "bold";

export type VariantMap = {
  [V in IconVariant]: {
    [W in IconWeight]: string;
  };
};

export interface IconProps extends /* @vue-ignore */ Omit<SVGAttributes, "innerHTML"> {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: string;
  title?: string;
}

export interface IconProviderProps {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: string;
}

export const ICON_DEFAULTS_KEY: InjectionKey<IconProviderProps> = Symbol("uiuxicons");
