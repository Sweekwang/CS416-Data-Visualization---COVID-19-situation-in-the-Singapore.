const deathDataUrl =
  "./data/public_data_cases_deaths_total_deaths.csv";
const caseDataUrl =
  "./data/data_cases_deaths_total_cases.csv";
const newCaseDataUrl =
  "./data/new_cases.csv";

let width = window.innerWidth;
const height = window.innerHeight * 0.8;
const margin = { top: 28, right: 100, bottom: 80, left: 120 };
const minRadius = 4;
const maxRadius = 100;


if (width > 1400) {
  width = 1400;
}

deletedRegion = [
  "World",
  "Africa",
  "Asia",
  "Europe",
  "European Union",
  "High income",
  "Lower middle income",
  "Low income",
  "North America",
  "Oceania",
  "South America",
  "Upper middle income",
];

const dataParse = (d) => {
  for (let [key, value] of Object.entries(d)) {
    if (key === "date") {
      d.date = d3.timeParse("%Y-%m-%d")(d.date);
    } else if (deletedRegion.includes(key)) {
      delete d[key];
    } else {
      d[key] = +value;
    }
  }
  return d;
};

const drawChart = (
  caseData,
  deathData,
  newCaseData,
  circleGroup,
  xScale,
  yScale,
  circleScale
) => {
  let countryList = Object.keys(caseData).filter((d) => d !== "date");

  const dateStamp = circleGroup
    .selectAll("text")
    .data([null])
    .join("text")
    .attr("x", margin.left + 30)
    .attr("y", margin.top + 40)
    .style("font-size", "1.3em")
    .style("font-family", "sans-serif")
    .text(d3.timeFormat("%d %B, %Y")(caseData.date));

  const tooltip = d3.select("#tooltip");

  const mouseMoved = (e, d) => {
    const tooltipText = `<div>Country: ${d}</div>
    <div>Total Cases: ${d3.format(",")(caseData[d])}</div>
    <div>Total Deaths: ${d3.format(",")(deathData[d])}</div>
    <div>New Cases: ${d3.format(",")(newCaseData[d])}</div>`;

    tooltip
      .style("visibility", "visible")
      .style("left", `${e.pageX}px`)
      .style("top", `${e.pageY}px`)
      .html(tooltipText);
  };

  const mouseLeft = (e, d) => {
    tooltip.style("visibility", "hidden");
  };

  const dateParse = d3.timeParse("%Y-%m-%d");
  const countryCircles = circleGroup
    .selectAll("circle")
    .data(countryList, (d) => d)
    .join((enter) =>
      enter
        .append("circle")
        .attr("cx", xScale(1))
        .attr("cy", yScale(1))
        .attr("r", 0)
    )
    .on("mouseenter mousemove", mouseMoved)
    .on("mouseleave", mouseLeft)
    .transition()
    .duration(50)
    .attr("cx", (d) => (caseData[d] ? xScale(caseData[d]) : xScale(1)))
    .attr("cy", (d) => {
      if (d === "Singapore") {
        if (
          deathData.date >= dateParse("2021-02-04") &&
          deathData.date <= dateParse("2021-04-28")
        ) {
          return yScale(30);
        } else {
          return deathData[d] ? yScale(deathData[d]) : yScale(1);
        }
      } else {
        return deathData[d] ? yScale(deathData[d]) : yScale(1);
      }
    })
    .attr("r", (d) => circleScale(newCaseData[d]))
    .attr("fill", (d) => (d === "Singapore" ? "red" : "grey"))
    .attr("fill-opacity", 0.6);
};

const main = async () => {
  const totalDeathData = await d3.csv(deathDataUrl, dataParse);

  const maxTotalDeath = d3.max(
    totalDeathData
      .map((d) =>
        Object.values(d).filter((t) => (t instanceof Date ? false : true))
      )
      .flat(1)
  );

  const totalCaseData = await d3.csv(caseDataUrl, dataParse);

  const maxTotalCases = d3.max(
    totalCaseData
      .map((d) =>
        Object.values(d).filter((t) => (t instanceof Date ? false : true))
      )
      .flat(1)
  );

  const newCaseData = await d3.csv(newCaseDataUrl, dataParse);
  const maxNewCase = d3.max(
    newCaseData
      .map((d) =>
        Object.values(d).filter((t) => (t instanceof Date ? false : true))
      )
      .flat(1)
  );

  const circleScale = d3
    .scaleSqrt()
    .domain([0, maxNewCase])
    .range([minRadius, maxRadius]);
  const xScale = d3
    .scaleLog()
    .domain([1, maxTotalCases])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLog()
    .domain([1, maxTotalDeath])
    .range([height - margin.bottom, margin.top]);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "relative")
    .style("left", "50%")
    .style("top", "50%")
    .style("transform", "translate(-50%, 0%)");


  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 30}, ${margin.top + 60})`);

  legendGroup
    .selectAll("circle")
    .data(["red", "grey"])
    .join("circle")
    .attr("cx", 8)
    .attr("cy", (d, i) => i * 20)
    .attr("r", 8)
    .attr("fill", (d) => d);

  legendGroup
    .selectAll("text")
    .data(["Singapore", "Other Countries"])
    .join("text")
    .attr("x", 25)
    .attr("y", (d, i) => i * 20)
    .attr("dy", "0.32em")
    .text((d) => d);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  const xAxisTitle = svg
    .append("text")
    .attr("class", "axis-title")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .text("Total Cases (Log scale)");

  const yAxisTitle = svg
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr("y", 60)
    .attr("text-anchor", "middle")
    .text("Total Deaths (Log scale)");

  const circleGroup = svg.append("g");

  d3.select(".slider")
    .style("width", `${width - margin.left - margin.right}px`)
    .style("margin-right", `${margin.right}px`);

  const dateFormat = d3.timeFormat("%Y-%m-%d");
  const slider = document.getElementById("date-range");
  const dateExtent = d3.extent(totalCaseData, (d) => d.date);
  slider.min = dateExtent[0].getTime();
  slider.max = dateExtent[1].getTime();
  slider.addEventListener("input", (e) => {
    const dateString = dateFormat(new Date(+e.target.value));
    sliderValue = +e.target.value;
    drawChart(
      totalCaseData.filter((d) => dateFormat(d.date) === dateString)[0],
      totalDeathData.filter((d) => dateFormat(d.date) === dateString)[0],
      newCaseData.filter((d) => dateFormat(d.date) === dateString)[0],
      circleGroup,
      xScale,
      yScale,
      circleScale
    );
  });

  let animationInterval;
  let sliderValue;
  const playButton = d3.select("#play-button").on("click", (e) => {
    if (e.target.innerHTML === "Play") {
      e.target.innerHTML = "Pause";
      animationInterval = setInterval(() => {
        if (sliderValue < dateExtent[1].getTime()) {
          sliderValue += 8.64e7;
        } else {
          sliderValue = dateExtent[0].getTime();
        }
        slider.value = sliderValue;
        const dateString = dateFormat(new Date(sliderValue));
        drawChart(
          totalCaseData.filter((d) => dateFormat(d.date) === dateString)[0],
          totalDeathData.filter((d) => dateFormat(d.date) === dateString)[0],
          newCaseData.filter((d) => dateFormat(d.date) === dateString)[0],
          circleGroup,
          xScale,
          yScale,
          circleScale
        );
      }, 50);
    } else {
      e.target.innerHTML = "Play";
      clearInterval(animationInterval);
    }
  });
};

main();
