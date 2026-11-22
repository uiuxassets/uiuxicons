import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Path } from "react-native-svg";
import { Icon } from "../packages/react-native/src/Icon";
import { createIcon } from "../packages/react-native/src/createIcon";
import { IconProvider } from "../packages/react-native/src/IconProvider";
import type { VariantMap } from "../packages/react-native/src/types";

// react-native-svg needs a native runtime; render host elements whose props
// are serialized so the tests can assert exactly what reaches the native view.
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  const host = (tag: string) =>
    ({ children, ...props }: { children?: ReactNode }) =>
      createElement(tag, { "data-props": JSON.stringify(props) }, children);
  return { default: host("svg"), Path: host("path") };
});

function propsOf(html: string, tag: string): Record<string, unknown>[] {
  return [...html.matchAll(new RegExp(`<${tag} data-props="([^"]*)"`, "g"))].map((m) =>
    JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")),
  );
}

const svgProps = (html: string) => propsOf(html, "svg")[0];

const mockVariants: VariantMap = {
  line: {
    light: () => <Path d="M1 1" fill="currentColor" />,
    regular: () => <Path d="M2 2" fill="currentColor" />,
    bold: () => <Path d="M3 3" fill="currentColor" />,
  },
  duotone: {
    light: (accent) => <><Path d="M4 4" fill={accent} fillOpacity="0.25" /><Path d="M4 5" fill="currentColor" /></>,
    regular: (accent) => <><Path d="M5 5" fill={accent} fillOpacity="0.25" /><Path d="M5 6" fill="currentColor" /></>,
    bold: (accent) => <><Path d="M6 6" fill={accent} fillOpacity="0.25" /><Path d="M6 7" fill="currentColor" /></>,
  },
  solid: {
    light: () => <Path d="M7 7" fill="currentColor" />,
    regular: () => <Path d="M8 8" fill="currentColor" />,
    bold: () => <Path d="M9 9" fill="currentColor" />,
  },
};

describe("Icon (React Native)", () => {
  it("renders a 24x24 Svg with the line-regular variant by default", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} />);
    expect(svgProps(html)).toMatchObject({ viewBox: "0 0 24 24", width: 24, height: 24 });
    expect(propsOf(html, "path")).toEqual([{ d: "M2 2", fill: "currentColor" }]);
  });

  it("applies custom size", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} size={32} />);
    expect(svgProps(html)).toMatchObject({ width: 32, height: 32 });
  });

  it("passes color to the Svg so currentColor resolves", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} color="red" />);
    expect(svgProps(html).color).toBe("red");
  });

  it("respects variant and weight props", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} variant="solid" weight="bold" />);
    expect(propsOf(html, "path")[0].d).toBe("M9 9");
  });

  it("fills the duotone accent with currentColor by default", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} variant="duotone" />);
    expect(propsOf(html, "path")).toEqual([
      { d: "M5 5", fill: "currentColor", fillOpacity: "0.25" },
      { d: "M5 6", fill: "currentColor" },
    ]);
  });

  it("fills the duotone accent with accentColor", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} variant="duotone" weight="light" accentColor="#8A38F5" />,
    );
    expect(propsOf(html, "path")[0]).toMatchObject({ d: "M4 4", fill: "#8A38F5" });
    expect(propsOf(html, "path")[1].fill).toBe("currentColor");
  });

  it("passes other Svg props through", () => {
    const html = renderToStaticMarkup(<Icon variants={mockVariants} testID="gear" />);
    expect(svgProps(html).testID).toBe("gear");
  });

  describe("accessibility", () => {
    it("is hidden from assistive technology by default", () => {
      const html = renderToStaticMarkup(<Icon variants={mockVariants} />);
      expect(svgProps(html)).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });
    });

    it("exposes an image with accessibilityLabel", () => {
      const html = renderToStaticMarkup(<Icon variants={mockVariants} accessibilityLabel="Settings" />);
      const props = svgProps(html);
      expect(props).toMatchObject({ accessible: true, accessibilityRole: "image", accessibilityLabel: "Settings" });
      expect(props).not.toHaveProperty("importantForAccessibility");
    });

    it("maps aria-label to accessibilityLabel", () => {
      const html = renderToStaticMarkup(<Icon variants={mockVariants} aria-label="Settings" />);
      const props = svgProps(html);
      expect(props).toMatchObject({ accessible: true, accessibilityLabel: "Settings" });
      expect(props).not.toHaveProperty("aria-label");
    });
  });
});

describe("createIcon (React Native)", () => {
  it("sets the correct displayName", () => {
    const TestIcon = createIcon("arrow-circle-down", mockVariants);
    expect(TestIcon.displayName).toBe("IconArrowCircleDown");
  });

  it("passes props through to Icon", () => {
    const TestIcon = createIcon("gear", mockVariants);
    const html = renderToStaticMarkup(<TestIcon variant="solid" weight="bold" size={48} />);
    expect(propsOf(html, "path")[0].d).toBe("M9 9");
    expect(svgProps(html).width).toBe(48);
  });
});

describe("IconProvider (React Native)", () => {
  it("provides defaults to child icons", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="duotone" weight="bold" size={20} color="blue" accentColor="green">
        <Icon variants={mockVariants} />
      </IconProvider>,
    );
    expect(svgProps(html)).toMatchObject({ width: 20, color: "blue" });
    expect(propsOf(html, "path")[0]).toMatchObject({ d: "M6 6", fill: "green" });
  });

  it("lets icon props override the provider", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" accentColor="green">
        <Icon variants={mockVariants} variant="duotone" accentColor="red" />
      </IconProvider>,
    );
    expect(propsOf(html, "path")[0]).toMatchObject({ d: "M5 5", fill: "red" });
  });

  it("merges nested providers", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" size={40}>
        <IconProvider weight="light">
          <Icon variants={mockVariants} />
        </IconProvider>
      </IconProvider>,
    );
    expect(propsOf(html, "path")[0].d).toBe("M7 7");
    expect(svgProps(html).width).toBe(40);
  });
});
