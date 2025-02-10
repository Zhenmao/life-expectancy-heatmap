import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getColorScale, processData } from "./helpers.js";
import colorLegend from "./color-legend.js";
import heatmap from "./heatmap.js";

Promise.all([
  d3.csv("./data/life-expectancy-hmd-unwpp.csv", d3.autoType),
  d3.csv("./data/UNSD — Methodology.csv"),
]).then((csvs) => {
  const { years, lifeExpectancyByCode, classification } = processData(csvs);
  console.log({ lifeExpectancyByCode, classification });

  const color = getColorScale(lifeExpectancyByCode);

  colorLegend({ el: document.getElementById("colorLegend"), color });

  heatmap({
    el: document.getElementById("heatmap"),
    years,
    lifeExpectancyByCode,
    classification,
    color,
  });
});
