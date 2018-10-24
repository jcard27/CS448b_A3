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

//Load data
d3.csv("/data/short_restaurant_scores.csv", parseInputRow).then(loadData);

//var parseInputRow = function(d) {
function parseInputRow (d) {
  return {
    business_id : d.business_id,
    business_name : d.business_name,
    business_longitude : +d.business_longitude,
    business_latitude : +d.business_latitude,
    inspection_score : +d.inspection_score
  };
}

function loadData(csvData){
    console.log("data loaded")
    generateVis(csvData);
};

function generateVis(csvData){
  var projectedLocation = projection([csvData[0].business_longitude,csvData[0].business_latitude])
  console.log(projectedLocation)


  //var projs = calcProjections(csvData)
  var projs = {longProj: [375, 400], latProj: [375, 400]};
  console.log(projs)

  svg.selectAll("circle")
     .data(projs)
     .enter()
     .append("circle")
     .attr("r", 5)
     .attr("cx", function (d) {return d.longProj;})
     .attr("cy", function (d) {return d.latProj;});

  //var circle = svg.append('circle')
  //  .attr('cx', projectedLocation[0])
  //  .attr('cy', projectedLocation[1])
  //  .attr('r', 5);
};
