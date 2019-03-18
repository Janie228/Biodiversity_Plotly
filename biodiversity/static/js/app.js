// This function reformat the dataset into a dictionary array list, 
// sort, and slice the 1st top 10 rows
function filterData(dataset) {
  dList = [];
 
  for (i=0; i < 80; i++) { 
  //  console.log(`ROw${i}]: ${results.otu_ids[i]}, ${results.sample_values[i]}, ${results.otu_labels[i]}`) ;
    dict = {};
    dict["otu_ids"] = dataset.otu_ids[i];
    dict["smpl_values"] = dataset.sample_values[i];
    dict["otu_labels"] = dataset.otu_labels[i];
    dList.push(dict);
  }
  // console.log(dList);

  // Sort by sample_values
  dList.sort(function(a, b) {
    return parseFloat(b.smpl_values) - parseFloat(a.smpl_values);
  });

  // Slice the first 10 objects for plotting
  results = dList.slice(0, 10);

  return results;
}

// This function build the gauge chart
function buildGauge(freq) {
  // Enter a speed between 0 and 9
  var level = (180/9) * freq; //Calculate frequency to match 180 degree
  // console.log(freq);
  // console.log(level);
  // Trig to calc meter point
  var degrees = 180 - level,
      radius = .3;
  var radians = degrees * Math.PI / 180;
  var x = radius * Math.cos(radians);
  var y = radius * Math.sin(radians);

  // Path: may have to change to create a better triangle
  var mainPath = 'M -.0 -0.025 L .0 0.025 L',
      pathX = String(x),
      space = ' ',
      pathY = String(y),
      pathEnd = ' Z';
  var path = mainPath.concat(pathX,space,pathY,pathEnd);

  var data = [{ type: 'scatter', x: [0], y:[0],
      marker: {size: 15, color:'850000'},
      showlegend: false,
      name: 'Frequency',
      text: freq,
      hoverinfo: 'text+name'},
    { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
    rotation: 90,
    text: ['8-9', '7-8','6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1'],
    textinfo: 'text',
    textposition:'inside',
    marker: {colors:['rgb(14, 122, 14, .5)', 'rgb(16, 163, 16, .5)', 'rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
                          'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)', 'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
                          'rgb(242, 242, 242, .5)', 'rgba(255, 255, 255, 0)']},
    // labels: ['8-9', '7-8','6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1'],
    hoverinfo: "none",
    hole: .25,
    type: 'pie',
    showlegend: false
  }];

  var layout = {
    // hovermode: false,
    shapes:[{
        type: 'path',
        path: path,
        fillcolor: '850000',
        line: {
          color: '850000'
        }
      }],
    title: '<b>Belly Button Washing Frequency</b><br>Scrubs Per Week',
    height: 500,
    width: 500,
    xaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]},
    yaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]}
  };

  Plotly.newPlot('gauge', data, layout);
}

// This function build the gauge chart and display the data
function buildMetadata(sample) {
  // Initialize variable for Gauge chart
  var wk_Freq = 0;

  // Use `d3.json` to fetch the metadata for a sample
  url = "/metadata/" + sample
  d3.json(url).then(results => {
    metaDiv = d3.select("#smpl-meta");
    // Add each key and value pair to the meta data panel
    Object.entries(results).forEach(([key, value]) => {
      if (key != "WFREQ"){
        var ptext = `${key.toUpperCase()}: ${value}`;
        // console.log(ptext);
        metaDiv.append("p").text(ptext);
      }else{
        wk_Freq = value;
      }
    });

    // Build the Gauge Chart
    buildGauge(wk_Freq);
  });
}

// This function build the bubble & pie charts
function buildCharts(sample) {
  // Use `d3.json` to fetch the sample data for the plots
  url = "/samples/" + sample
  d3.json(url).then(function(results) {
    // console.log(results)
    // Build a Bubble Chart using the sample data
    var trace = {
      x: results.otu_ids,
      y: results.sample_values,
      text: results.otu_labels,
      // hoverinfo: 'all',
      mode: "markers",
      marker: {
        color: results.otu_ids,
        size: results.sample_values,
        colorscale: "Rainbow"
      }
    };
    
    var data = [trace];
    
    var layout = {
      hovermode: "closest",
      xaxis: {title: {text: 'OTU ID'}}
    };
    
    Plotly.newPlot('bubble', data, layout);
  
    // -------------------------------------------------------------------
    // Build a Pie Chart
    dataset = filterData(results);
    // console.log(dataset);   dataset.map(row => row.otu_labels)

    var trace1 = {
      labels: dataset.map(row => row.otu_ids),
      values: dataset.map(row => row.smpl_values),
      hovertext: dataset.map(row => row.otu_labels),
      type: 'pie'
    };

    var data1 = [trace1];

    var layout1 = {
      width: 500,
      height: 500
    };

    Plotly.newPlot("pie", data1, layout1);
  });

}
// This function clear all charts & data
function clearAll(){
  // clear any existing metadata in `#smpl-meta` panel 
  d3.select("#smpl-meta").selectAll("*").remove();

  // clear any data in `#bubble` panel 
  d3.select("#bubble").selectAll("*").remove();

  // clear any data in `#pie` panel 
  d3.select("#pie").selectAll("*").remove();

  // clear any data in `#gauge` panel 
  d3.select("#gauge").selectAll("*").remove();
}

// This function intialize the dashboard
function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#sel_dataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });
    // console.log(sampleNames)
    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

// Initialize the dashboard
init();

// This function rebuild all charts & data on selection change 
function optionChanged(newSample) { 
  // Clear all charts & data
  clearAll();
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}


