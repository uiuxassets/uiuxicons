import { use } from "react";
import { IconContext } from "./IconContext";
import type { IconProviderProps } from "./types";

export function IconProvider({
  variant,
  weight,
  size,
  color,
  children,
}: IconProviderProps) {
  const parent = use(IconContext);
  const merged = {
    variant: variant ?? parent.variant,
    weight: weight ?? parent.weight,
    size: size ?? parent.size,
    color: color ?? parent.color,
  };

  return (
    <IconContext value={merged}>
      {children}
    </IconContext>
  );
}
