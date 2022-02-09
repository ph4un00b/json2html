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

type Build = {
  key: unknown;
  val: unknown;
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
  const html_elements = [];
  if (Array.isArray(origin)) {
    const container = options?.array?.container;
    const item = options?.array?.item;
    for (const [key, val] of Object.entries(origin)) {
      const el = build_array_html(key, val, {
        container,
        item,
        image,
        markdown,
      });
      html_elements.push(el);
    }
  } else {
    for (const [key, val] of Object.entries(origin)) {
      const el = build_html({ key, val, markdown, image });
      html_elements.push(el);
    }
  }
  return html_elements.join("\n");
}

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
