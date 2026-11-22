import type { JSX } from "react";
import { Icon } from "./Icon";
import type { IconProps, VariantMap } from "./types";

export interface IconComponent {
  (props: IconProps): JSX.Element;
  displayName?: string;
}

export function createIcon(name: string, variants: VariantMap): IconComponent {
  function component(props: IconProps) {
    return <Icon variants={variants} {...props} />;
  }
  component.displayName = `Icon${name.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("")}`;
  return component;
}
