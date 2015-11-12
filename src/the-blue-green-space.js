/**
 * the-blue-green-space.js
 */



var margin = {top: 30, right: 20, bottom: 40, left: 40},
  width = 200 - margin.left - margin.right,
  height = 100 - margin.top - margin.bottom;

var color = d3.scale.category20();

var dateFormat = d3.time.format("%Y");

var numberFormat = d3.format(".2f");

var x = d3.time.scale()
    .range([0, width]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(4);

var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset(function(d) { 
      if (d.key.split("_")[0] === "blue") { return [60, 0]; } else { return [40, 0]; } 
    })
    .html(function(d) {
      console.log(d);
      return "<strong>" + d.key + "</strong>\t" + numberFormat(d.value);
    });

var totals;

/* 1. Load and preprocess */
queue()
  .defer(d3.csv, "Patient.csv")
  .defer(d3.csv, "Opname.csv")
  .await(preprocess);

function preprocess(error, patient, admission) {
  if (error) throw error;

  // console.log(patient);
  // console.log(admission);

  // toss all patients without score from the data set
  patient = patient.filter(function(d) { 
    return d["Blue relative 100"] !== "-1"; 
  }); 


  // patient = patient.slice(15,20); // select first entries for testing //TODO: REMOVE!!

  // console.log(patient);

  patient.forEach(function(d) {

    var admissionDays = d3.nest()
      .rollup(function(leaves) { 
        return d3.sum(leaves, function(d){ return +d["Opname_duur"]; }); 
      })
      .entries(admission.filter(function(e) { return e["PatientID"] === d["PatientID"]; }));

    d.blue_100 = +(d["Blue relative 100"].replace(/,/g, '.')) * admissionDays;
    d.blue_200 = +(d["Blue relative 200"].replace(/,/g, '.')) * admissionDays;
    d.blue_300 = +(d["Blue relative 300"].replace(/,/g, '.')) * admissionDays;
    d.blue_500 = +(d["Blue relative 500"].replace(/,/g, '.')) * admissionDays;

    d.green_100 = +(d["Green relative 100"].replace(/,/g, '.')) * admissionDays;
    d.green_200 = +(d["Green relative 200"].replace(/,/g, '.')) * admissionDays;
    d.green_300 = +(d["Green relative 300"].replace(/,/g, '.')) * admissionDays;
    d.green_500 = +(d["Green relative 500"].replace(/,/g, '.')) * admissionDays;
  });

  // console.log(patient);

  // group data by age category
  var nested_data = d3.nest()
    .key(function(d) { return d["LeeftijdCategorie"]; }).sortKeys(d3.ascending)
//    .key(function(d) { return d["LeeftijdCategorie"]; })
    .rollup(function(leaves) { 
      return {

        "blue_100" : d3.sum(leaves, function(d){ return d.blue_100; }),
        "blue_200" : d3.sum(leaves, function(d){ return d.blue_200; }),
        "blue_300" : d3.sum(leaves, function(d){ return d.blue_300; }),
        "blue_500" : d3.sum(leaves, function(d){ return d.blue_500; }),

        "green_100" : d3.sum(leaves, function(d){ return d.green_100; }),
        "green_200" : d3.sum(leaves, function(d){ return d.green_200; }),
        "green_300" : d3.sum(leaves, function(d){ return d.green_300; }),
        "green_500" : d3.sum(leaves, function(d){ return d.green_500; })

//        "total_blue" : d3.sum(leaves, function(d){ return d.blue_100 + d.blue_200 + d.blue_300 + d.blue_500; })


      }; 
    })
    .entries(patient);

  // console.log(nested_data);


  totals = d3.nest()
    .key(function(d) { return d["LeeftijdCategorie"]; })
//    .key(function(d) { return d["LeeftijdCategorie"]; })
    .rollup(function(leaves) { 
      return {
        "blue" : d3.sum(leaves, function(d){ return d.blue_100 + d.blue_200 + d.blue_300 + d.blue_500; }),
        "green" : d3.sum(leaves, function(d){ return d.green_100 + d.green_200 + d.green_300 + d.green_500; }),

        "total" : d3.sum(leaves, function(d){ return d.blue_100 + d.blue_200 + d.blue_300 + d.blue_500 + 
                                                    d.green_100 + d.green_200 + d.green_300 + d.green_500; })
      };
    })
    .map(patient, d3.map);

  // console.log(totals);

  var svg = d3.select("#viz").selectAll("svg")
      .data(nested_data)
    .enter().append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .each(multiple);

  svg.call(tip);
}

function multiple(patient) {
  var svg = d3.select(this);

  svg.append("text")
      //.attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y / 2) + ")"; })
      .attr("x", 0)
      .attr("y", -10)
      .attr("dy", ".35em")
      .text(function(d) { return d.key; });


  var dist = [100,200,300,500];

  svg.selectAll(".line")
      .data(dist)
    .enter().append("line")
      .attr("class", "line")
      .attr("x1", function(d,i) { return i * 20 - 2.5; })  
      .attr("y1", 0)
      .attr("x2", function(d,i) { return i * 20 - 2.5; })  
      .attr("y2", height + margin.top)
      .style("stroke-width", 1)
      .style("stroke", "#ccc")
      .style("fill", "none")
    .append("text")
      .text(function(d) { return d; });



//  console.log(patient);
/*  console.log(patient.key);*/
//  console.log(patient.values);

//console.log(totals);

  var chart = svg.selectAll(".rect")
      .data(function(d) { /*console.log(d3.entries(d.values));*/ return d3.entries(d.values); })
    .enter().append("rect")
      .attr("class", function(d) { /*console.log(d);*/ return "chart " + d; })
      .attr("height", 15)
      .attr("width", function(d) { return (d.key.split("_")[1] === "500") ? 30 : 15; })
      .attr("opacity", function(d) { 
        // console.log(patient.key);
        var color = d.key.split("_")[0];
        var total = totals.get(patient.key);
        // console.log(total);
        // console.log(total["total"]);
        // console.log(d.value / total["total"]);
        return d.value / total["total"] * 6; }) // TODO: SCALE
      .attr("fill", function(d) { return d.key.split("_")[0]; })
      .attr("transform", function(d,i) { 
        if (i < 4) { // blue
          return "translate(" + (i * 20) + "," + 10 + ")"; 
        } else { // green
          return "translate(" + ((i - 4) * 20) + "," + 30 + ")"; 
        }
      })
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

}