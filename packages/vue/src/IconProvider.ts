import { defineComponent, h, inject, provide, type PropType } from "vue";
import type { IconVariant, IconWeight } from "./types";
import { ICON_DEFAULTS_KEY } from "./types";

export const IconProvider = defineComponent({
  name: "IconProvider",
  props: {
    variant: { type: String as PropType<IconVariant>, default: undefined },
    weight: { type: String as PropType<IconWeight>, default: undefined },
    size: { type: [Number, String] as PropType<number | string>, default: undefined },
    color: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const parent = inject(ICON_DEFAULTS_KEY, {});
    provide(ICON_DEFAULTS_KEY, {
      variant: props.variant ?? parent.variant,
      weight: props.weight ?? parent.weight,
      size: props.size ?? parent.size,
      color: props.color ?? parent.color,
    });
    return () => slots.default?.();
  },
});
