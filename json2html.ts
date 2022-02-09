#!/usr/bin/env -S deno run --allow-read
import { readLines } from "https://deno.land/std@0.125.0/io/mod.ts";
import * as path from "https://deno.land/std@0.125.0/path/mod.ts";

// async function jamon() {
//   const json = await data_stdin();
//   const o = JSON.parse(json.join(""));
//   console.log(o.title);
//   return o.title;
// }

async function json2html(filename: string) {
  const json = await data_file(filename);
  const o = JSON.parse(json.join(""));

  const html_elements = [];
  for (const [k, v] of Object.entries(o)) {
    html_elements.push(build_html({ k, v }));
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

type Build = {
  k: unknown;
  v: unknown;
  el?: string;
  insert?: string;
  iteration?: number;
};
function build_html(spec: Build): string {
  const { k, v, el = "div", insert = "", iteration = 0 } = spec;
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
  }
  return "";
}

function build_array_html(
  k: unknown,
  v: unknown[],
  options?: { insert?: string; iteration: number }
) {
  const insert = options?.insert ?? "";
  const iteration = options?.iteration ?? 0;

  const li_elements = [];
  for (const [array_name, array_values] of Object.entries(v)) {
    li_elements.push(
      build_html({
        k: array_name,
        v: array_values,
        el: "li",
        insert: "  ",
        iteration: iteration + 1,
      })
    );
  }
  return `${insert.repeat(iteration)}<ul id="${k}">
${li_elements.join("\n")}
${insert.repeat(iteration)}</ul>`;
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
