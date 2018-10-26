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



var plotGroup = svg.append('g')

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');

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
   var closePoints = [];

   csvData.forEach(function(d) { d.proj = projection([d.business_longitude, d.business_latitude]); });
   console.log(csvData)

      fakeData = [{proj: [200, 100]}, {proj: [200, 300]}, {proj: [200, 500]}];

      updateRestaurants(csvData);

       var A_pos = [{x: 100, y: 100}];
       var A_pos_ll = projection.invert([A_pos[0].x, A_pos[0].y]);

       //Difference in longitude radians for 1 pixel
       radiansPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];

       //Append rectangle to svg to be dragged
       svg.selectAll("rect").raise()
         .data(A_pos)
         .enter()
         .append("rect")
         .attr("width", 10)
         .attr("height", 10)
         .attr("x", A_pos[0].x)
         .attr("y", A_pos[0].y)
         .style("fill", "blue")
         .call(d3.drag().on("drag",	on_rect_drag));


       function on_rect_drag(d)	{
         d3.select(this)
           .attr("x",	d.x =	d3.event.x)
           .attr("y",	d.y =	d3.event.y);

           A_pos = [{x: d3.event.x, y: d3.event.y}];
           A_pos_ll = projection.invert([A_pos[0].x, A_pos[0].y]);

           //console.log(A_pos[0].x)

           var closePoints = csvData.filter(function (d) {
                  //console.log([d.proj[0], A_pos[0].x]);
                  //console.log(calcDist(A_pos_ll, [d.business_longitude, d.business_latitude]))
                  //return calcDist(A_pos_ll, [d.business_longitude, d.business_latitude]) < 5
                  var dist = Math.abs(
                              Math.sqrt(
                                Math.pow((d.proj[0] - A_pos[0].x), 2)
                                +
                                Math.pow((d.proj[1] - A_pos[0].y),2)));
                  //console.log(dist)
                  console.log(dist < 50)
                  return dist < 200;//(Math.abs(d.proj[0]- A_pos.x) < 200);
           });
           //console.log(closePoints)
           updateRestaurants(closePoints)

           var radiusMiles = [4];
           svg.append("circle")
              .data(radiusMiles)
              .enter()
              .attr("r", function(d) {return calcPxRadius(d, radiansPerPixel);} )
              .attr("cx", A_pos[0].x)
              .attr("cy", A_pos[0].y)
              .call(d3.drag().on("drag",	on_rect_drag));
       }


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

       function calcPxRadius(distMiles, radiansPerPixel){
         var earth_radius = 3959;  // miles
         var radians = distMiles/earth_radius;
         var rPixels = radians/radiansPerPixel;
         return rPixels;
       }

       function updateRestaurants(closePoints) {
         //Add red circles for all restaurants based on long and lat
         //console.log(closePoints)
         console.log(closePoints)
         var circles = plotGroup.selectAll("circle")
                          .data(closePoints)

         //circles.attr("class", "update");

         circles.enter().append("circle")
             .merge(circles)
             .attr("class", "enter")
             .attr("cx", function (d) {return d.proj[0];}) //projection([d.business_longitude, d.business_latitude])[0];})
             .attr("cy", function (d) {return d.proj[1];})

        circles.exit()
               .attr("class", "exit").remove();
       }

 };
