#!/usr/bin/env -S deno run --allow-read
import { readLines } from "https://deno.land/std@0.125.0/io/mod.ts";
import * as path from "https://deno.land/std@0.125.0/path/mod.ts";

// async function jamon() {
//   const json = await data_stdin();
//   const o = JSON.parse(json.join(""));
//   console.log(o.title);
//   return o.title;
// }

type ArrayOptions = { container?: string; item?: string };
type ImageOptions = { ids?: string[], width?: string; height?: string };
type CLIOptions = { array?: ArrayOptions; images?: ImageOptions };
async function json2html(filename: string, options: CLIOptions = {}) {
  const json = await data_file(filename);
  const o = JSON.parse(json.join(""));

  const html_elements = [];
  if (Array.isArray(o)) {
    const container = options?.array?.container;
    const item = options?.array?.item;
    const ids = options?.images?.ids;
    const width = options?.images?.width;
    const height = options?.images?.height;
    const image = { ids, width, height }
    for (const [k, v] of Object.entries(o)) {
      html_elements.push(build_array_html(k, v, { container, item, image }));
    }
  } else {
    for (const [k, v] of Object.entries(o)) {
      html_elements.push(build_html({ k, v }));
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
  let html = `<ul id="0">
  <li id="title">cage gif</li>
  <li id="image"><img src="https://www.placecage.com/gif/200/300" alt="image" width="50" height="auto"></li>
</ul>
<ul id="1">
  <li id="title">cage crazy</li>
  <li id="image"><img src="https://www.placecage.com/c/200/300" alt="image" width="50" height="auto"></li>
</ul>`;
  let image_opts = { images: { ids: ["image"], width: "50", height: "auto" } };
  assertEquals(await json2html("_images.json", image_opts), html);
});

type Build = {
  k: unknown;
  v: unknown;
  el?: string;
  insert?: string;
  iteration?: number;
  image?: ImageOptions;
};

function build_html(spec: Build): string {
  let { k, v, el = "div", insert = "", iteration = 0, image } = spec;

  if (image?.ids?.includes(k as string)) {
    v = `<img src="${v}" alt="image" width="50" height="auto">`
  }

  if (typeof v === "string") {
    return `${insert.repeat(iteration)}<${el} id="${k}">${v}</${el}>`;
  } else if (typeof v === "number") {
    return `${insert.repeat(iteration)}<${el} id="${k}">${v}</${el}>`;
  } else if (typeof v === "boolean" && v === true) {
    return `${insert.repeat(iteration)}<${el} id="${k}">${v}</${el}>`;
  } else if (typeof v === "boolean" && v === false) {
    return `${insert.repeat(iteration)}<${el} id="${k}">${v}</${el}>`;
  } else if (typeof v === "object" /* lol */ && v === null) {
    return `${insert.repeat(iteration)}<${el} id="${k}">null</${el}>`;
  } else if (Array.isArray(v)) {
    return build_array_html(k, v, { iteration, insert: "  " });
  } else if (typeof v === "object" && v !== null) {
    const object_elements = [];
    for (const [k_object, v_object] of Object.entries(v)) {
      object_elements.push(
        build_html({
          k: k_object,
          v: v_object,
          iteration: iteration + 1,
          insert: "  ",
        })
      );
    }
    return `<div id="${k}">
${object_elements.join("\n")}
</div>`;
  }
  return "";
}

type BuildArray = {
  container?: string;
  item?: string;
  insert?: string;
  iteration?: number;
  image?: ImageOptions;
};
function build_array_html(
  k: unknown,
  v: unknown[],
  { container = "ul", item = "li", insert = "", iteration = 0, image }: BuildArray = {}
) {
  const li_elements = [];
  for (const [array_name, array_values] of Object.entries(v)) {
    li_elements.push(
      build_html({
        k: array_name,
        v: array_values,
        el: item,
        insert: "  ",
        iteration: iteration + 1,
        image
      })
    );
  }
  return `${insert.repeat(iteration)}<${container} id="${k}">
${li_elements.join("\n")}
${insert.repeat(iteration)}</${container}>`;
}

async function data_stdin() {
  const json = [];
  for await (const l of readLines(Deno.stdin)) {
    json.push(l);
  }
  return json;
}

async function data_file(file: string) {
  const filename = path.join(Deno.cwd(), file);
  let fileReader = await Deno.open(filename);
  const json = [];
  for await (const l of readLines(fileReader)) {
    json.push(l);
  }
  fileReader.close();
  return json;
}
