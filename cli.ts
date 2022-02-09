import { json2html } from "./json2html.ts";
import { readLines } from "https://deno.land/std@0.125.0/io/mod.ts";

const json = await data_stdin();
console.log(json2html(JSON.parse(json.join(""))));

async function data_stdin() {
  const json = [];
  for await (const line of readLines(Deno.stdin)) {
    json.push(line);
  }
  return json;
}
