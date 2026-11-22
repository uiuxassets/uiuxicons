import { use } from "react";
import Svg from "react-native-svg";
import { IconContext } from "./IconContext";
import type { IconInternalProps } from "./types";

export function Icon({
  ref,
  variants,
  variant,
  weight,
  size,
  color,
  accentColor,
  accessibilityLabel,
  "aria-label": ariaLabel,
  ...rest
}: IconInternalProps) {
  const defaults = use(IconContext);
  const resolvedVariant = variant ?? defaults.variant ?? "line";
  const resolvedWeight = weight ?? defaults.weight ?? "regular";
  const resolvedSize = size ?? defaults.size ?? 24;
  const resolvedColor = color ?? defaults.color;
  const resolvedAccent = accentColor ?? defaults.accentColor ?? "currentColor";

  const content = variants[resolvedVariant][resolvedWeight](resolvedAccent);

  // Svg is a native view, so the aria-* to accessibility* mapping that
  // <View> performs never happens; set the native props directly.
  const label = accessibilityLabel ?? ariaLabel;
  const a11yProps = label
    ? { accessible: true, accessibilityRole: "image" as const, accessibilityLabel: label }
    : {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants" as const,
      };

  return (
    <Svg
      ref={ref}
      viewBox="0 0 24 24"
      width={resolvedSize}
      height={resolvedSize}
      color={resolvedColor}
      {...a11yProps}
      {...rest}
    >
      {content}
    </Svg>
  );
}
