import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
export default function lineChart({ el, years, color }) {
  let width;

  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 24;
  const marginLeft = 32;
  const height = 320;

  function ramp(color, [vMin, vMax], n = 256) {
    const canvas = document.createElement("canvas");
    canvas.height = n;
    canvas.width = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      const v = vMin + (i / (n - 1)) * (vMax - vMin);
      context.fillStyle = color(v);
      context.fillRect(0, n - i, 1, 1);
    }
    return canvas;
  }

  const x = d3.scaleLinear().domain(d3.extent(years));

  const y = d3.scaleLinear().range([height - marginBottom, marginTop]);

  const line = d3
    .line()
    .x((_, i) => x(years[i]))
    .y((d) => y(d));

  const svg = d3.select(el).attr("class", "line-chart").append("svg");

  svg
    .append("text")
    .attr("fill", "currentColor")
    .attr("y", marginTop - 8)
    .text("Life Expectancy");

  const xAxisG = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - marginBottom})`);

  const yAxisG = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${marginLeft},0)`);

  const image = svg
    .append("image")
    .attr("x", marginLeft)
    .attr("y", marginTop)
    .attr("height", height - marginTop - marginBottom)
    .attr("preserveAspectRatio", "none");

  const path = svg
    .append("path")
    .attr("class", "line-path")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  function update(values) {
    width = el.clientWidth;

    x.range([marginLeft, width - marginRight]);

    let [yMin, yMax] = d3.extent(values);
    const yExtent = yMax - yMin;
    yMin = yMin - 0.05 * yExtent;
    yMax = yMax + 0.05 * yExtent;
    y.domain([yMin, yMax]);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    xAxisG
      .call(
        d3
          .axisBottom(x)
          .ticks((width - marginLeft - marginRight) / 80)
          .tickSize(8)
          .tickPadding(4)
          .tickFormat((d) => d)
      )
      .attr("font-family", null)
      .call((g) => g.select(".domain").remove());

    yAxisG
      .call(
        d3
          .axisLeft(y)
          .ticks((height - marginTop - marginBottom) / 50)
          .tickSize(8)
          .tickPadding(4)
      )
      .attr("font-family", null)
      .call((g) => g.select(".domain").remove());

    image
      .attr("width", width - marginLeft - marginRight)
      .attr("xlink:href", ramp(color, y.domain()).toDataURL());

    path.attr("d", line(values));
  }

  return {
    update,
  };
}
