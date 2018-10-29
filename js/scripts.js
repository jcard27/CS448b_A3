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
  .attr('width', mapWidth*2)
  .attr('height', mapHeight*2);

// Location for instructions
var instructionX = 650;
var instructionY = 460;

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

// Title
svg.append("text")
   .attr("class", "vizTitle")
   .attr("x", 30)
   .attr("y", 100)
   .text("Restaurants of San Francisco")

// Instructions
svg.append("text")
   .attr("x", instructionX)
   .attr("y", instructionY)
   .attr("class", "sliderTitle")
   .text("Instructions:")
svg.append("text")
   .attr("x", instructionX)
   .attr("y", instructionY)
   .attr("dy", "1.5em")
   .attr("class", "instructions")
   .text(" - Restaurants that meet the minimum inspection score are shown on map.")
svg.append("text")
   .attr("x", instructionX)
   .attr("y", instructionY)
   .attr("dy", "3em")
   .attr("class", "instructions")
   .text(" - Hover over a restaurant to see its name and inspection score.")
svg.append("text")
   .attr("x", instructionX)
   .attr("y", instructionY)
   .attr("dy", "4.5em")
   .attr("class", "instructions")
   .text(" - Drag blue and green circles to highlight restaurants within their intersection.")
svg.append("text")
   .attr("x", instructionX)
   .attr("y", instructionY)
   .attr("dy", "6em")
   .attr("class", "instructions")
   .text(" - Use sliders to adjust minimum inspection score and radii of interest.")

//Caption regarding scores
 svg.append("text")
    .attr("x", instructionX)
    .attr("y", instructionY)
    .attr("dy", "9em")
    .attr("class", "instructions")
    .text("*The San Francisco Department of Public Health defines scores as follows:")
svg.append("text")
   .attr("x", instructionX+ 20)
   .attr("y", instructionY)
   .attr("dy", "10em")
   .attr("class", "instructions")
   .text("< 70: Poor")
svg.append("text")
   .attr("x", instructionX+ 20)
   .attr("y", instructionY)
   .attr("dy", "11em")
   .attr("class", "instructions")
   .text("71-85: Needs Improvement")
svg.append("text")
  .attr("x", instructionX+ 20)
  .attr("y", instructionY)
  .attr("dy", "12em")
  .attr("class", "instructions")
  .text("86-90: Adequate")
svg.append("text")
   .attr("x", instructionX+ 20)
   .attr("y", instructionY)
   .attr("dy", "13em")
   .attr("class", "instructions")
   .text("> 90: Good")

//Load data
d3.csv("/data/restaurant_scores.csv", parseInputRow).then(loadData);

//Parse CSV rows and returns array of objects with the specified fields.
function parseInputRow (d) {
    return {
       business_name : d.business_name,
       business_longitude : +d.business_longitude,
       business_latitude : +d.business_latitude,
       inspection_score : +d.inspection_score
   };
};

//Callback for d3.csv (all data related tasks go here)
function loadData(loadedData){
   csvData = loadedData
   csvData.forEach(function(d) {
                      d.proj = projection([d.business_longitude, d.business_latitude]);
                   }
   );
   generateVis(csvData);
};

//Generate visualization using parsed data from CSV (array of objects)
function generateVis(csvData){
  ///////////////// Declaring Vars /////////////////////
    //Groups for viz elements in svg container
    var cursorGroupA =	svg.append("g"); // group for POI A draggable point
    var cursorGroupB =	svg.append("g"); // group for POI B draggable point
    var backgroundGroup = svg.append('g'); //group for greyed out restaurants
    var plotGroup = svg.append('g'); // group for highlighted restaurants
    var sliderA =	svg.append("g"); // group for slider to adjust radius around A
    var sliderB =	svg.append("g"); // group for slider to adjust radius around B
    var sliderScore =	svg.append("g"); // group for slider to adjust score threshold for filter
    var annotationGroup = svg.append("g");// group for annotations

    //Draggable POI variables
    var posA = [{x: 100, y: 250}]; // Initial position for A px
    var posB = [{x: 250, y: 250}]; // Initial position for B px
    var rMilesA = 1; // Initial radius around point A in miles
    var rMilesB = 1; // Initial radius around point B in miles
    var degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];//change in degrees per 1 pixel change in longitude
    var rPxA = calcPxRadius(rMilesA, degreesPerPixel); // radius around A in pixels
    var rPxB = calcPxRadius(rMilesB, degreesPerPixel); // radius around B in pixels
    var outerCircleA = cursorGroupA.append("circle"); // circle showing radius around A
    var innerCircleA = cursorGroupA.append("circle"); // circle showing POI A
    var outerCircleB = cursorGroupB.append("circle"); // circle showing radius around B
    var innerCircleB = cursorGroupB.append("circle"); // circle showing POI B

    //Slider Variables
    var xMin = 650 + 20; // x-position to start at
    var xMax = xMin + 100; // x-position to end at
    var ySliderA = 250; // y-position of slider adjusting radius A
    var ySliderB = ySliderA + 70; // y-position of slider adjusting B
    var ySliderScore = ySliderB + 70; // y-position of slider adjusting score filter
    var sliderTitleOffset = 20;
    var sliderMileRange = 4; // maximum radius around POI
    var sliderScoreRange = 29; // range between minimum and maximum score
    var MINSCORE = 71
    var minimumScore = MINSCORE; // minumum score for filter
    var sliderAPos = [-(rMilesA*(xMin - xMax)/sliderMileRange - xMin)]; // x-position of slider marker
    var sliderBPos = [-(rMilesB*(xMin - xMax)/sliderMileRange - xMin)]; // x-position of slider marker
    var sliderScorePos = [-((minimumScore-MINSCORE)*(xMin - xMax)/sliderScoreRange - xMin)]; // x-position of slider marker
    var currentRadius = sliderA.append("text"); // text displaying the radius
    var sliderACircle = sliderA.append("circle"); // circle marking slider position
    var currentRadiusB = sliderB.append("text"); // text displaying the radius
    var sliderBCircle = sliderB.append("circle"); // circle marking slider position
    var currentMinScore = sliderB.append("text"); // text displaying score to filter by
    var sliderScoreCircle = sliderScore.append("circle"); // circle marking slider position

    // Variable containing data filtered by the score requirement
    var filteredPoints = csvData;

/////////// Draw all restaurants initially greyed out ///////
    updateGreyRestaurants(filteredPoints, backgroundGroup);

  ////////////// Draw sliders for user inputs ///////////////
  // sliderA.append('rect')
  //        .attr("x", xMin - 30)
  //        .attr("y", ySliderA - 70)
  //        .attr("width", 500)
  //        .attr("height", 350)
  //        .style("fill", "white")
    // Slider for radius of POI A
    sliderA.append("line")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderA)
          .attr("y2", ySliderA)
          .attr("class", "sliderBar")
    sliderA.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderA + 7)
          .text("0")
    sliderA.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderA + 7)
          .text(sliderMileRange)
    sliderA.append("text")
          .attr("class", "sliderTitle")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderA - sliderTitleOffset)
          .text("Radius in miles around point A")
    annotationGroup.append("circle")
                   .attr("class", "POI")
                   .style("fill", "green")
                   .attr("cx", xMin + 200)
                   .attr("cy", ySliderA - sliderTitleOffset - 6)
    currentRadius
          .attr("class", "sliderNumber")
          .attr("x",	sliderAPos[0])
          .attr("y",	ySliderA + 25)
          .text(rMilesA)
    sliderACircle
          .attr("class", "sliderCircle")
          .attr("cx", sliderAPos)
          .attr("cy", ySliderA)
          .call(d3.drag().on("drag",	update_sliderA));



    // Slider for radius of POI B
    sliderB.append("line")
          .attr("class", "sliderBar")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderB)
          .attr("y2", ySliderB)
    sliderB.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderB + 7)
          .text("0")
    sliderB.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderB + 7)
          .text(sliderMileRange)
    sliderB.append("text")
          .attr("class", "sliderTitle")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderB - sliderTitleOffset)
          .text("Radius in miles around point B")
    annotationGroup.append("circle")
                   .attr("class", "POI")
                   .style("fill", "blue")
                   .attr("cx", xMin + 200)
                   .attr("cy", ySliderB - sliderTitleOffset - 6)
    currentRadiusB
          .attr("class", "sliderNumber")
          .attr("x",	sliderBPos[0])
          .attr("y",	ySliderB + 25)
          .text(rMilesB)
    sliderBCircle
          .attr("class", "sliderCircle")
          .attr("cx", sliderBPos)
          .attr("cy", ySliderB)
          .call(d3.drag().on("drag",	update_sliderB));



    // Slider for filtering visible restaurants by inspection score
    sliderScore.append("line")
          .attr("class", "sliderBar")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", ySliderScore)
          .attr("y2", ySliderScore)
    sliderScore.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMin - 20)
          .attr("y",	ySliderScore + 7)
          .text(MINSCORE)
    sliderScore.append("line")
          .attr("x1", xMin)
          .attr("x2", xMin)
          .attr("y1",	ySliderScore)
          .attr("y2",	ySliderScore + 7)
    sliderScore.append("text")
          .attr("class", "sliderNumber")
          .attr("x",	xMax + 20)
          .attr("y",	ySliderScore + 7)
          .text(sliderScoreRange + MINSCORE)
  sliderScore.append("text")
        .attr("class", "sliderTitle")
        .attr("x",	xMin - 20)
        .attr("y",	ySliderScore - sliderTitleOffset)
        .text("Minimum Inspection Score*")
   currentMinScore
          .attr("class", "sliderNumber")
          .attr("x",	sliderScorePos[0])
          .attr("y",	ySliderScore + 25)
          .text(minimumScore)
    sliderScoreCircle
          .attr("class", "sliderCircle")
          .attr("cx", sliderScorePos)
          .attr("cy", ySliderScore)
          .call(d3.drag().on("drag",	update_sliderScore));

   ////////////// Draw POIs A and B and surrounding radii ///////////////
     // POI A
     outerCircleA = cursorGroupA.append("circle")
                 .attr("class", "outerRadius")
                 .style("fill",	"#009900")
                 .style("stroke", 1)
                 .attr("r",	rPxA)
                 .attr("cx",	posA[0].x)
                 .attr("cy",	posA[0].y)
                 .call(d3.drag().on("drag", update_A));
     innerCircleA = cursorGroupA.append("circle")
                 .attr("class", "POI")
                 .attr("fill", "#009900")
                 .attr("cx",	posA[0].x)
                 .attr("cy",	posA[0].y)
                 .call(d3.drag().on("drag",	update_A));

     // POI B
     outerCircleB
                 .attr("class", "outerRadius")
                 .style("fill",	"blue")
                 .attr("r",	rPxB)
                 .attr("cx",	posB[0].x)
                 .attr("cy",	posB[0].y)
                 .call(d3.drag().on("drag", update_B));
     innerCircleB = cursorGroupB.append("circle")
                 .attr("class", "POI")
                 .attr("fill", "blue")
                 .attr("cx",	posB[0].x)
                 .attr("cy",	posB[0].y)
                 .call(d3.drag().on("drag", update_B));

     //////////// Event Callbacks for Updates ////////////////
     //Update viz when slider is dragged
     function update_sliderA(d) {
       rMilesA = moveSlider (d3.event,
                                  sliderAPos,
                                  xMin,
                                  xMax,
                                  sliderMileRange,
                                  sliderACircle,
                                  currentRadius,
                                  0)
         rPxA = calcPxRadius(rMilesA, degreesPerPixel);
         outerCircleA.attr("r", rPxA)
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
         return rPxA
     };

     //Update viz when slider is dragged
     function update_sliderB(d) {
       rMilesB = moveSlider (d3.event,
                                  sliderBPos,
                                  xMin,
                                  xMax,
                                  sliderMileRange,
                                  sliderBCircle,
                                  currentRadiusB,
                                  0)
         rPxB = calcPxRadius(rMilesB, degreesPerPixel);
         outerCircleB.attr("r", rPxB)
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     };

     //Update viz when slider is dragged
     function update_sliderScore(d) {
         minimumScore = moveSlider (d3.event,
                                    sliderScorePos,
                                    xMin,
                                    xMax,
                                    sliderScoreRange,
                                    sliderScoreCircle,
                                    currentMinScore,
                                    MINSCORE)
        currentMinScore.attr("x", sliderScorePos)
                       .text(Math.round(minimumScore))
         filteredPoints = filterByScore(csvData, minimumScore)
         updateGreyRestaurants(filteredPoints, backgroundGroup)
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     };

     //Update viz when POI A is dragged
     function update_A(d) {
         //instructionGroup.selectAll("text").remove();
         cursorGroupA.selectAll("circle")
            .attr("cx", d3.event.x)
            .attr("cy", d3.event.y);
         posA = [{x: d3.event.x, y: d3.event.y}];
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     };

     //Update viz when POI B is dragged
     function update_B(d) {
      // instructionGroup.selectAll("text").remove();
       cursorGroupB.selectAll("circle")
          .attr("cx", d3.event.x)
          .attr("cy", d3.event.y);
         posB = [{x: d3.event.x, y: d3.event.y}];
         closePoints = getPoints(filteredPoints, rPxA, rPxB, posA, posB)
         updateRestaurants(closePoints, plotGroup)
     };

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
        plotGroup.selectAll("circle")
                 .on("mouseover",	displayName)
                 .on("mouseout", undisplay);
     };

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
        backgroundGroup.selectAll("circle")
                       .on("mouseover",	displayName)
                       .on("mouseout", undisplay);
     };

     // Highights circle with stroke and displays restaurant name
     function displayName (d) {
       var xPos = this.cx.animVal.value;
       var yPos = this.cy.animVal.value;
       var name = d3.select(this).datum().business_name;
       var score = d3.select(this).datum().inspection_score;
       var highlightedPoint = d3.select(this)
                                .attr("r", 4)
                                .style("stroke", "black")
                                .style("stroke-width", "2");
         annotationGroup.append("text")
                        .attr("x", xPos - 4)
                        .attr("y", yPos - 22)
                        .attr("class", "annotations")
                        .text(name);
         annotationGroup.append("text")
                        .attr("x", xPos - 4)
                        .attr("y", yPos - 8)
                        .attr("class", "annotations")
                        .text("Inspection score: " + score);
     };

     // Undoes the highlighting from displayName (removes stroke and annotation)
     function undisplay (d) {
       d3.select(this)
         .attr("r", 2)
         .style("stroke-width", "0")
       annotationGroup.selectAll("text").remove();
     }
 };

//////////////////////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////////////////////

// Move slider marker and label
//Returns new value corresponding to slider position
function moveSlider (event, sliderPos, xMin, xMax, range, marker, label, offset) {
    var sliderPos;
    var newValue;
    if (event.x < xMin) {
      sliderPos = [xMin];
    } else if (xMax < event.x) {
        sliderPos = [xMax];
    } else {
        sliderPos = [event.x];
    }
    newValue = ((xMin - sliderPos[0])*range)/(xMin - xMax) + offset;
    marker.attr("cx", sliderPos)
    label.attr("x", sliderPos)
                 .text(parseFloat(newValue.toFixed(2)))
   return newValue;
};

// Filter data to only return data with a score above minimumScore
function filterByScore(data, minimumScore) {
    var filteredPoints = data.filter(function (d) {
        return d.inspection_score > minimumScore
    });
    return filteredPoints;
};

//Filter CSV data for points lying within a given radius of 2 points
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
};

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
};

//Calculate radius in pixels given a radius in miles
function calcPxRadius(rMiles, degreesPerPixel){
    var earth_radius = 3959;  // miles
    var radians = rMiles/earth_radius;
    var degrees = (radians * 180)/3.14159;
    var rPixels = Math.abs(degrees/degreesPerPixel);
    return rPixels;
};
