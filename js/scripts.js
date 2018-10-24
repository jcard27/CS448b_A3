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

//var projs = calcProjections(csvData)
var projs = [{longProj: 400, latProj: 400}, {longProj: 401, latProj: 375}];
console.log(projs)

var geoloc = [{long: -122.433701, lat:37.767683}, {long: -122.422442, lat:37.764908}];

var circle_position_data =	d3.range(10).map(function()	{
return {
x:	Math.round(Math.random()	*	(1000	- 55	*	2)	+	55),	//	Random	x-pixel	on	the page
y:	Math.round(Math.random()	*	(1000	- 55	*	2)	+	55)	//	Random	y-pixel	on	the page
};
});
console.log(circle_position_data)

svg.selectAll("circle")
   .data(geoloc)
   .enter()
   .append("circle")
   .attr("r", 5)
   .attr("cx", function (d) {return projection([d.long, d.lat])[0];})
   .attr("cy", function (d) {return projection([d.long, d.lat])[1];})
   .style("fill", "blue");

//var circle = svg.append('circle')
//  .attr('cx', projs.longProj[1])
//  .attr('cy', projs.latProj[1])
//  .attr('r', 5);
