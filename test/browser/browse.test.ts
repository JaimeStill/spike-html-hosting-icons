// The browse page, browse/index.html, served as mise run browse serves it, by scripts/served.ts,
// over the dist/ mise run build writes, through what the page shows: every module the build wrote
// for every released set appears once, in its set's section, beside its name, and the section
// names the set's licence and its upstream tag, as sets.json and the set's info.json give them;
// each glyph is its module's default export as markup, an svg hidden from assistive technology and
// out of the tab order, drawn in currentColor, so its paint follows the text's color; the page
// renders in every profile the foundation's full entry registers, light and dark, at 1280 and 390
// px, with no sideways scroll, the glyphs' paint the text's in each and the schemes' backgrounds
// apart; a dark scheme the query names reaches the first load's glyphs; the page raises no error;
// and no request the page makes leaves the local origin.
// Adapted from spike-html-hosting-components (aa9d491): test/browser/site.test.ts, its server,
// browser, load, and profile runs.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, describe, test } from "node:test";

import { launch, SETTLED, until } from "@jaimestill/spike-html-apps-tooling/browser.js";
import type { Browser, Page } from "@jaimestill/spike-html-apps-tooling/browser.js";
import { serve } from "@jaimestill/spike-html-apps-tooling/server.js";
import type { Server } from "@jaimestill/spike-html-apps-tooling/server.js";

import { catalog, PAGE, root, served } from "../../scripts/served.ts";

/** The registry's names by facet, the first of each the default. */
interface Registry {
  color: string[];
  space: string[];
  type: string[];
}

/** One run: a profile's facets and scheme, and a width. */
interface Run {
  palette: string;
  space: string;
  type: string;
  scheme: string;
  width: number;
}

/** Every palette at the other facets' defaults, then each other space and type, each light and
 * dark, at 1280 and 390 px. */
function runs(registry: Registry): Run[] {
  const [palette] = registry.color;
  const [space] = registry.space;
  const [type] = registry.type;
  const profiles = [
    ...registry.color.map((name) => ({ palette: name, space, type })),
    ...registry.space.slice(1).map((name) => ({ palette, space: name, type })),
    ...registry.type.slice(1).map((name) => ({ palette, space, type: name })),
  ];
  return profiles.flatMap((profile) =>
    ["light", "dark"].flatMap((scheme) =>
      [1280, 390].map((width) => ({ ...profile, scheme, width })),
    ),
  );
}

/** The viewport's size. */
async function resize(page: Page, width: number, height = 800): Promise<void> {
  await page.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await until(page, `innerWidth === ${width} && innerHeight === ${height}`);
}

/** Every released set's icons, as `<set>/<name>`, in the catalog's order. */
const released = catalog(root).flatMap(({ name, icons }) => icons.map((icon) => `${name}/${icon}`));

/** Each released icon's module's default export, by `<set>/<name>`, as node imports it. */
const modules: Record<string, string> = Object.fromEntries(
  await Promise.all(
    released.map(async (icon) => {
      const url = pathToFileURL(join(root, "dist", `${icon}.js`)).href;
      const { default: svg } = (await import(url)) as { default: string };
      return [icon, svg] as const;
    }),
  ),
);

/** The glyphs, in a page expression: each list item of a set's section. */
const ITEMS = `[...document.querySelectorAll("section .glyphs > li")]`;

/**
 * Each glyph whose paint isn't the text's, in a page expression: an element of the glyph's svg
 * with a fill or a stroke whose computed value isn't the computed color of its list item. The
 * glyph is drawn only through currentColor, so each such value resolves to that color.
 */
const UNFOLLOWED = `${ITEMS}.flatMap((item) => {
  const color = getComputedStyle(item).color;
  return [...item.querySelectorAll(".glyph svg, .glyph svg *")].flatMap((element) =>
    ["fill", "stroke"]
      .filter((property) => element.hasAttribute(property))
      .map((property) => getComputedStyle(element)[property])
      .filter((value) => value !== color)
      .map((value) => item.dataset.icon + ": " + value + " against " + color),
  );
})`;

describe("the browse page", { timeout: 300_000 }, () => {
  let server: Server;
  let browser: Browser;
  let page: Page;
  const requests: string[] = [];
  before(async () => {
    server = await serve(served);
    browser = await launch();
    page = await browser.open("about:blank");
    page.on("Network.requestWillBeSent", ({ request }) => requests.push(request.url));
    await page.cdp("Network.enable");
  });
  after(async () => {
    await page?.close();
    await browser?.close();
    await server?.stop();
  });

  /** Loads the page at the viewport's width, its storage cleared, every glyph in it, rendered. */
  async function load(query = "", width = 1280) {
    await resize(page, width);
    await page.goto(`${server.origin}${PAGE}${query}`);
    await page.evaluate(`localStorage.clear()`);
    await page.goto(`${server.origin}${PAGE}${query}`);
    await page.evaluate(`window.ready.then(() => ${SETTLED})`);
  }

  test("shows every released icon once, in its set's section, beside its name", async () => {
    await load();
    const shown: { set: string; name: string; icon: string }[] = await page.evaluate(
      `${ITEMS}.map((item) => ({
        set: item.closest("section").querySelector("h2 code").textContent,
        name: item.querySelector(":scope > code").textContent,
        icon: item.dataset.icon,
      }))`,
    );
    assert.ok(released.length > 0, "sets.json releases no icon");
    assert.deepEqual(
      shown.map(({ set, name }) => `${set}/${name}`),
      released,
    );
    for (const { set, name, icon } of shown) assert.equal(icon, `${set}/${name}`);
  });

  test("heads each set's section with its licence and its upstream tag", async () => {
    await load();
    const sections: { name: string; about: string[] }[] = await page.evaluate(
      `[...document.querySelectorAll("main > section")].map((section) => ({
        name: section.querySelector("h2 code").textContent,
        about: [...section.querySelectorAll(".about > dd")].map((dd) => dd.textContent),
      }))`,
    );
    const sets = JSON.parse(readFileSync(join(root, "sets.json"), "utf8"));
    assert.deepEqual(
      sections.map(({ name }) => name),
      Object.keys(sets),
    );
    for (const set of catalog(root)) {
      const section = sections.find(({ name }) => name === set.name);
      assert.deepEqual(section?.about, [
        set.license.spdx ?? set.license.title,
        sets[set.name].license.tag,
        String(set.icons.length),
      ]);
    }
  });

  test("draws each glyph as its module's markup: hidden, unfocusable, in currentColor", async () => {
    await load();
    const problems: string[] = await page.evaluate(`(() => {
      const modules = ${JSON.stringify(modules)};
      const template = document.createElement("template");
      return ${ITEMS}.flatMap((item) => {
        const glyph = item.querySelector(".glyph");
        template.innerHTML = modules[item.dataset.icon];
        const svg = glyph.firstElementChild;
        const found = [];
        if (glyph.childNodes.length !== 1 || !svg.isEqualNode(template.content.firstChild)) {
          found.push("isn't its module's markup");
        }
        if (svg?.localName !== "svg") found.push("isn't an svg");
        if (svg?.getAttribute("aria-hidden") !== "true") found.push("isn't aria-hidden");
        if (svg?.getAttribute("focusable") !== "false") found.push("is focusable");
        if (!svg?.outerHTML.includes('"currentColor"')) found.push("isn't drawn in currentColor");
        return found.map((problem) => item.dataset.icon + " " + problem);
      });
    })()`);
    assert.deepEqual(problems, []);
  });

  test("renders in every profile, light and dark, at 1280 and 390 px, with no sideways scroll, the glyphs in the text's color", async () => {
    await load();
    const registry: Registry = await page.evaluate(`(() => {
      const store = globalThis[Symbol.for("spike-html-apps-foundation.registry")];
      return { color: store.color, space: store.space, type: store.type };
    })()`);
    assert.ok(registry.color.length > 1, "the full entry registers every palette");
    const backgrounds = new Map<string, string>();
    for (const run of runs(registry)) {
      const label = `${run.palette} ${run.space} ${run.type} ${run.scheme} at ${run.width}px`;
      await resize(page, run.width);
      const shown: { overflow: number; unfollowed: string[]; background: string } =
        await page.evaluate(`(async () => {
          const root = document.documentElement;
          root.dataset.palette = ${JSON.stringify(run.palette)};
          root.dataset.space = ${JSON.stringify(run.space)};
          root.dataset.type = ${JSON.stringify(run.type)};
          root.dataset.scheme = ${JSON.stringify(run.scheme)};
          await ${SETTLED};
          return {
            overflow: root.scrollWidth - root.clientWidth,
            unfollowed: ${UNFOLLOWED},
            background: getComputedStyle(document.body).backgroundColor,
          };
        })()`);
      assert.ok(shown.overflow <= 0, `${label}: scrolls sideways by ${shown.overflow}px`);
      assert.deepEqual(shown.unfollowed, [], label);
      backgrounds.set(`${run.palette} ${run.space} ${run.type} ${run.scheme}`, shown.background);
    }
    for (const palette of registry.color) {
      const [space] = registry.space;
      const [type] = registry.type;
      const light = backgrounds.get(`${palette} ${space} ${type} light`);
      const dark = backgrounds.get(`${palette} ${space} ${type} dark`);
      assert.notEqual(light, dark, `${palette}: light and dark share the background ${light}`);
    }
  });

  test("a dark scheme the query names reaches the first load's glyphs", async () => {
    await load();
    const light: string = await page.evaluate(`getComputedStyle(document.body).backgroundColor`);
    await load("?scheme=dark", 390);
    const dark: { background: string; scheme: string; unfollowed: string[] } =
      await page.evaluate(`({
        background: getComputedStyle(document.body).backgroundColor,
        scheme: document.documentElement.dataset.scheme,
        unfollowed: ${UNFOLLOWED},
      })`);
    assert.equal(dark.scheme, "dark");
    assert.notEqual(dark.background, light);
    assert.deepEqual(dark.unfollowed, []);
  });

  test("raises no error, and requests nothing outside the local origin", async () => {
    await load();
    assert.deepEqual(await page.evaluate(`window.errors`), []);
    const local = (url: string) => url.startsWith(`${server.origin}/`) || url === "about:blank";
    assert.ok(
      requests.some((url) => url.endsWith("/browse/catalog.js")),
      "it loads its catalog",
    );
    assert.ok(
      requests.some((url) => url.endsWith(`/dist/${released[0]}.js`)),
      "it imports the built modules",
    );
    assert.deepEqual(
      requests.filter((url) => !local(url)),
      [],
    );
  });
});
