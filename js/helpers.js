import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function processData(csvs) {
  const codeSet = d3.intersection(
    new Set(csvs[0].map((d) => d["Code"])),
    new Set(csvs[1].map((d) => d["ISO-alpha3 Code"]))
  );

  const minYear = 1950;
  const maxYear = d3.max(csvs[0], (d) => d["Year"]);

  const lifeExpectancyByCode = d3.rollup(
    csvs[0].filter((d) => codeSet.has(d["Code"])),
    (v) => {
      const values = v
        .filter((d) => d["Year"] >= minYear)
        .map((d) => d["Life expectancy - Sex: total - Age: 0 - Type: period"]);
      return {
        values,
      };
    },
    (d) => d["Code"]
  );

  const classification = d3.rollup(
    csvs[1].filter((d) => codeSet.has(d["ISO-alpha3 Code"])),
    (v) =>
      v.map((d) => ({
        code: d["ISO-alpha3 Code"],
        name: d["Country or Area"],
      })),
    (d) => d["Region Name"],
    (d) => d["Sub-region Name"]
  );

  let row = 0;
  classification.forEach((region, regionName) => {
    region.forEach((subRegion, subRegionName) => {
      subRegion.sort((a, b) => {
        const aValues = lifeExpectancyByCode.get(a.code).values;
        const bValues = lifeExpectancyByCode.get(b.code).values;
        return d3.descending(
          aValues[aValues.length - 1],
          bValues[bValues.length - 1]
        );
      });
      subRegion.forEach((country, i) => {
        lifeExpectancyByCode.set(country.code, {
          ...lifeExpectancyByCode.get(country.code),
          ...country,
          subRegion: subRegionName,
          region: regionName,
          row,
          longTick: i % 2 === 0,
        });
        row++;
      });
      row++;
    });
    row++;
  });

  return {
    lifeExpectancyByCode,
    classification,
    years: d3.range(minYear, maxYear + 1),
  };
}

export function getColorScale(lifeExpectancyByCode) {
  const values = d3
    .merge(Array.from(lifeExpectancyByCode.values()).map((d) => d.values))
    .sort(d3.ascending);
  const min = Math.floor(d3.quantileSorted(values, 0.02) / 10) * 10;
  const max = Math.ceil(d3.quantileSorted(values, 0.98) / 10) * 10;
  const color = d3
    .scaleSequential()
    .domain([min, max])
    .interpolator((t) => d3.interpolateViridis(1 - t));
  return color;
}
