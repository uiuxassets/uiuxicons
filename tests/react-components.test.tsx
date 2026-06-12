import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "../packages/react/src/Icon";
import { createIcon } from "../packages/react/src/createIcon";
import { IconProvider } from "../packages/react/src/IconProvider";
import type { VariantMap } from "../packages/react/src/types";

const mockVariants: VariantMap = {
  line: {
    light: <path d="M1 1" fill="currentColor" />,
    regular: <path d="M2 2" fill="currentColor" />,
    bold: <path d="M3 3" fill="currentColor" />,
  },
  duotone: {
    light: <path d="M4 4" fill="currentColor" />,
    regular: <path d="M5 5" fill="currentColor" />,
    bold: <path d="M6 6" fill="currentColor" />,
  },
  solid: {
    light: <path d="M7 7" fill="currentColor" />,
    regular: <path d="M8 8" fill="currentColor" />,
    bold: <path d="M9 9" fill="currentColor" />,
  },
};

describe("Icon", () => {
  it("renders default 24x24 SVG with line-regular variant", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} />,
    );
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="24"');
    expect(html).toContain('height="24"');
    expect(html).toContain('d="M2 2"');
  });

  it("is aria-hidden by default", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} />,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it("applies custom size", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} size={32} />,
    );
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });

  it("applies color via style", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} color="red" />,
    );
    expect(html).toContain("color:red");
  });

  it("respects variant prop", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} variant="solid" />,
    );
    expect(html).toContain('d="M8 8"');
  });

  it("respects weight prop", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} variant="line" weight="bold" />,
    );
    expect(html).toContain('d="M3 3"');
  });

  it("renders duotone light", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} variant="duotone" weight="light" />,
    );
    expect(html).toContain('d="M4 4"');
  });

  it("applies className", () => {
    const html = renderToStaticMarkup(
      <Icon variants={mockVariants} className="my-icon" />,
    );
    expect(html).toContain('class="my-icon"');
  });

  describe("accessibility", () => {
    it("adds role=img when aria-label is provided", () => {
      const html = renderToStaticMarkup(
        <Icon variants={mockVariants} aria-label="Settings" />,
      );
      expect(html).toContain('role="img"');
      expect(html).not.toContain('aria-hidden');
    });

    it("renders title element when title prop is provided", () => {
      const html = renderToStaticMarkup(
        <Icon variants={mockVariants} title="Settings gear" />,
      );
      expect(html).toContain("<title>Settings gear</title>");
      expect(html).toContain('role="img"');
    });

    it("adds role=img when aria-labelledby is provided", () => {
      const html = renderToStaticMarkup(
        <Icon variants={mockVariants} aria-labelledby="label-id" />,
      );
      expect(html).toContain('role="img"');
    });
  });
});

describe("createIcon", () => {
  it("creates a component that renders correctly", () => {
    const TestIcon = createIcon("test-icon", mockVariants);
    const html = renderToStaticMarkup(<TestIcon />);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('d="M2 2"');
  });

  it("sets the correct displayName", () => {
    const TestIcon = createIcon("arrow-circle-down", mockVariants);
    expect(TestIcon.displayName).toBe("IconArrowCircleDown");
  });

  it("passes props through to Icon", () => {
    const TestIcon = createIcon("gear", mockVariants);
    const html = renderToStaticMarkup(
      <TestIcon variant="solid" weight="bold" size={48} />,
    );
    expect(html).toContain('d="M9 9"');
    expect(html).toContain('width="48"');
  });
});

describe("IconProvider", () => {
  it("provides default variant and weight to child icons", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" weight="bold">
        <Icon variants={mockVariants} />
      </IconProvider>,
    );
    expect(html).toContain('d="M9 9"');
  });

  it("provides default size to child icons", () => {
    const html = renderToStaticMarkup(
      <IconProvider size={48}>
        <Icon variants={mockVariants} />
      </IconProvider>,
    );
    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });

  it("provides default color to child icons", () => {
    const html = renderToStaticMarkup(
      <IconProvider color="blue">
        <Icon variants={mockVariants} />
      </IconProvider>,
    );
    expect(html).toContain("color:blue");
  });

  it("explicit props on Icon override provider defaults", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" size={48}>
        <Icon variants={mockVariants} variant="duotone" size={16} />
      </IconProvider>,
    );
    expect(html).toContain('d="M5 5"');
    expect(html).toContain('width="16"');
  });

  it("nested providers: inner overrides outer", () => {
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" size={48}>
        <IconProvider variant="duotone" weight="light">
          <Icon variants={mockVariants} />
        </IconProvider>
      </IconProvider>,
    );
    expect(html).toContain('d="M4 4"');
    expect(html).toContain('width="48"');
  });

  it("works with createIcon components", () => {
    const TestIcon = createIcon("gear", mockVariants);
    const html = renderToStaticMarkup(
      <IconProvider variant="solid" weight="bold" size={32}>
        <TestIcon />
      </IconProvider>,
    );
    expect(html).toContain('d="M9 9"');
    expect(html).toContain('width="32"');
  });
});
