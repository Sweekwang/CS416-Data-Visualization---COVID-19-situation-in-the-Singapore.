const deathDataUrl =
  "./data/public_data_cases_deaths_total_deaths.csv";
const caseDataUrl =
  "./data/data_cases_deaths_total_cases.csv";
const topoUrl = "./data/countries-110m.json";

let width = window.innerWidth;
const height = window.innerHeight * 0.8;
const margin = { top: 50, right: 10, bottom: 10, left: 10 };

if (width > 1400) {
  width = 1400;
}

const getDeathColor = (totalDeath) => {
  switch (true) {
    case totalDeath > 1000000:
      return d3.schemeReds[6][5];
    case totalDeath > 500000:
      return d3.schemeReds[6][4];
    case totalDeath > 100000:
      return d3.schemeReds[6][3];
    case totalDeath > 10000:
      return d3.schemeReds[6][2];
    case totalDeath > 1000:
      return d3.schemeReds[6][1];
    case totalDeath <= 1000:
      return d3.schemeReds[6][0];
    default:
      return "#eee";
  }
};

const getCaseColor = (totalCase) => {
  switch (true) {
    case totalCase > 100000000:
      return d3.schemeBlues[6][5];
    case totalCase > 50000000:
      return d3.schemeBlues[6][4];
    case totalCase > 10000000:
      return d3.schemeBlues[6][3];
    case totalCase > 1000000:
      return d3.schemeBlues[6][2];
    case totalCase > 100000:
      return d3.schemeBlues[6][1];
    case totalCase <= 100000:
      return d3.schemeBlues[6][0];
    default:
      return "#eee";
  }
};

const deathColorData = [
  { color: d3.schemeReds[6][0], text: "<1,000" },
  { color: d3.schemeReds[6][1], text: "1,000 - 10,000" },
  { color: d3.schemeReds[6][2], text: "10,000 - 100,000" },
  { color: d3.schemeReds[6][3], text: "100,000 - 500,000" },
  { color: d3.schemeReds[6][4], text: "500,000 - 1,000,000" },
  { color: d3.schemeReds[6][5], text: ">1,000,000" },
  { color: "#eee", text: "No data" },
];

const caseColorData = [
  { color: d3.schemeBlues[6][0], text: "<100,000" },
  { color: d3.schemeBlues[6][1], text: "100,000 - 1,000,000" },
  { color: d3.schemeBlues[6][2], text: "1,000,000 - 10,000,000" },
  { color: d3.schemeBlues[6][3], text: "10,000,000 - 50,000,000" },
  { color: d3.schemeBlues[6][4], text: "50,000,000 - 100,000,000" },
  { color: d3.schemeBlues[6][5], text: ">100,000,000" },
  { color: "#eee", text: "No data" },
];

const countryNameCorrection = (geoData) => {
  geoData.features.forEach((d) => {
    switch (d.properties.name) {
      case "United States of America":
        d.properties.name = "United States";
        break;
      case "Dominican Rep.":
        d.properties.name = "Dominican Republic";
        break;
      case "Falkland Is.":
        d.properties.name = "Falkland Islands";
        break;
      case "S. Sudan":
        d.properties.name = "South Sudan";
        break;
      case "eSwatini":
        d.properties.name = "Eswatini";
        break;
      case "Dem. Rep. Congo":
        d.properties.name = "Democratic Republic of Congo";
        break;
      case "Central African Rep.":
        d.properties.name = "Central African Republic";
        break;
      case "Macedonia":
        d.properties.name = "North Macedonia";
        break;
      case "Bosnia and Herz.":
        d.properties.name = "Bosnia and Herzegovina";
        break;
      case "Côte d'Ivoire":
        d.properties.name = "Cote d'Ivoire";
        break;
      case "Eq. Guinea":
        d.properties.name = "Equatorial Guinea";
        break;
      default:
        break;
    }
  });
  return geoData;
};

const dataParse = (d) => {
  for (let [key, value] of Object.entries(d)) {
    if (key === "date") {
      d.date = d3.timeParse("%Y-%m-%d")(d.date);
    } else {
      d[key] = +value;
    }
  }
  return d;
};

const drawMap = (
  correctedGeoData,
  pathGenerator,
  mapBound,
  maxData,
  deathMap
) => {
  const legendGroup = mapBound
    .selectAll(".legend-group")
    .data([null])
    .join("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(100, ${height / 2})`);
  legendGroup
    .selectAll("text")
    .data([null])
    .join("text")
    .attr("y", -20)
    .style("font-size", "1.5em")
    .text(deathMap ? "Total Deaths" : "Total Cases");
  const legends = legendGroup
    .selectAll("g")
    .data(deathMap ? deathColorData : caseColorData)
    .join("g");
  legends
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 20)
    .attr("height", 15)
    .attr("stroke", "grey")
    .attr("fill", (d) => d.color);

  legends
    .append("text")
    .attr("x", 25)
    .attr("y", (d, i) => i * 20)
    .attr("dy", "0.9em")
    .text((d) => d.text);

  const tooltip = d3.select("#tooltip");

  const mouseMoved = (e, d) => {
    const tooltipText = `<div>Country: ${d.properties.name}</div><div>${
      deathMap ? "Deaths" : "Cases"
    }: ${d3.format(",")(maxData.get(d.properties.name))}</div>`;

    tooltip
      .style("visibility", "visible")
      .style("left", `${e.pageX}px`)
      .style("top", `${e.pageY}px`)
      .html(tooltipText);
  };

  const mouseLeft = (e, d) => {
    tooltip.style("visibility", "hidden");
  };

  const drawCountries = mapBound
    .selectAll(".countries")
    .data(correctedGeoData.features)
    .join("path")
    .attr("class", "countries")
    .attr("d", (d) => pathGenerator(d))
    .attr("stroke", "grey")
    .attr("fill", (d) =>
      deathMap
        ? getDeathColor(maxData.get(d.properties.name))
        : getCaseColor(maxData.get(d.properties.name))
    )
    .on("mouseenter mousemove", mouseMoved)
    .on("mouseleave", mouseLeft);
};

const main = async () => {
  const topoData = await d3.json(topoUrl);

  const deathData = await d3.csv(deathDataUrl, dataParse);
  const caseData = await d3.csv(caseDataUrl, dataParse);

  const { countries, land } = topoData.objects;

  const geoData = topojson.feature(topoData, countries);

  const correctedGeoData = countryNameCorrection(geoData);

  const projection = d3.geoEquirectangular().fitExtent(
    [
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ],
    geoData
  );
  const pathGenerator = d3.geoPath(projection);

  const countryList = deathData.columns.filter((d) => d !== "date");

  const maxDeathData = new Map();
  countryList.forEach((country) => {
    maxDeathData.set(country, d3.max(deathData.map((d) => d[country])));
  });
  const maxCaseData = new Map();
  countryList.forEach((country) => {
    maxCaseData.set(country, d3.max(caseData.map((d) => d[country])));
  });

  const svg = d3
    .select("#main-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "relative")
    .style("left", "50%")
    .style("top", "50%")
    .style("transform", "translate(-50%, 0%)");

  const mapBound = svg.append("g");

  drawMap(correctedGeoData, pathGenerator, mapBound, maxCaseData, false);

  d3.select("#cases").on("click", () => {
    drawMap(correctedGeoData, pathGenerator, mapBound, maxCaseData, false);
  });
  d3.select("#deaths").on("click", () => {
    drawMap(correctedGeoData, pathGenerator, mapBound, maxDeathData, true);
  });

  const type = d3.annotationLabel;
  const annotations = [
    {
      note: {
        label: "First outbreak of COVID started from Wuhan, China",
        bgPadding: 20,
      },
      data: { long: 114.305, lat: 30.59 },
      color: "black",
      dy: 20,
      dx: 120,
    },
    {
      note: {
        label:
          "Singapore a small island located close proximity to the epicenter of the outbreak in Wuhan, China",
        bgPadding: 20,
      },
      data: { long: 103.85, lat: 1.2879 },
      color: "black",
      dy: 50,
      dx: -40,
    },
  ];

  const makeAnnotations = d3
    .annotation()
    .notePadding(15)
    .type(type)
    .accessors({
      x: (d) => projection([d.long, d.lat])[0],
      y: (d) => projection([d.long, d.lat])[1],
    })
    .annotations(annotations);

  svg.append("g").call(makeAnnotations);
};

main();
