import type { SVGProps, ReactNode, Ref } from "react";

export type IconVariant = "line" | "duotone" | "solid";
export type IconWeight = "light" | "regular" | "bold";

export type VariantMap = {
  [V in IconVariant]: {
    [W in IconWeight]: ReactNode;
  };
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: string;
  ref?: Ref<SVGSVGElement>;
  children?: never;
}

export interface IconProviderProps {
  variant?: IconVariant;
  weight?: IconWeight;
  size?: number | string;
  color?: string;
  children: ReactNode;
}

export interface IconInternalProps extends IconProps {
  variants: VariantMap;
}
