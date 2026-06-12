import { defineComponent, h, inject, type PropType } from "vue";
import type { IconVariant, IconWeight, VariantMap } from "./types";
import { ICON_DEFAULTS_KEY } from "./types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const Icon = defineComponent({
  name: "Icon",
  props: {
    variants: { type: Object as PropType<VariantMap>, required: true },
    variant: { type: String as PropType<IconVariant>, default: undefined },
    weight: { type: String as PropType<IconWeight>, default: undefined },
    size: { type: [Number, String] as PropType<number | string>, default: undefined },
    color: { type: String, default: undefined },
    title: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    const defaults = inject(ICON_DEFAULTS_KEY, {});

    return () => {
      const variant = props.variant ?? defaults.variant ?? "line";
      const weight = props.weight ?? defaults.weight ?? "regular";
      const size = props.size ?? defaults.size ?? 24;
      const color = props.color ?? defaults.color;

      const content = props.variants[variant][weight];

      const hasLabel = !!(
        props.title ||
        attrs["aria-label"] ||
        attrs["aria-labelledby"] ||
        attrs["aria-describedby"]
      );

      const a11yAttrs = hasLabel
        ? { role: "img" }
        : { "aria-hidden": "true", focusable: "false" };

      const style = color ? { color } : undefined;

      return h("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        style,
        ...a11yAttrs,
        ...attrs,
        innerHTML:
          (props.title ? `<title>${escapeHtml(props.title)}</title>` : "") +
          content,
      });
    };
  },
});
