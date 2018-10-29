//BUGS:
// - when radius for b is overlapping A, can't drag A



// Set up size
var mapWidth = 750;
var mapHeight = 750;

// Set up projection that the map is using
// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map
// projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]
var projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// Add an SVG element to the DOM
var svg = d3.select('body').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

// Define Global Variables
var posA = [{x: 100, y: 100}]; // Initial position for A
var posB = [{x: 100, y: 500}]; // Initial position for B
var sliderA = [];
var sliderAPos = [];
var sliderMileRange = [];
var filteredPoints = [];


//Add group for cursors
var cursorGroupA =	svg.selectAll("circle")
                      .data(posA)
                      .enter()
                      .append("g");
var cursorGroupB =	svg.selectAll("circle")
                      .data(posB)
                      .enter()
                      .append("g");

//Add group for static restauraunt dots
var backgroundGroup = svg.append('g')

//Add group for dynamic restauraunt dots
var plotGroup = svg.append('g')

//Load data
d3.csv("/data/short_restaurant_scores.csv", parseInputRow).then(loadData);

//Parse CSV rows and returns array of objects with the specified fields.
function parseInputRow (d) {
    return {
       business_id : d.business_id,
       business_name : d.business_name,
       business_longitude : +d.business_longitude,
       business_latitude : +d.business_latitude,
       inspection_score : +d.inspection_score
   };
}

 //Callback for d3.csv (all data related tasks go here)
 function loadData(loadedData){
     csvData = loadedData
     console.log("data loaded")
     csvData.forEach(function(d) {
                        d.proj = projection([d.business_longitude, d.business_latitude]);
                     }
     );
     generateVis(csvData);
 };

 //Generate visualization using parsed data from CSV (array of objects)
function generateVis(csvData){
    filteredPoints = csvData;

    //Calculate change in degrees per 1 pixel change in longitude
    var degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];

    //Specify initial radius in miles
    var rMilesA = 1;
    var rMilesB = 1;

    //Convert specified radius from miles to pixles
    var rPxA = calcPxRadius(rMilesA, degreesPerPixel);
    var rPxB = calcPxRadius(rMilesB, degreesPerPixel);

    //Draw Sliders for radii
    var xMin = 500;
    var xMax = 600;
    var sliderMileRange = 4;
    var sliderScoreRange = 100;
    var minimumScore = 0;

    var ySliderA = 100;
    sliderAPos = [-(rMilesA*(xMin - xMax)/sliderMileRange - xMin)];
    sliderBPos = [-(rMilesB*(xMin - xMax)/sliderMileRange - xMin)];
    sliderScorePos = [-(minimumScore*(xMin - xMax)/sliderScoreRange - xMin)];
    sliderA =	svg.selectAll("circle")
                      .data(sliderAPos)
                      .enter()
                      .append("g");

    sliderB =	svg.selectAll("circle")
                      .data(sliderBPos)
                      .enter()
                      .append("g");
    sliderScore =	svg.selectAll("circle")
                      .data(sliderScorePos)
                      .enter()
                      .append("g");

    sliderA.append("line")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderA)
          .attr("y2", ySliderA)
          .attr("class", "sliderBar")
    sliderA.append("text")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderA + 7)
          .text("0")
    sliderA.append("text")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderA + 7)
          .text(sliderMileRange)
    var currentRadius = sliderA.append("text")
          .attr("x",	sliderAPos[0])
          .attr("y",	ySliderA + 25)
          .text(rMilesA)
    var sliderACircle = sliderA.append("circle")
          .attr("r", 5)
          .attr("cx", function (d) {return d})
          .attr("cy", ySliderA)
          .call(d3.drag().on("drag",	update_sliderA));

    var ySliderB = 200;
    sliderB.append("line")
          .attr("class", "sliderBar")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderB)
          .attr("y2", ySliderB)
    sliderB.append("text")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderB + 7)
          .text("0")
    sliderB.append("text")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderB + 7)
          .text(sliderMileRange)
    var currentRadiusB = sliderB.append("text")
          .attr("x",	sliderBPos[0])
          .attr("y",	ySliderB + 25)
          .style("text-anchor", "middle")
          .text(rMilesB)
    var sliderBCircle = sliderB.append("circle")
          .attr("r", 5)
          .attr("cx", function (d) {return d})
          .attr("cy", ySliderB)
          .call(d3.drag().on("drag",	update_sliderB));

    //Update viz when slider is dragged
    function update_sliderA(d) {
        if (d3.event.x < xMin) {
          sliderAPos = [xMin];
        } else if (xMax < d3.event.x) {
            sliderAPos = [xMax];
        } else {
            sliderAPos = [d3.event.x];
        }
        rMilesA = ((xMin - sliderAPos[0])*sliderMileRange)/(xMin - xMax)
        rPxA = calcPxRadius(rMilesA, degreesPerPixel);
        sliderBCircle.attr("cx", sliderBPos)
        currentRadius.attr("x", sliderAPos)
                     .text(rMilesA)
         outerCircleA.attr("r", rPxA)
        closePoints = getPoints(filteredPoints, rPxA, rPxB)
        updateRestaurants(closePoints)
    }

    //Update viz when slider is dragged
    function update_sliderB(d) {
        if (d3.event.x < xMin) {
          sliderBPos = [xMin];
        } else if (xMax < d3.event.x) {
            sliderBPos = [xMax];
        } else {
            sliderBPos = [d3.event.x];
        }
        rMilesB = ((xMin - sliderBPos[0])*sliderMileRange)/(xMin - xMax)
        rPxB = calcPxRadius(rMilesB, degreesPerPixel);
        sliderBCircle.attr("cx", sliderBPos)
        currentRadiusB.attr("x", sliderBPos)
                     .text(rMilesB)
         outerCircleB.attr("r", rPxB)
        closePoints = getPoints(filteredPoints, rPxA, rPxB)
        updateRestaurants(closePoints)
    }

    var ySliderScore = 300;
    sliderScore.append("line")
          .attr("class", "sliderBar")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderScore)
          .attr("y2", ySliderScore)
    sliderScore.append("text")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderScore + 7)
          .text("0")
    sliderScore.append("text")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderScore + 7)
          .text(sliderScoreRange)
    var currentMinScore = sliderB.append("text")
          .attr("x",	sliderScorePos[0])
          .attr("y",	ySliderScore + 25)
          .text(minimumScore)
    var sliderScoreCircle = sliderScore.append("circle")
          .attr("r", 5)
          .attr("cx", function (d) {return d})
          .attr("cy", ySliderScore)
          .call(d3.drag().on("drag",	update_sliderScore));

    //Update viz when slider is dragged
    function update_sliderScore(d) {
        if (d3.event.x < xMin) {
          sliderScorePos = [xMin];
        } else if (xMax < d3.event.x) {
            sliderScorePos = [xMax];
        } else {
            sliderScorePos = [d3.event.x];
        }
        minimumScore = ((xMin - sliderScorePos[0])*sliderScoreRange)/(xMin - xMax)
        sliderScoreCircle.attr("cx", sliderScorePos)
        currentMinScore.attr("x", sliderScorePos)
                     .text(minimumScore)
        filteredPoints = filterByScore(csvData, minimumScore)
        updateGreyRestaurants(filteredPoints)
        closePoints = getPoints(filteredPoints, rPxA, rPxB)
        updateRestaurants(closePoints)
    }

    //Draw all restaurants greyed out
    var greyRestaurants = backgroundGroup.selectAll("circle")
                                         .data(filteredPoints)
                                         .enter().append("circle")
                                         .attr("class", "mutedRestaurants")
                                         .attr("cx", function (d) {return d.proj[0];})
                                         .attr("cy", function (d) {return d.proj[1];})

    drawPOIs(rPxA, rPxB)

 };
//////////////////////////////////////////////////////////////////

//Draw points of interest A and B, and their surrounding circles
function drawPOIs (rPxA, rPxB) {
    outerCircleA = cursorGroupA.append("circle")
                .attr("class", "outerRadius")
                .style("fill",	"red")
                .style("stroke", 1)
                .attr("r",	rPxA)
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag", update_A));
    innerCircleA = cursorGroupA.append("circle")
                .attr("class", "POI")
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag",	update_A));
    //Update viz when A is dragged
    function update_A(d) {
        posA = [{x: d3.event.x, y: d3.event.y}];
        cursorGroupA.selectAll("circle")
           .attr("cx", d.x =	d3.event.x)
           .attr("cy", d.y =	d3.event.y);
        cursorGroupA.selectAll("text")
              .attr("x", d.x =	d3.event.x)
              .attr("y", d.y =	d3.event.y);
        closePoints = getPoints(filteredPoints, rPxA, rPxB)
        updateRestaurants(closePoints)
    }

    outerCircleB = cursorGroupB.append("circle")
                .attr("class", "outerRadius")
                .style("fill",	"yellow")
                .attr("r",	rPxB)
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag", update_B));
    innerCircleB = cursorGroupB.append("circle")
                .attr("class", "POI")
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag", update_B));
    //Update viz when B is dragged
    function update_B(d) {
        posB = [{x: d3.event.x, y: d3.event.y}];
        var cursors = cursorGroupB.selectAll("circle")
           .attr("cx", d.x =	d3.event.x)
           .attr("cy", d.y =	d3.event.y);
        closePoints = getPoints(filteredPoints, rPxA, rPxB)
        updateRestaurants(closePoints)
    }
  }

function filterByScore(data, minimumScore) {
    var filteredPoints = data.filter(function (d) {
        return d.inspection_score > minimumScore
    });
    return filteredPoints
}


//Filter CSV data for points within a given distance
function getPoints(data, rPxA, rPxB){
    var closePoints = data.filter(function (d) {
        var distA = Math.abs(Math.sqrt(
                        Math.pow((d.proj[0] - posA[0].x), 2)
                        +
                        Math.pow((d.proj[1] - posA[0].y),2)
                    ));
        var distB = Math.abs(Math.sqrt(
                        Math.pow((d.proj[0] - posB[0].x), 2)
                        +
                        Math.pow((d.proj[1] - posB[0].y),2)
                    ));
        return (distA < rPxA && distB < rPxB);
    });
    return closePoints;
}

//Add red circles for all restaurants based on long and lat
function updateRestaurants(closePoints) {
   var circles = plotGroup.selectAll("circle")
                   .data(closePoints)
   circles.enter().append("circle")
      .merge(circles)
      .attr("class", "highlightedRestaurants")
      .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
      .attr("cy", function (d) {return d.proj[1];})
   circles.exit().remove();
}

//Add green circles for restaurants that meet the score requirement
function updateGreyRestaurants(filteredPoints) {
  var circles = backgroundGroup.selectAll("circle")
                  .data(filteredPoints)
   circles.enter().append("circle")
      .merge(circles)
      .attr("class", "mutedRestaurants")
      .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
      .attr("cy", function (d) {return d.proj[1];})
   circles.exit().remove();
}

//Calculate distance in miles between 2 points
function calcDist(loc1, loc2){
// Inputs:
// loc1 - [longitude, latitude] of location 1
// loc2 - [longitude, latitude] of location 2
// Output:
// dist - distance in miles between locations 1 and 2
//
// Note: I used example from https://bl.ocks.org/ThomasThoren/6a543c4d804f35a240f9 here
    var radians = d3.geoDistance(loc1, loc2);
    var earth_radius = 3959;  // miles
    var dist = earth_radius * radians;
    return dist;
}

//Calculate radius in pixels given a radius in miles
function calcPxRadius(rMiles, degreesPerPixel){
    var earth_radius = 3959;  // miles
    var radians = rMiles/earth_radius;
    var degrees = (radians * 180)/3.14
    var rPixels = Math.abs(degrees/degreesPerPixel);
    return rPixels;
}
