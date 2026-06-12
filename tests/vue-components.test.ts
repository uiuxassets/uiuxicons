import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Icon } from "../packages/vue/src/Icon";
import { createIcon } from "../packages/vue/src/createIcon";
import { IconProvider } from "../packages/vue/src/IconProvider";
import type { VariantMap } from "../packages/vue/src/types";

const mockVariants: VariantMap = {
  line: {
    light: '<path d="M1 1" fill="currentColor"/>',
    regular: '<path d="M2 2" fill="currentColor"/>',
    bold: '<path d="M3 3" fill="currentColor"/>',
  },
  duotone: {
    light: '<path d="M4 4" fill="currentColor"/>',
    regular: '<path d="M5 5" fill="currentColor"/>',
    bold: '<path d="M6 6" fill="currentColor"/>',
  },
  solid: {
    light: '<path d="M7 7" fill="currentColor"/>',
    regular: '<path d="M8 8" fill="currentColor"/>',
    bold: '<path d="M9 9" fill="currentColor"/>',
  },
};

async function render(component: any, props: Record<string, unknown> = {}, children?: any) {
  const app = createSSRApp({ render: () => h(component, props, children) });
  return await renderToString(app);
}

describe("Icon", () => {
  it("renders default 24x24 SVG with line-regular variant", async () => {
    const html = await render(Icon, { variants: mockVariants });
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="24"');
    expect(html).toContain('height="24"');
    expect(html).toContain('d="M2 2"');
  });

  it("is aria-hidden by default", async () => {
    const html = await render(Icon, { variants: mockVariants });
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it("applies custom size", async () => {
    const html = await render(Icon, { variants: mockVariants, size: 32 });
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });

  it("applies color via style", async () => {
    const html = await render(Icon, { variants: mockVariants, color: "red" });
    expect(html).toContain("color:red");
  });

  it("respects variant prop", async () => {
    const html = await render(Icon, { variants: mockVariants, variant: "solid" });
    expect(html).toContain('d="M8 8"');
  });

  it("respects weight prop", async () => {
    const html = await render(Icon, {
      variants: mockVariants,
      variant: "line",
      weight: "bold",
    });
    expect(html).toContain('d="M3 3"');
  });

  it("renders duotone light", async () => {
    const html = await render(Icon, {
      variants: mockVariants,
      variant: "duotone",
      weight: "light",
    });
    expect(html).toContain('d="M4 4"');
  });

  it("applies class attribute", async () => {
    const html = await render(Icon, {
      variants: mockVariants,
      class: "my-icon",
    });
    expect(html).toContain('class="my-icon"');
  });

  describe("accessibility", () => {
    it("adds role=img when aria-label is provided", async () => {
      const html = await render(Icon, {
        variants: mockVariants,
        "aria-label": "Settings",
      });
      expect(html).toContain('role="img"');
      expect(html).not.toContain("aria-hidden");
    });

    it("renders title element when title prop is provided", async () => {
      const html = await render(Icon, {
        variants: mockVariants,
        title: "Settings gear",
      });
      expect(html).toContain("<title>Settings gear</title>");
      expect(html).toContain('role="img"');
    });

    it("adds role=img when aria-labelledby is provided", async () => {
      const html = await render(Icon, {
        variants: mockVariants,
        "aria-labelledby": "label-id",
      });
      expect(html).toContain('role="img"');
    });
  });
});

describe("createIcon", () => {
  it("creates a component that renders correctly", async () => {
    const TestIcon = createIcon("test-icon", mockVariants);
    const html = await render(TestIcon);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('d="M2 2"');
  });

  it("sets the correct component name", () => {
    const TestIcon = createIcon("arrow-circle-down", mockVariants);
    expect(TestIcon.name).toBe("IconArrowCircleDown");
  });

  it("passes props through to Icon", async () => {
    const TestIcon = createIcon("gear", mockVariants);
    const html = await render(TestIcon, {
      variant: "solid",
      weight: "bold",
      size: 48,
    });
    expect(html).toContain('d="M9 9"');
    expect(html).toContain('width="48"');
  });
});

describe("IconProvider", () => {
  it("provides default variant and weight to child icons", async () => {
    const html = await render(
      IconProvider,
      { variant: "solid", weight: "bold" },
      () => h(Icon, { variants: mockVariants }),
    );
    expect(html).toContain('d="M9 9"');
  });

  it("provides default size to child icons", async () => {
    const html = await render(
      IconProvider,
      { size: 48 },
      () => h(Icon, { variants: mockVariants }),
    );
    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });

  it("provides default color to child icons", async () => {
    const html = await render(
      IconProvider,
      { color: "blue" },
      () => h(Icon, { variants: mockVariants }),
    );
    expect(html).toContain("color:blue");
  });

  it("explicit props on Icon override provider defaults", async () => {
    const html = await render(
      IconProvider,
      { variant: "solid", size: 48 },
      () => h(Icon, { variants: mockVariants, variant: "duotone", size: 16 }),
    );
    expect(html).toContain('d="M5 5"');
    expect(html).toContain('width="16"');
  });

  it("nested providers: inner overrides outer", async () => {
    const html = await render(
      IconProvider,
      { variant: "solid", size: 48 },
      () =>
        h(IconProvider, { variant: "duotone", weight: "light" }, () =>
          h(Icon, { variants: mockVariants }),
        ),
    );
    expect(html).toContain('d="M4 4"');
    expect(html).toContain('width="48"');
  });

  it("works with createIcon components", async () => {
    const TestIcon = createIcon("gear", mockVariants);
    const html = await render(
      IconProvider,
      { variant: "solid", weight: "bold", size: 32 },
      () => h(TestIcon),
    );
    expect(html).toContain('d="M9 9"');
    expect(html).toContain('width="32"');
  });
});

describe("title XSS prevention", () => {
  it("escapes HTML in title prop", async () => {
    const html = await render(Icon, {
      variants: mockVariants,
      title: '<script>alert(1)</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
