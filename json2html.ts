#!/usr/bin/env -S deno run --allow-read
import { readLines } from "https://deno.land/std@0.125.0/io/mod.ts";
import * as path from "https://deno.land/std@0.125.0/path/mod.ts";
import MarkdownIt from "https://esm.sh/markdown-it@12.3.2";

type ArrayOptions = { container?: string; item?: string };
type ImageOptions = { ids?: string[]; width?: string; height?: string };
type CLIOptions = {
  markdown?: boolean;
  array?: ArrayOptions;
  images?: ImageOptions;
};
export async function from_file(filename: string, options: CLIOptions = {}) {
  const json = await data_file(filename);
  const origin = JSON.parse(json.join(""));
  return json2html(origin, options);
}

type BuildOptions = {
  el?: string;
  insert?: string;
  iteration?: number;
  markdown?: boolean;
  image?: ImageOptions;
};

export function json2html(origin: any, options?: CLIOptions) {
  const ids = options?.images?.ids;
  const width = options?.images?.width;
  const height = options?.images?.height;
  const image = { ids, width, height };
  const markdown = options?.markdown;

  const elements = [];
  if (Array.isArray(origin)) {
    const container = options?.array?.container;
    const item = options?.array?.item;
    const opts = { container, item, image, markdown };
    for (const [key, val] of Object.entries(origin)) {
      const el = _build_array(key, val, opts);
      elements.push(el);
    }
  } else {
    for (const [key, val] of Object.entries(origin)) {
      const el = _build_html(key, val, { markdown, image });
      elements.push(el);
    }
  }
  return elements.join("\n");
}

function _build_html(key: unknown, val: unknown, spec: BuildOptions): string {
  const {
    image,
    el = "div",
    insert = "",
    iteration = 0,
    markdown = false,
  } = spec;

  if (image?.ids?.includes(key as string)) {
    const width = image.width ?? "auto";
    const height = image.height ?? "auto";
    val = _html_img_template(val, width, height);
  }

  if (typeof val === "string") {
    if (markdown) val = new MarkdownIt().render(val);
    return _string_template(insert, iteration, el, key, val);
  } else if (typeof val === "number") {
    return _number_template(insert, iteration, el, key, val);
  } else if (typeof val === "boolean" && val === true) {
    return _true_template(insert, iteration, el, key, val);
  } else if (typeof val === "boolean" && val === false) {
    return _false_template(insert, iteration, el, key, val);
  } else if (typeof val === "object" /* lol */ && val === null) {
    return _null_template(insert, iteration, el, key);
  } else if (Array.isArray(val)) {
    return _build_array(key, val, { iteration, insert: "  " });
  } else if (typeof val === "object" && val !== null) {
    return _build_object(key, val as Record<string, unknown>, {
      iteration,
    });
  }
  return "";
}

function _build_array(
  array_id: unknown,
  array_values: unknown[],
  spec: BuildArrayOptions = {}
) {
  const {
    container = "ul",
    item = "li",
    image,
    insert = "",
    iteration = 0,
  } = spec;
  const items = [];
  const opts = { image, el: item, insert: "  ", iteration: iteration + 1 };
  for (const [key, val] of Object.entries(array_values)) {
    items.push(_build_html(key, val, opts));
  }
  return _array_template(insert, iteration, container, array_id, items);
}

function _array_template(
  insert: string,
  iteration: number,
  container: string,
  array_id: unknown,
  li_elements: string[]
) {
  return `${insert.repeat(iteration)}<${container} id="${array_id}">
${li_elements.join("\n")}
${insert.repeat(iteration)}</${container}>`;
}

type BuildArrayOptions = {
  container?: string;
  item?: string;
  insert?: string;
  iteration?: number;
  markdown?: boolean;
  image?: ImageOptions;
};
function _html_img_template(
  val: unknown,
  width: string,
  height: string
): unknown {
  return `<img src="${val}" alt="image" width="${width}" height="${height}">`;
}

function _null_template(
  insert: string,
  iteration: number,
  el: string,
  key: unknown
): string {
  return `${insert.repeat(iteration)}<${el} id="${key}">null</${el}>`;
}

function _false_template(
  insert: string,
  iteration: number,
  el: string,
  key: unknown,
  val: boolean
): string {
  return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
}

function _true_template(
  insert: string,
  iteration: number,
  el: string,
  key: unknown,
  val: boolean
): string {
  return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
}

function _number_template(
  insert: string,
  iteration: number,
  el: string,
  key: unknown,
  val: number
): string {
  return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
}

function _string_template(
  insert: string,
  iteration: number,
  el: string,
  key: unknown,
  val: unknown
): string {
  return `${insert.repeat(iteration)}<${el} id="${key}">${val}</${el}>`;
}

function _build_object(
  object_id: unknown,
  object_values: Record<string, unknown>,
  {
    iteration = 0,
    markdown = false,
  }: { markdown?: boolean; iteration?: number } = {}
) {
  const object_elements = [];
  const opts = { iteration: iteration + 1, insert: "  ", markdown };
  for (const [key, val] of Object.entries(object_values)) {
    object_elements.push(_build_html(key, val, opts));
  }
  return _object_template(object_id, object_elements);
}

function _object_template(object_id: unknown, object_elements: string[]) {
  return `<div id="${object_id}">
${object_elements.join("\n")}
</div>`;
}

export async function data_file(file: string) {
  const filename = path.join(Deno.cwd(), file);
  const fileReader = await Deno.open(filename);
  const json = [];
  for await (const l of readLines(fileReader)) {
    json.push(l);
  }
  fileReader.close();
  return json;
}
