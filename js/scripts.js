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

A_pos = [{x: 100, y: 100}];
//Append rectangle to svg to be dragged
svg.selectAll("rect")
  .data(A_pos)
  .enter()
  .append("rect")
  .attr("width", 10)
  .attr("height", 10)
  .attr("x", 100)
  .attr("y", 100)
  .style("fill", "blue")
  .call(d3.drag().on("drag",	on_rect_drag));

function on_rect_drag(d)	{
  d3.select(this)
    .attr("x",	d.x =	d3.event.x)
    .attr("y",	d.y =	d3.event.y);
}

 //Load data
 d3.csv("/data/short_restaurant_scores.csv", parseInputRow).then(loadData);

 //Parse CSV rows
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
     generateVis(csvData);
 };

 //Generate visualization using parsed data from CSV (array of objects)
 function generateVis(csvData){
   csvData.forEach(function(d) { d.proj = projection([d.business_longitude, d.business_latitude]); });
   console.log(csvData[0])

   //Add red circles for all restaurants based on long and lat
   svg.selectAll("circle")
      .data(csvData)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
      .attr("cy", function (d) {return d.proj[1];}) //projection([d.business_longitude, d.business_latitude])[1];})
      .style("fill", "green");

       var closePoints = csvData.filter(function (d) {
              return Math.abs((projection([d.business_longitude, d.business_latitude])[0]
                     - A_pos.x)) < 200
       })

    svg.selectAll("circle")
       .data(closePoints)
       .enter()
       .append("circle")
       .attr("r", 5)
       .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
       .attr("cy", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[1];})
       .style("fill", "green");
 };
