//BUGS:
// - when radius for b is overlapping A, can't drag A

// Set up map size
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

// Declare Global Variables
//Specify initial positions A and B in pixel space


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
    //Groups for viz elements
    var cursorGroupA =	svg.append("g"); // group for POI A draggable point
    var cursorGroupB =	svg.append("g"); // group for POI B draggable point
    var backgroundGroup = svg.append('g'); //group for greyed out restaurants
    var plotGroup = svg.append('g'); // group for highlighted restaurants
    var sliderA =	svg.append("g");
    var sliderB =	svg.append("g");
    var sliderScore =	svg.append("g");

    //Draggable POI variables
    var posA = [{x: 100, y: 100}]; // Initial position for A px
    var posB = [{x: 100, y: 500}]; // Initial position for B px
    var rMilesA = 1; // Initial radius around point A in miles
    var rMilesB = 1; // Initial radius around point B in miles
    var degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];//change in degrees per 1 pixel change in longitude
    var rPxA = calcPxRadius(rMilesA, degreesPerPixel); // radius around A in pixels
    var rPxB = calcPxRadius(rMilesB, degreesPerPixel); // radius around B in pixels


    //Slider Variables
    var xMin = 500;
    var xMax = 600;
    var sliderMileRange = 4;
    var sliderScoreRange = 100;
    var minimumScore = 0;
    var ySliderA = 100;
    var ySliderB = 200;
    var sliderAPos = [-(rMilesA*(xMin - xMax)/sliderMileRange - xMin)];
    var sliderBPos = [-(rMilesB*(xMin - xMax)/sliderMileRange - xMin)];
    var sliderScorePos = [-(minimumScore*(xMin - xMax)/sliderScoreRange - xMin)];
    var currentRadius;
    var sliderACircle;


    var filteredPoints = csvData;

    // Draw sliders for user inputs
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
    currentRadius = sliderA.append("text")
          .attr("x",	sliderAPos[0])
          .attr("y",	ySliderA + 25)
          .text(rMilesA)
    sliderACircle = sliderA.append("circle")
          .attr("r", 5)
          .attr("cx", sliderAPos)
          .attr("cy", ySliderA)
          .call(d3.drag().on("drag",	update_sliderA));


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
          .attr("cx", sliderBPos)
          .attr("cy", ySliderB)
          .call(d3.drag().on("drag",	update_sliderB));

          updateGreyRestaurants(filteredPoints, backgroundGroup)

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
        sliderACircle.attr("cx", sliderAPos)
        currentRadius.attr("x", sliderAPos)
                     .text(rMilesA)
         outerCircleA.attr("r", rPxA)
        closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
        updateRestaurants(closePoints, plotGroup)
        return rPxA
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
        closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
        updateRestaurants(closePoints, plotGroup)
        console.log(rPxB)
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
          .attr("cx", sliderScorePos)
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
        updateGreyRestaurants(filteredPoints, backgroundGroup)
        closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
        updateRestaurants(closePoints, plotGroup)
    }

    //Draw all restaurants greyed out
    // var greyRestaurants = backgroundGroup.selectAll("circle")
    //                                      .data(filteredPoints)
    //                                      .enter().append("circle")
    //                                      .attr("class", "mutedRestaurants")
    //                                      .attr("cx", function (d) {return d.proj[0];})
    //                                      .attr("cy", function (d) {return d.proj[1];})

     //Draw points of interest A and B, and their surrounding circles
     console.log(rPxA)
     outerCircleA = cursorGroupA.append("circle")
                 .attr("class", "outerRadius")
                 .style("fill",	"red")
                 .style("stroke", 1)
                 .attr("r",	rPxA)
                 .attr("cx",	posA[0].x)
                 .attr("cy",	posA[0].y)
                 .call(d3.drag().on("drag", update_A));
     innerCircleA = cursorGroupA.append("circle")
                 .attr("class", "POI")
                 .attr("cx",	posA[0].x)
                 .attr("cy",	posA[0].y)
                 .call(d3.drag().on("drag",	update_A));
     //Update viz when A is dragged
     function update_A(d) {
         posA = [{x: d3.event.x, y: d3.event.y}];
         cursorGroupA.selectAll("circle")
            .attr("cx", d3.event.x)
            .attr("cy", d3.event.y);
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     }

     outerCircleB = cursorGroupB.append("circle")
                 .attr("class", "outerRadius")
                 .style("fill",	"yellow")
                 .attr("r",	rPxB)
                 .attr("cx",	posB[0].x)
                 .attr("cy",	posB[0].y)
                 .call(d3.drag().on("drag", update_B));
     innerCircleB = cursorGroupB.append("circle")
                 .attr("class", "POI")
                 .attr("cx",	posB[0].x)
                 .attr("cy",	posB[0].y)
                 .call(d3.drag().on("drag", update_B));

     //Update viz when B is dragged
     function update_B(d) {
       cursorGroupB.selectAll("circle")
          .attr("cx", d3.event.x)
          .attr("cy", d3.event.y);
         posB = [{x: d3.event.x, y: d3.event.y}];
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     }

 };

//////////////////////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////////////////////

function filterByScore(data, minimumScore) {
    var filteredPoints = data.filter(function (d) {
        return d.inspection_score > minimumScore
    });
    return filteredPoints
}

//Filter CSV data for points within a given distance
function getPoints(data, rPxA, rPxB, posA, posB){
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
function updateRestaurants(closePoints, plotGroup) {
   var circles = plotGroup.selectAll("circle")
                   .data(closePoints)
   circles.enter().append("circle")
      .merge(circles)
      .attr("class", "highlightedRestaurants")
      .attr("cx", function (d) {return d.proj[0];})
      .attr("cy", function (d) {return d.proj[1];})
   circles.exit().remove();
}

//Add green circles for restaurants that meet the score requirement
function updateGreyRestaurants(filteredPoints, backgroundGroup) {
  var circles = backgroundGroup.selectAll("circle")
                  .data(filteredPoints)
   circles.enter().append("circle")
      .merge(circles)
      .attr("class", "mutedRestaurants")
      .attr("cx", function (d) {return d.proj[0];})
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
