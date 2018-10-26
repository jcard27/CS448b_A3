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

//Add group for cursors
var posA = [{x: 100, y: 100}]; // Initial position for A
var posB = [{x: 100, y: 500}]; // Initial position for A
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


var rMiles = 1;
xMin = 500;
xMax = 600;
sliderMileRange = 4;
var sliderPos = [xMin];
var slider =	svg.selectAll("circle")
                  .data(sliderPos)
                  .enter()
                  .append("g");

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
 function loadData(csvData){
     console.log("data loaded")
     csvData.forEach(function(d) {
                        d.proj = projection([d.business_longitude, d.business_latitude]);
                     }
     );
     generateVis(csvData);
 };

 //Generate visualization using parsed data from CSV (array of objects)
function generateVis(csvData){
    //Calculate change in degrees per 1 pixel change in longitude
    var degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];
    var rPx = calcPxRadius(rMiles, degreesPerPixel);
    console.log(rPx)




  cursorGroupA.append("circle")
              .style("fill",	"red")
              .style("fill-opacity", 0.3)
              .style("stroke", 1)
              .attr("r",	rPx)
              .attr("cx",	function(d)	{	return d.x;	})
              .attr("cy",	function(d)	{	return d.y;	})
              .call(d3.drag().on("drag",	update_A));

              cursorGroupA.append("text")
                          .attr("x",	function(d)	{	return d.x;	})
                          .attr("y",	function(d)	{	return d.y;	})
                          .attr("text", "A")
                          .attr("font-family", "sans-serif")
                          .attr("font-size", "20px")
                          .attr("fill", "black")
                          .call(d3.drag().on("drag",	update_A));

  cursorGroupB.append("circle")
              .style("fill",	"yellow")
              .style("fill-opacity", 0.3)
              .style("stroke", 1)
              .attr("r",	rPx)
              .attr("cx",	function(d)	{	return d.x;	})
              .attr("cy",	function(d)	{	return d.y;	})
              .call(d3.drag().on("drag", update_B));
  cursorGroupB.append("circle")
              .style("fill",	"blue")
              .attr("r",	5)
              .attr("cx",	function(d)	{	return d.x;	})
              .attr("cy",	function(d)	{	return d.y;	})
              .call(d3.drag().on("drag", update_B));

    slider.append("circle")
          .attr("r", 5)
          .attr("cx", function (d) {return d})
          .attr("cy", 100)
          .call(d3.drag().on("drag",	update_slider));

    slider.append("line")
          .attr("x1", xMin)
          .attr("x2", xMax)
          .attr("y1", 100)
          .attr("y2", 100)
          .attr("stroke", "black")
          .attr("stroke-width", 1)

  slider.append("text")
        .attr("x",	xMin - 20)
        .attr("y",	100)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20px")
        .attr("fill", "black")
        .attr("text", "LOL")

    function update_slider(d) {
      if (d3.event.x < xMin) {
        sliderPos = [xMin];
          slider.select("circle")
                .attr("cx", xMin)
      } else if (xMax < d3.event.x) {
          slider.selectAll("circle")
                .attr("cx", xMax)
          sliderPos = [xMax];
      } else {
          slider.selectAll("circle")
                .attr("cx", d.x = d3.event.x)
          sliderPos = [d3.event.x];
      }
      rMiles = ((xMin - sliderPos[0])*sliderMileRange)/(xMin - xMax)
      rPx = calcPxRadius(rMiles, degreesPerPixel);
      cursorGroupA.selectAll("circle")
         .attr("r", rPx)
     cursorGroupB.selectAll("circle")
         .attr("r", rPx)
      closePoints = getPoints()
      updateRestaurants(closePoints)
    }

    var greyRestaurants = backgroundGroup.selectAll("circle")
                                         .data(csvData)
                                         .enter().append("circle")
                                         .attr("r", 5)
                                         .attr("cx", function (d) {return d.proj[0];})
                                         .attr("cy", function (d) {return d.proj[1];})
                                         .style("fill", "green");

    //Update viz when B is dragged
    function update_A(d) {
        posA = [{x: d3.event.x, y: d3.event.y}];
        var cursors = cursorGroupA.selectAll("circle")
           .attr("cx", d.x =	d3.event.x)
           .attr("cy", d.y =	d3.event.y);
        closePoints = getPoints()
        updateRestaurants(closePoints)
    }

    //Update viz when B is dragged
    function update_B(d) {
      posB = [{x: d3.event.x, y: d3.event.y}];
      var cursors = cursorGroupB.selectAll("circle")
         .attr("cx", d.x =	d3.event.x)
         .attr("cy", d.y =	d3.event.y);
      closePoints = getPoints()
      updateRestaurants(closePoints)
    }

    //Filter CSV data for points within a given distance
    function getPoints(){
        var closePoints = csvData.filter(function (d) {
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
            return (distA < rPx && distB < rPx);
        });
        return closePoints;
    }

    //Add red circles for all restaurants based on long and lat
    function updateRestaurants(closePoints) {
        var circles = plotGroup.selectAll("circle")
                        .data(closePoints)
        circles.enter().append("circle")
           .merge(circles)
           .attr("class", "enter")
           .attr("r", 5)
           .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
           .attr("cy", function (d) {return d.proj[1];})
        circles.exit()
             .attr("class", "exit").remove();
    }

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
}

//Calculate radius in pixels given a radius in miles
function calcPxRadius(rMiles, degreesPerPixel){
    var earth_radius = 3959;  // miles
    var radians = rMiles/earth_radius;
    var degrees = (radians * 180)/3.14
    var rPixels = Math.abs(degrees/degreesPerPixel);
    return rPixels;
}
