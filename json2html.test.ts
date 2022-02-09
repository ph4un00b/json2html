import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.125.0/testing/asserts.ts";
import { from_file } from "./json2html.ts";

Deno.test("can parse string value", async function () {
  assert(
    (await from_file("_simple.json"))
      .split("\n")
      .includes('<div id="title">parsed</div>')
  );
});

Deno.test("can parse number value", async function () {
  assert(
    (await from_file("_simple.json"))
      .split("\n")
      .includes('<div id="id">31337</div>')
  );
});

Deno.test("can parse true value", async function () {
  assert(
    (await from_file("_simple.json"))
      .split("\n")
      .includes('<div id="sexy">true</div>')
  );
});

Deno.test("can parse false value", async function () {
  assert(
    (await from_file("_simple.json"))
      .split("\n")
      .includes('<div id="human">false</div>')
  );
});

Deno.test("can parse null value", async function () {
  assert(
    (await from_file("_simple.json"))
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
  assertEquals(await from_file("_simple.json"), html);
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
  assertEquals(await from_file("_arrayOfarrays.json"), html);
});

Deno.test("can parse object value", async function () {
  const html = `<div id="title">object json</div>
<div id="id">31337</div>
<div id="sexy">true</div>
<div id="human">false</div>
<div id="password">null</div>
<div id="image">image.jpg</div>
<div id="fancy-object">
  <div id="title">fancy</div>
  <div id="description">lorem text for the sake of test this out!</div>
</div>`;
  assertEquals(await from_file("_object.json"), html);
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
  assertEquals(await from_file("_arrayOfObjects.json"), html);
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
    assertEquals(await from_file("_arrayOfObjects.json", array_opts), html);

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
    assertEquals(await from_file("_arrayOfObjects.json", array_opts), html);
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
  assertEquals(await from_file("_images.json", image_opts), html);

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
  assertEquals(await from_file("_images.json", image_opts), html);
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
  assertEquals(await from_file("_markdown.json", { markdown: true }), html);
});

Deno.test("can parse object value with images", async function () {
  const html = `<div id="title">object json</div>
<div id="id">31337</div>
<div id="sexy">true</div>
<div id="human">false</div>
<div id="password">null</div>
<div id="image"><img src="image.jpg" alt="image" width="auto" height="auto"></div>
<div id="fancy-object">
  <div id="title">fancy</div>
  <div id="description">lorem text for the sake of test this out!</div>
</div>`;
  assertEquals(
    await from_file("_object.json", { images: { ids: ["image"] } }),
    html
  );
});
