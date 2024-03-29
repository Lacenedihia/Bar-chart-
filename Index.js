//Add Axes and Labels +reafactor the code make it cleaner add comments 
var outerWidth = 1060;
var outerHeight = 700;
var margin = { left: 210, top: 90, right: 20, bottom: 95 };
var barPadding = 0.15;

      var xColumn = "population";
      var yColumn = "country";
      var colorColumn = "religion";
      var layerColumn = colorColumn;
      
      var hoveredColorValue;
      var hoveredStrokeColor = "black";

      var innerWidth  = outerWidth  - margin.left - margin.right;
      var innerHeight = outerHeight - margin.top  - margin.bottom;
      //SVG element that contains the chart 
      var svg = d3.select("body").append("svg")
        .attr("width",  outerWidth)
        .attr("height", outerHeight);
      var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
      // This is the layer where the bars are draw+----n.
      var baseBarLayer = g.append("g");
      
      // This layer contains a semi-transparent overlay
      // that fades out the base bars.
      var overlayRect = g.append("g")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "none")
        .style("pointer-events", "none");
      
      // This contains the subset of bars rendered on top
      // when you hover over the entries in the color legend.
      var foregroundBarLayer = g.append("g");
      
      var xAxisG = g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .attr("fill","#635F5D");
      var yAxisG = g.append("g")
        .attr("class", "y axis")
        .attr("fill","#635F5D");
      var colorLegendG = g.append("g")
        .attr("class", "color-legend")
        .attr("transform", "translate(650, 75)")
        .attr("fill","#635F5D");
        //X and Y scale 
      var xScale = d3.scale.linear().range([0, innerWidth]);
      var yScale = d3.scale.ordinal().rangeBands([innerHeight, 0], barPadding);
      var colorScale = d3.scale.category10();
      
      var tipNumberFormat = d3.format(",");
      var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(function(d) {
          return [
            d[colorColumn],
            " in ",
            d[yColumn],
            ": ",
            tipNumberFormat(d[xColumn])
          ].join("");
        });
      g.call(tip);
      
      // Use a modified SI formatter that uses "B" for Billion.
      var siFormat = d3.format("s");
      var customTickFormat = function (d){
        return siFormat(d).replace("G", "B");
      };
      ///Creation of the axes using the d3.svg.axis() function +orientation
      var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
      
        .ticks(5)
        .tickFormat(customTickFormat)
        .outerTickSize(0);
      var yAxis = d3.svg.axis().scale(yScale).orient("left")
        .outerTickSize(0);
      
// Append the x-axis label
svg.append("text")
  .attr("class", "xlabel")
  .attr("text-anchor", "middle")
  .attr("x", (outerWidth+100) / 2)
  .attr("y", innerHeight + margin.bottom + 65)
  .text("Population")
  .attr("fill","#8E8883");

// Append the y-axis label
svg.append("text")
  .attr("class", "ylabel")
  .attr("text-anchor", "middle")
  .attr("transform", "translate(" + ((margin.left) / 2) + "," + ((innerHeight+105)/2 ) + ") rotate(-90)")
  .text("Countries")
  .attr("fill","#8E8883");;
//Religion label 
svg.append("text")
  .attr("class", "religionlabel")
  .attr("text-anchor", "middle")
  .attr("transform", "translate(" + (margin.left +720) + "," + (innerHeight /3.5) + ") ")
  .text("Religion")
  .attr("fill","#8E8883");;
  //title label 
  svg.append("text")
  .attr("class", "titlelabel")
  .attr("text-anchor", "middle")
  .attr("transform", "translate(" + (margin.left +400) + "," + (innerHeight /12) + ") ")
  .text("Bar chart countries and Religions")
  .attr("fill","#635F5D");
var colorLegend = d3.legend.color()
       .scale(colorScale)
        .shapePadding(5.24)
        .shapeWidth(15)
        .shapeHeight(25)
        .labelOffset(20);

      function render(data){

        var nested = d3.nest()
          .key(function (d){ return d[layerColumn]; })
          .entries(data);
        

        var stack = d3.layout.stack()
          .y(function (d){ return d[xColumn]; })
          .values(function (d){ return d.values; });

        var layers = stack(nested.reverse()).reverse();

        xScale.domain([
          0,
          d3.max(layers, function (layer){
            return d3.max(layer.values, function (d){
              return d.y0 + d.y;
            });
          })
        ]);

        yScale.domain(layers[0].values.map(function (d){
          return d[yColumn];
        }));

        colorScale.domain(layers.map(function (layer){
          return layer.key;
        }));
        ///Append the axes to the svg element 
        xAxisG.call(xAxis); 
        yAxisG.call(yAxis);
        
        renderBars(baseBarLayer, layers);
       
        if(hoveredColorValue){
          setOverlayTransparency(0.7);
          renderBars(foregroundBarLayer, layers.filter(function (layer){
            return layer.key === hoveredColorValue;
          }));
        } else {
          setOverlayTransparency(0.0);
          renderBars(foregroundBarLayer, []);
        }
        
        colorLegendG.call(colorLegend);
        
        // Move the text down a bit.
        colorLegendG.selectAll("text").attr("y", 4);
        
        listenForHover(colorLegendG.selectAll("rect"), data);
        listenForHover(colorLegendG.selectAll("text"), data);
      }
      
      function renderBars(g, layers){
        var layerGs = g.selectAll(".layer").data(layers);
        layerGs.enter().append("g").attr("class", "layer");
        layerGs.exit().remove();

        layerGs.style("fill", function (d){
          return colorScale(d.key);
        });
        
        var bars = layerGs.selectAll("rect").data(function (d){
          return d.values;
        });
        bars.enter().append("rect")
          .on("mouseover", function(d){
            tip.show(d);
          
            // Fix the issue where the tip goes off the screen.
            d3.select(".d3-tip");
          })
          .on("mouseout", tip.hide);
        bars.exit().remove();
        bars
          .attr("x", function (d){ return xScale(d.y0); })
          .attr("y", function (d){ return yScale(d[yColumn]); })
          .attr("width", function (d){ return xScale(d.y); })
          .attr("height", yScale.rangeBand());
      }
      
      function listenForHover(selection, data){
        selection
          .on("mouseover", function (d){
            hoveredColorValue = d;
            render(data);
          })
          .on("mouseout", function (d){
            hoveredColorValue = null;
            render(data);
          })
          .style("cursor", "pointer");
      }
      
      function setOverlayTransparency(alpha){
        overlayRect
          .transition().duration(400)
          .attr("fill", "rgba(255, 255, 255, " + alpha + ")");
      }

      function type(d){
        d.population = +d.population;
        return d;
      }
      
      d3.csv("religionByCountryTop20.csv", type, render);

      

      
      