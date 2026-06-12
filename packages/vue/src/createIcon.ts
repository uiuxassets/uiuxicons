import { defineComponent, h, type PropType } from "vue";
import { Icon } from "./Icon";
import type { IconVariant, IconWeight, VariantMap } from "./types";

export function createIcon(name: string, variants: VariantMap) {
  return defineComponent({
    name: `Icon${name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")}`,
    props: {
      variant: { type: String as PropType<IconVariant>, default: undefined },
      weight: { type: String as PropType<IconWeight>, default: undefined },
      size: { type: [Number, String] as PropType<number | string>, default: undefined },
      color: { type: String, default: undefined },
      title: { type: String, default: undefined },
    },
    setup(props, { attrs }) {
      return () => h(Icon, { ...props, ...attrs, variants });
    },
  });
}
