#!/usr/bin/env -S deno run --allow-read
import { readLines } from "https://deno.land/std@0.125.0/io/mod.ts";
import * as path from "https://deno.land/std@0.125.0/path/mod.ts";
import MarkdownIt from "https://esm.sh/markdown-it@12.3.2";

// async function jamon() {
//   const json = await data_stdin();
//   const o = JSON.parse(json.join(""));
//   console.log(o.title);
//   return o.title;
// }

type ArrayOptions = { container?: string; item?: string };
type ImageOptions = { ids?: string[]; width?: string; height?: string };
type CLIOptions = {
  markdown?: boolean;
  array?: ArrayOptions;
  images?: ImageOptions;
};
async function json2html(filename: string, options: CLIOptions = {}) {
  const json = await data_file(filename);
  const origin = JSON.parse(json.join(""));

  const markdown = options?.markdown;
  const html_elements = [];
  if (Array.isArray(origin)) {
    const container = options?.array?.container;
    const item = options?.array?.item;
    const ids = options?.images?.ids;
    const width = options?.images?.width;
    const height = options?.images?.height;
    const image = { ids, width, height };
    for (const [key, val] of Object.entries(origin)) {
      html_elements.push(
        build_array_html(key, val, { container, item, image, markdown })
      );
    }
  } else {
    for (const [key, val] of Object.entries(origin)) {
      html_elements.push(build_html({ key, val, markdown }));
    }
  }
  return html_elements.join("\n");
}

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.125.0/testing/asserts.ts";
Deno.test("can parse string value", async function () {
  assert(
    (await json2html("simple.json"))
      .split("\n")
      .includes('<div id="title">parsed</div>')
  );
});

Deno.test("can parse number value", async function () {
  assert(
    (await json2html("simple.json"))
      .split("\n")
      .includes('<div id="id">31337</div>')
  );
});

Deno.test("can parse true value", async function () {
  assert(
    (await json2html("simple.json"))
      .split("\n")
      .includes('<div id="sexy">true</div>')
  );
});

Deno.test("can parse false value", async function () {
  assert(
    (await json2html("simple.json"))
      .split("\n")
      .includes('<div id="human">false</div>')
  );
});

Deno.test("can parse null value", async function () {
  assert(
    (await json2html("simple.json"))
      .split("\n")
      .includes('<div id="password">null</div>')
  );
});

Deno.test("can parse array values", async function () {
  const html = `<div id="title">parsed</div>
<div id="id">31337</div>
<div id="sexy">true</div>
<div id="human">false</div>
<div id="password">null</div>
<ul id="random_numbers">
  <li id="0">9</li>
  <li id="1">123</li>
  <li id="2">546</li>
  <li id="3">0</li>
</ul>`;
  assertEquals(await json2html("simple.json"), html);
});

Deno.test("can parse array with arrays values", async function () {
  const html = `<div id="title">deeper</div>
<ul id="matrix">
  <li id="0">a</li>
  <li id="1">b</li>
  <li id="2">c</li>
  <ul id="3">
    <li id="0">def</li>
    <ul id="1">
      <li id="0">ghi</li>
    </ul>
    <li id="2">j</li>
  </ul>
  <li id="4">k</li>
</ul>`;
  assertEquals(await json2html("arrayOfarrays.json"), html);
});

Deno.test("can parse object value", async function () {
  const html = `<div id="title">object json</div>
<div id="id">31337</div>
<div id="sexy">true</div>
<div id="human">false</div>
<div id="password">null</div>
<div id="fancy-object">
  <div id="title">fancy</div>
  <div id="description">lorem text for the sake of test this out!</div>
</div>`;
  assertEquals(await json2html("_object.json"), html);
});

Deno.test("can parse array with objects", async function () {
  const html = `<ul id="0">
  <li id="title">cage gif</li>
  <li id="description">gif description...</li>
  <li id="image">https://www.placecage.com/gif/200/300</li>
</ul>
<ul id="1">
  <li id="title">cage crazy</li>
  <li id="description">crazy description...</li>
  <li id="image">https://www.placecage.com/c/200/300</li>
</ul>`;
  assertEquals(await json2html("_arrayOfObjects.json"), html);
});

Deno.test(
  "can change container and item elements when source is an array",
  async function () {
    let html = `<div id="0">
  <div id="title">cage gif</div>
  <div id="description">gif description...</div>
  <div id="image">https://www.placecage.com/gif/200/300</div>
</div>
<div id="1">
  <div id="title">cage crazy</div>
  <div id="description">crazy description...</div>
  <div id="image">https://www.placecage.com/c/200/300</div>
</div>`;
    let array_opts = { array: { container: "div", item: "div" } };
    assertEquals(await json2html("_arrayOfObjects.json", array_opts), html);

    html = `<article id="0">
  <p id="title">cage gif</p>
  <p id="description">gif description...</p>
  <p id="image">https://www.placecage.com/gif/200/300</p>
</article>
<article id="1">
  <p id="title">cage crazy</p>
  <p id="description">crazy description...</p>
  <p id="image">https://www.placecage.com/c/200/300</p>
</article>`;
    array_opts = { array: { container: "article", item: "p" } };
    assertEquals(await json2html("_arrayOfObjects.json", array_opts), html);
  }
);

Deno.test("can output images with proper <img> element", async function () {
  let html, image_opts;
  html = `<ul id="0">
  <li id="title">cage gif</li>
  <li id="image"><img src="https://www.placecage.com/gif/200/300" alt="image" width="50" height="auto"></li>
</ul>
<ul id="1">
  <li id="title">cage crazy</li>
  <li id="image"><img src="https://www.placecage.com/c/200/300" alt="image" width="50" height="auto"></li>
</ul>`;
  image_opts = {
    images: { ids: ["image"], width: "50" },
  };
  assertEquals(await json2html("_images.json", image_opts), html);

  html = `<ul id="0">
  <li id="title">cage gif</li>
  <li id="image"><img src="https://www.placecage.com/gif/200/300" alt="image" width="auto" height="50"></li>
</ul>
<ul id="1">
  <li id="title">cage crazy</li>
  <li id="image"><img src="https://www.placecage.com/c/200/300" alt="image" width="auto" height="50"></li>
</ul>`;
  image_opts = {
    images: { ids: ["image"], height: "50" },
  };
  assertEquals(await json2html("_images.json", image_opts), html);
});

Deno.test("can render common markdown", async function () {
  const html = `<div id="text"><p>textos</p>\n</div>
<ul id="array">
  <li id="0">0</li>
  <li id="1">1</li>
  <li id="2">2</li>
  <li id="3">3</li>
</ul>
<div id="italik"><p><em>hola</em> and <em>hello</em></p>\n</div>
<div id="negritas"><p><strong>Bold</strong> and <strong>bold</strong></p>\n</div>
<div id="heading"><h3>Heading 3</h3>\n</div>
<div id="link"><p><a href="http://a.com">Link</a></p>\n</div>
<div id="image"><p><img src="http://url/a.png" alt="Image"></p>\n</div>
<div id="cita"><blockquote>\n<p>una cita.</p>\n</blockquote>\n</div>
<div id="lista"><ul>\n<li>List</li>\n</ul>\n</div>
<div id="number_list"><ol>\n<li>One</li>\n</ol>\n</div>
<div id="horizontal"><hr>\n</div>
<div id="inline"><p><code>Inline code</code> with backticks</p>\n</div>`;
  assertEquals(await json2html("_markdown.json", { markdown: true }), html);
});

type Build = {
  key: unknown;
  val: unknown;
  el?: string;
  insert?: string;
  iteration?: number;
  markdown?: boolean;
  image?: ImageOptions;
};

function build_html(spec: Build): string {
  let {
    key,
    val,
    el = "div",
    insert = "",
    iteration = 0,
    image,
    markdown = false,
  } = spec;

  if (image?.ids?.includes(key as string)) {
    const width = image.width ?? "auto";
    const height = image.height ?? "auto";
    val = `<img src="${val}" alt="image" width="${width}" height="${height}">`;
  }

  if (typeof val === "string") {
    if (markdown) {
      const md = new MarkdownIt();
      val = md.render(val);
    }
    return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
  } else if (typeof val === "number") {
    return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
  } else if (typeof val === "boolean" && val === true) {
    return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
  } else if (typeof val === "boolean" && val === false) {
    return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
  } else if (typeof val === "object" /* lol */ && val === null) {
    return `${insert.repeat(iteration)}<${el} id="${key}">null</${el}>`;
  } else if (Array.isArray(val)) {
    return build_array_html(key, val, { iteration, insert: "  " });
  } else if (typeof val === "object" && val !== null) {
    return build_object_html(key, val as Record<string, unknown>, {
      iteration,
    });
  }
  return "";
}

type BuildArray = {
  container?: string;
  item?: string;
  insert?: string;
  iteration?: number;
  markdown?: boolean;
  image?: ImageOptions;
};
function build_object_html(
  object_id: unknown,
  object_values: Record<string, unknown>,
  {
    iteration = 0,
    markdown = false,
  }: { markdown?: boolean; iteration?: number } = {}
) {
  const object_elements = [];
  for (const [key, val] of Object.entries(object_values)) {
    object_elements.push(
      build_html({
        key,
        val,
        iteration: iteration + 1,
        insert: "  ",
        markdown,
      })
    );
  }
  return `<div id="${object_id}">
${object_elements.join("\n")}
</div>`;
}

function build_array_html(
  array_id: unknown,
  array_values: unknown[],
  {
    container = "ul",
    item = "li",
    image,
    insert = "",
    iteration = 0,
  }: BuildArray = {}
) {
  const li_elements = [];
  for (const [key, val] of Object.entries(array_values)) {
    li_elements.push(
      build_html({
        key,
        val,
        image,
        el: item,
        insert: "  ",
        iteration: iteration + 1,
      })
    );
  }
  return `${insert.repeat(iteration)}<${container} id="${array_id}">
${li_elements.join("\n")}
${insert.repeat(iteration)}</${container}>`;
}

// deno-lint-ignore no-unused-vars
async function data_stdin() {
  const json = [];
  for await (const l of readLines(Deno.stdin)) {
    json.push(l);
  }
  return json;
}

async function data_file(file: string) {
  const filename = path.join(Deno.cwd(), file);
  const fileReader = await Deno.open(filename);
  const json = [];
  for await (const l of readLines(fileReader)) {
    json.push(l);
  }
  fileReader.close();
  return json;
}
