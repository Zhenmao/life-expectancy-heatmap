import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// https://observablehq.com/@d3/color-legend
export default function colorLegend({ el, color }) {
  let width, x;

  const tickSize = 4;
  const tickPadding = 4;
  const marginTop = tickSize + tickPadding + 12;
  const marginRight = 0;
  const marginBottom = 0;
  const marginLeft = 0;
  const rampHeight = 12;
  const height = rampHeight + marginTop + marginBottom;

  function ramp(color, n = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  const svg = d3
    .select(el)
    .attr("class", "color-legend")
    .append("svg")
    .attr("height", height);

  const image = svg
    .append("image")
    .attr("x", marginLeft)
    .attr("y", marginTop)
    .attr("height", height - marginTop - marginBottom)
    .attr("preserveAspectRatio", "none");

  const axisG = svg.append("g").attr("transform", `translate(0,${marginTop})`);

  new ResizeObserver(resized).observe(el);

  function resized() {
    if (width === el.clientWidth) return;
    width = el.clientWidth;

    x = Object.assign(
      color
        .copy()
        .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
      {
        range() {
          return [marginLeft, width - marginRight];
        },
      }
    );

    svg.attr("width", width).attr("viewBox", [0, 0, width, height]);

    image
      .attr("width", width - marginLeft - marginRight)
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    axisG
      .call(
        d3
          .axisTop(x)
          .ticks((width - marginLeft - marginRight) / 100)
          .tickSize(tickSize)
          .tickPadding(tickPadding)
      )
      .attr("font-family", null)
      .call((g) => g.select(".domain").remove());
  }
}
