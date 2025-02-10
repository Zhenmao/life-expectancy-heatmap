import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import lineChart from "./line-chart.js";

export default function heatmap({
  el,
  years,
  lifeExpectancyByCode,
  classification,
  color,
}) {
  let width, ctx, dFocus, tooltipRect, containerRect;

  const lifeExpectancyByRow = new Map(
    lifeExpectancyByCode.values().map((d) => [d.row, d])
  );

  const marginTop = 18;
  const marginRight = 72;
  const marginBottom = 18;
  const marginLeft = marginRight + 28;
  const cellHeight = 8;
  const maxCellWidth = 8;
  const maxWidth = marginLeft + marginRight + years.length * maxCellWidth;

  const maxRow = d3.max(lifeExpectancyByCode.values(), (d) => d.row);
  const height = marginTop + marginBottom + (maxRow + 1) * cellHeight;

  const focusStrokeWidth = 2;

  const x = d3.scaleBand().domain(years);

  const y = d3
    .scaleBand()
    .domain(d3.range(0, maxRow + 1))
    .range([marginTop, height - marginBottom]);

  const container = d3.select(el).attr("class", "heatmap");

  const canvas = container.append("canvas");

  const svg = container
    .append("svg")
    .on("mouseenter", moved)
    .on("mousemove", moved)
    .on("mouseleave", left);
  const xAxisG = svg.append("g").attr("class", "axis");
  const yAxisG = svg.append("g").attr("class", "axis");
  const groupAxisG = svg.append("g").attr("class", "axis");
  const focus = svg
    .append("rect")
    .attr("class", "focus")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("x", marginLeft - focusStrokeWidth / 2)
    .attr("y", -focusStrokeWidth / 2)
    .attr("height", y.bandwidth() + focusStrokeWidth)
    .attr("stroke-width", focusStrokeWidth);

  const tooltip = d3.select("#tooltip");

  const tooltipChart = lineChart({
    el: document.getElementById("lineChart"),
    years,
    color,
  });

  new ResizeObserver(resized).observe(el);

  function resized() {
    if (width === el.clientWidth) return;
    width = Math.min(el.clientWidth, maxWidth);

    x.range([marginLeft, width - marginRight]);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    focus.attr("width", width - marginLeft - marginRight + focusStrokeWidth);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.attr("width", width * dpr).attr("height", height * dpr);
    canvas.style("width", width + "px").style("height", height + "px");

    ctx = canvas.node().getContext("2d");
    ctx.scale(dpr, dpr);

    draw();
  }

  function draw() {
    drawHeatmap();
    drawXAxis();
    drawYAxis();
    drawGroupAxis();
  }

  function drawHeatmap() {
    ctx.save();

    ctx.clearRect(
      marginLeft,
      marginTop,
      width - marginLeft - marginRight,
      height - marginTop - marginBottom
    );

    lifeExpectancyByCode.forEach((d) => {
      years.forEach((year, i) => {
        ctx.fillStyle = color(d.values[i]);
        ctx.fillRect(x(year), y(d.row), x.bandwidth(), y.bandwidth());
      });
    });

    ctx.restore();
  }

  function drawXAxis() {
    let tickValues = x.domain().filter((d) => d % 10 === 0);
    const step = x(tickValues[1]) - x(tickValues[0]);
    const visibleN = Math.ceil(80 / step);
    tickValues = tickValues.filter((_, i) => i % visibleN === 0);

    xAxisG
      .selectChildren(".tick")
      .data(tickValues, (d) => d)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "tick")
          .call((g) => g.append("line").attr("y2", height))
      )
      .attr("transform", (d) => `translate(${x(d)},0)`)
      .selectChildren("text")
      .data((d) => [d, d])
      .join((enter) =>
        enter
          .append("text")
          .attr("fill", "currentColor")
          .attr("x", 4)
          .attr("dy", (_, i) => (i ? "0.71em" : "0em"))
          .attr("y", (_, i) => (i ? height - marginBottom + 8 : marginTop - 8))
          .text((d) => d)
      );
  }

  function drawYAxis() {
    const shortTickLength = 8;
    const longTickLength = 40;
    yAxisG
      .selectChildren(".tick")
      .data(lifeExpectancyByCode.values(), (d) => d.code)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "tick")
          .call((g) => g.append("path").attr("fill", "none"))
      )
      .attr("transform", (d) => `translate(0,${y(d.row) + y.bandwidth() / 2})`)
      .call((g) =>
        g.select("path").attr("d", (d) => {
          const tickLength = d.longTick ? longTickLength : shortTickLength;
          return `M${marginLeft - tickLength},0 h${tickLength} M${
            width - marginRight
          },0 h${tickLength}`;
        })
      )
      .selectChildren("text")
      .data((d) => [d, d])
      .join((enter) =>
        enter
          .append("text")
          .attr("fill", "currentColor")
          .attr("dy", "0.32em")
          .attr("text-anchor", (_, i) => (i ? "start" : "end"))
          .text((d) => d.code)
      )
      .attr("x", (d, i) => {
        const tickLength = d.longTick ? longTickLength : shortTickLength;
        return i
          ? width - marginRight + tickLength + 4
          : marginLeft - tickLength - 4;
      });
  }

  function drawGroupAxis() {
    groupAxisG
      .selectChildren("text")
      .data(classification, ([key]) => key)
      .join((enter) =>
        enter
          .append("text")
          .attr("class", "group-label")
          .attr("fill", "currentColor")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("y", 16)
          .text(([key]) => key)
      )
      .attr("x", ([, d]) => {
        const codes = d3.merge(d.values()).map((d) => d.code);
        const rowStart = lifeExpectancyByCode.get(codes[0]).row;
        const rowEnd = lifeExpectancyByCode.get(codes[codes.length - 1]).row;
        return -(y(rowStart) + y(rowEnd) + y.bandwidth()) / 2;
      });
  }

  function moved(event) {
    const [, my] = d3.pointer(event, svg.node());
    const [mx] = d3.pointer(event, el);
    const row = Math.floor((my - marginTop) / cellHeight);
    const d = lifeExpectancyByRow.get(row);
    if (!d) return left();
    if (dFocus !== d) {
      dFocus = d;
      focus
        .classed("visible", true)
        .attr("transform", `translate(0,${y(row)})`);

      tooltip.select("#tooltipCountry").text(d.name);
      tooltip.select("#tooltipSubRegion").text(d.subRegion);
      tooltip.select("#tooltipRegion").text(d.region);
      tooltipChart.update(d.values);
      tooltip.classed("visible", true);

      tooltipRect = tooltip.node().getBoundingClientRect();
      containerRect = el.getBoundingClientRect();
    }

    let transX = mx - tooltipRect.width / 2;
    if (transX < 0) transX = 0;
    if (transX + tooltipRect.width > containerRect.width)
      transX = containerRect.width - tooltipRect.width;

    let transY = my - tooltipRect.height - 12;
    if (transY < 0) transY = my + 12;

    tooltip.style("transform", `translate(${transX}px,${transY}px)`);
  }

  function left() {
    dFocus = null;
    focus.classed("visible", false);
    tooltip.classed("visible", false);
  }
}
