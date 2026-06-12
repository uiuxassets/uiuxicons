import { use } from "react";
import { IconContext } from "./IconContext";
import type { IconInternalProps } from "./types";

export function Icon({
  ref,
  variants,
  variant,
  weight,
  size,
  color,
  style,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  title,
  ...rest
}: IconInternalProps) {
  const defaults = use(IconContext);
  const resolvedVariant = variant ?? defaults.variant ?? "line";
  const resolvedWeight = weight ?? defaults.weight ?? "regular";
  const resolvedSize = size ?? defaults.size ?? 24;
  const resolvedColor = color ?? defaults.color;

  const content = variants[resolvedVariant][resolvedWeight];

  const mergedStyle = resolvedColor
    ? { ...style, color: style?.color ?? resolvedColor }
    : style;

  const hasLabel = !!(ariaLabel || ariaLabelledby || ariaDescribedby || title);
  const a11yProps = hasLabel
    ? { role: "img" as const }
    : { "aria-hidden": true as const, focusable: "false" as const };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={resolvedSize}
      height={resolvedSize}
      style={mergedStyle}
      className={className}
      {...a11yProps}
      {...rest}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
}
