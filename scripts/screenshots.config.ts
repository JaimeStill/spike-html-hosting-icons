// mise run screenshots' description, which spike-html-apps-tooling's spike-html-apps-screenshots
// reads: the browse page, whole, in tiles, wide and narrow, and in its viewport with its theme
// menu open, opened by the Theme button's click and ready once the menu's dialog is open, wide and
// narrow; the profile's facets, palette, space, and type, at flexoki, regular, and mono; --all's
// profiles, every palette at the defaults, then compact and sans at flexoki; the profiles the page
// registers, from the foundation's registry; and the page served as the browser tier serves it, by
// scripts/served.ts. The files go to a fresh directory under TMPDIR, or to --dir's, never into the
// repository unless --dir names its gitignored captures/.
// Adapted from spike-html-hosting-sdk (v0.4.0): src/screenshots.ts, its states, its theme menu's
// open step, its facets, --all, and registry read, on the one page.

import { until } from "@jaimestill/spike-html-apps-tooling/browser.js";
import type {
  DescribedState,
  Description,
  Step,
} from "@jaimestill/spike-html-apps-tooling/screenshots.js";

import { PAGE, served } from "./served.ts";

// A desktop's width, and, below the theme menu's 48rem breakpoint, a phone's.
const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 390, height: 844 };

/** Resolves once the page has every glyph in it. */
const ready: Step = async (page) => {
  await page.evaluate(`window.ready`);
};

/** Opens the theme menu: the Theme button's command="--open", as a click sends it to
 * <sl-theme-menu>. */
const openThemeMenu: Step = async (page) => {
  await ready(page);
  await page.evaluate(`document.querySelector("button[commandfor=theme]").click()`);
  await until(page, `document.querySelector("sl-theme-menu dialog")?.open`);
};

const states: DescribedState[] = [
  {
    name: "browse-wide",
    caption: "the browse page, wide",
    viewport: WIDE,
    full: true,
    open: ready,
  },
  {
    name: "browse-narrow",
    caption: "the browse page, narrow",
    viewport: NARROW,
    full: true,
    open: ready,
  },
  {
    name: "browse-theme-menu-wide",
    caption: "the browse page, the theme menu open, wide",
    viewport: WIDE,
    full: false,
    open: openThemeMenu,
  },
  {
    name: "browse-theme-menu-narrow",
    caption: "the browse page, the theme menu open, narrow",
    viewport: NARROW,
    full: false,
    open: openThemeMenu,
  },
];

/** The page's registered names, by flag, read from the foundation's store at its well-known
 * global key; its color facet is palette's. */
const REGISTRY = `(() => {
  const store = globalThis[Symbol.for("spike-html-apps-foundation.registry")] ?? {};
  return { palette: store.color ?? [], space: store.space ?? [], type: store.type ?? [] };
})()`;

const description: Description = {
  pages: [{ name: "browse", caption: "the browse page", path: PAGE, states }],
  facets: [
    { flag: "palette", attribute: "data-palette", default: "flexoki" },
    { flag: "space", attribute: "data-space", default: "regular" },
    { flag: "type", attribute: "data-type", default: "mono" },
  ],
  // Every color at the defaults, then the other space and the other type at the default color.
  all: [
    ...["flexoki", "primer", "catppuccin", "everforest"].map((palette) => ({ palette })),
    { space: "compact" },
    { type: "sans" },
  ],
  profiles: (page) => page.evaluate(REGISTRY),
  server: served,
};

export default description;
