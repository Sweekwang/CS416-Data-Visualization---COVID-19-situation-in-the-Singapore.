const caseDataUrl =
  "./data/new_cases.csv";
const deathDataUrl =
  "./data/new_deaths.csv";

const covidEvents = [
  {
    date: "2020-01-23",
    event:
      "Singapore was one of the first countries outside China to be affected, with the first imported case on 23 January 2020.",
  },
  {
    date: "2020-04-07",
    event:
      "From 7 April 2020, Singapore entered the circuit breaker period, in order to pre-ampt escalating COVID-19 infections.",
  },
  {
    date: "2020-06-02",
    event:
      "2 June 2020, Post-circuit breaker Phase-1 includes Gatherings of up to 5 persons and home visitors of up to 5 persons but no dining-in and unmasked activity is allowed.",
  },
  {
    date: "2020-06-19",
    event:
      "Phase 2 - 19 June 2020 with dining-in and unmasked activity of up to 2 persons.",
  },
  {
    date: "2020-12-28",
    event:
      "Phase 3 officially started on 28 December 2020 - there are some safe management measures that need to be Adherence.",
  },
  {
    date: "2022-08-09",
    event:
      "9 August 2022, mask-wearing is no longer required in indoor settings except for settings where essential services are carried out in enclosed and crowded areas, and which are frequently used by vulnerable persons.",
  },
  {
    date: "2023-02-13",
    event:
      "From 13 February 2023, mask-wearing is not required on public transport and indoor healthcare and residential care settings.",
  },
];

let width = window.innerWidth;
const height = window.innerHeight * 0.8;
const margin = { top: 40, right: 100, bottom: 80, left: 120 };
const tooltipCircleRadius = 3;

if (width > 1400) {
  width = 1400;
}

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

const drawLines = (
  svg,
  caseLineGenerator,
  filteredCaseData,
  deathLineGenerator,
  filteredDeathData,
  xScale,
  yCaseScale,
  yDeathScale
) => {
  const dateList = filteredCaseData.map((d) => d.date);
  const dateExtent = d3.extent(dateList);
  const lastDate = dateExtent[1];
  const verticalLine = svg
    .selectAll(".vertical-line")
    .data([null])
    .join("line")
    .attr("class", "vertical-line")
    .attr("x1", xScale(lastDate))
    .attr("x2", xScale(lastDate))
    .attr("y1", height - margin.bottom)
    .attr("y2", margin.top)
    .attr("stroke", "black");

  const eventLog = d3.select("#event-log");

  const eventLine = svg
    .selectAll(".event-line")
    .data([null])
    .join("line")
    .attr("class", "event-line");

  const dateParse = d3.timeParse("%Y-%m-%d");
  const dateContains = covidEvents.map(
    (e, i, arr) =>
      lastDate.getTime() >= dateParse(e.date).getTime() &&
      lastDate.getTime() <=
        (arr[i + 1]
          ? dateParse(arr[i + 1].date).getTime()
          : new Date().getTime())
  );
  if (dateContains.includes(true)) {
    const index = dateContains.indexOf(true);
    eventLine
      .attr("x1", xScale(dateParse(covidEvents[index].date)))
      .attr("x2", xScale(dateParse(covidEvents[index].date)))
      .attr("y1", height - margin.bottom)
      .attr("y2", margin.top)
      .attr("stroke", "#a8a8a8");
    eventLog
      .style("visibility", "visible")
      .style(
        "transform",
        `translate(calc(-50% + ${xScale(
          dateParse(covidEvents[index].date)
        )}px), 30px)`
      )
      .html(covidEvents[index].event);
  } else {
    eventLog.style("visibility", "hidden");
    eventLine.attr("stroke", "none");
  }

  const caseLine = svg
    .selectAll(".case-line")
    .data([null])
    .join("path")
    .attr("class", "case-line")
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("stroke-opacity", 1)
    .attr("d", caseLineGenerator(filteredCaseData));

  const deathLine = svg
    .selectAll(".death-line")
    .data([null])
    .join("path")
    .attr("class", "death-line")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("stroke-opacity", 1)
    .attr("d", deathLineGenerator(filteredDeathData));

  const tooltip = d3.select("#tooltip");

  const dateStamp = svg
    .selectAll(".date-extent")
    .data([null])
    .join("text")
    .attr("class", "date-extent")
    .attr("x", width / 2)
    .attr("y", margin.top + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "1em")
    .style("font-family", "sans-serif")
    .text(
      `${d3.timeFormat("%d %B, %Y")(dateExtent[0])} - ${d3.timeFormat(
        "%d %B, %Y"
      )(dateExtent[1])}`
    );

  const caseCircle = svg
    .selectAll(".case-circle")
    .data([null])
    .join("circle")
    .attr("class", "case-circle");

  const deathCircle = svg
    .selectAll(".death-circle")
    .data([null])
    .join("circle")
    .attr("class", "death-circle");

  const mouseMoved = (event) => {
    const i = d3.bisect(dateList, xScale.invert(event.pageX));
    const caseDate = dateList[i];
    const caseValue = filteredCaseData.filter((d) => d.date === caseDate)[0]
      .value;

    const deathDate = filteredDeathData.map((d) => d.date)[i];
    const deathValue = filteredDeathData.filter((d) => d.date === deathDate)[0]
      .value;

    const tooltipText = `<div>Date: ${d3.timeFormat("%d %B %Y")(caseDate)}</div>
      <div>New Cases: ${caseValue}</div><div>New Deaths: ${deathValue}</div>`;

    tooltip
      .style("visibility", "visible")
      .style("left", `${event.pageX}px`)
      .style("top", `${event.pageY}px`)
      .html(tooltipText);

    caseCircle
      .attr("cx", xScale(caseDate))
      .attr("cy", yCaseScale(caseValue))
      .attr("r", tooltipCircleRadius)
      .attr("fill", "black")
      .style("visibility", "visible");

    deathCircle
      .attr("cx", xScale(deathDate))
      .attr("cy", yDeathScale(deathValue))
      .attr("r", tooltipCircleRadius)
      .attr("fill", "black")
      .style("visibility", "visible");
  };

  const mouseLeft = (event) => {
    tooltip.style("visibility", "hidden");
    caseCircle.style("visibility", "hidden");
    deathCircle.style("visibility", "hidden");
  };

  const tooltipRect = svg
    .selectAll("rect")
    .data([null])
    .join("rect")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .attr("width", xScale(lastDate) - margin.left)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("mouseenter mousemove", mouseMoved)
    .on("mouseleave", mouseLeft);
};

const filteredData = (data, date) => data.filter((d) => d.date <= date);

const main = async () => {
  const caseData = await d3.csv(caseDataUrl, dataParse);
  const caseSingapore = caseData.map((d) => ({
    date: d.date,
    value: d.Singapore,
  }));
  const deathData = await d3.csv(deathDataUrl, dataParse);
  const deathSingapore = deathData.map((d) => ({
    date: d.date,
    value: d.Singapore,
  }));

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(caseSingapore, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yCaseScale = d3
    .scaleLinear()
    .domain([0, d3.max(caseSingapore, (d) => d.value)])
    .range([height - margin.bottom, margin.top]);

  const yDeathScale = d3
    .scaleLinear()
    .domain([0, d3.max(deathSingapore, (d) => d.value)])
    .range([height - margin.bottom, margin.top]);

  const svg = d3
    .select("#line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "relative")
    .style("left", "50%")
    .style("top", "50%")
    .style("transform", "translate(-50%, 0%)");


  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 20}, ${margin.top + 50})`);

  legendGroup
    .selectAll("line")
    .data(["blue", "red"])
    .join("line")
    .attr("x2", 40)
    .attr("y1", (d, i) => i * 20)
    .attr("y2", (d, i) => i * 20)
    .attr("stroke", (d) => d)
    .attr("stroke-width", 2);

  legendGroup
    .selectAll("text")
    .data(["New Cases", "New Deaths"])
    .join("text")
    .attr("x", 45)
    .attr("y", (d, i) => i * 20)
    .attr("dy", "0.32em")
    .text((d) => d);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  const yCaseAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yCaseScale));

  const yDeathAxis = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right}, 0)`)
    .call(d3.axisRight(yDeathScale));

  const xAxisTitle = svg
    .append("text")
    .attr("class", "axis-title")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .text("Date");

  const yCaseAxisTitle = svg
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text("Number of Cases");

  const yDeathAxisTitle = svg
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr("y", width - 50)
    .attr("text-anchor", "middle")
    .text("Number of Deaths");

  const caseLineGenerator = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yCaseScale(d.value));

  const deathLineGenerator = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yDeathScale(d.value));

  d3.select(".slider")
    .style("width", `${width - margin.left - margin.right}px`)
    .style("margin-right", `${margin.right}px`);

  const slider = document.getElementById("date-range");
  slider.min = xScale.domain()[0].getTime();
  slider.max = xScale.domain()[1].getTime();
  slider.addEventListener("input", (e) => {
    const date = new Date(+e.target.value);
    sliderValue = +e.target.value;
    drawLines(
      svg,
      caseLineGenerator,
      filteredData(caseSingapore, date),
      deathLineGenerator,
      filteredData(deathSingapore, date),
      xScale,
      yCaseScale,
      yDeathScale
    );
  });

  let animationInterval;
  let sliderValue;
  const playButton = d3.select("#play-button").on("click", (e) => {
    if (e.target.innerHTML === "Play") {
      e.target.innerHTML = "Pause";
      animationInterval = setInterval(() => {
        if (sliderValue < xScale.domain()[1].getTime()) {
          sliderValue += 8.64e7;
        } else {
          sliderValue = xScale.domain()[0].getTime();
        }
        slider.value = sliderValue;
        const date = new Date(sliderValue);
        drawLines(
          svg,
          caseLineGenerator,
          filteredData(caseSingapore, date),
          deathLineGenerator,
          filteredData(deathSingapore, date),
          xScale,
          yCaseScale,
          yDeathScale
        );
      }, 50);
    } else {
      e.target.innerHTML = "Play";
      clearInterval(animationInterval);
    }
  });
};

main();
