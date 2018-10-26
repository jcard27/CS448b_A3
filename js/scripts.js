// Set up size
var mapWidth = 750;
var mapHeight = 750;

// Set up projection that the map is using
var projection = d3.geoMercator()
  .center([-122.433701, 37.767683]) // San Francisco, roughly
  .scale(225000)
  .translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map
// projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]

// Add an SVG element to the DOM
var svg = d3.select('body').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

//Add group for restauraunt dots
var plotGroup = svg.append('g')

//Add group for cursors
//var cursorGroup = svg.append('g')
var A_pos = [{x: 100, y: 100}];
A_pos.forEach(function(d,	i)	{
                d.i =	i;
});
console.log(A_pos)
var cursorGroupA =	svg.selectAll("circle")
                      .data(A_pos)
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
    //fakeData = [{proj: [200, 100]}, {proj: [200, 300]}, {proj: [200, 500]}];
    cursorGroupA.append("circle")
                .style("fill",	"red")
                .style("fill-opacity", 0.3)
                .style("stroke", 1)
                .attr("r",	200)
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag",	on_rect_drag));
    cursorGroupA.append("circle")
                .style("fill",	"blue")
                .attr("id",	function(d)	{	return "circle_border"	+	d.i;	})
                .attr("r",	5)
                .attr("cx",	function(d)	{	return d.x;	})
                .attr("cy",	function(d)	{	return d.y;	})
                .call(d3.drag().on("drag",	on_rect_drag));

    // Specify initial position of point A
    var A_pos_ll = projection.invert([A_pos[0].x, A_pos[0].y]);

    //Calculate change in degrees per 1 pixel change in longitude
    degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];

    //Update viz when points are dragged
    function on_rect_drag(d)	{
      A_pos = [{x: d3.event.x, y: d3.event.y}];
      var cursors = cursorGroupA.selectAll("circle")
         .attr("cx", d.x =	d3.event.x) //projection([d.business_longitude, d.business_latitude])[0];})
         .attr("cy", d.y =	d3.event.y);

        var radiusMiles = [4];
        //Filter CSV data for points within a given distance
        var closePoints = csvData.filter(function (d) {
            var dist = Math.abs(Math.sqrt(
                            Math.pow((d.proj[0] - A_pos[0].x), 2)
                            +
                            Math.pow((d.proj[1] - A_pos[0].y),2)
                        ));
            return dist < 200;
        });
        updateRestaurants(closePoints)
    };

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

//Calc radians in longitude for given number of miles
function milesToRadians(miles){
    var earth_radius = 3959;  // miles
    var radians = miles/earth_radius;
    var rPixels = radians/radiansPerPixel;
    return rPixels;
}
