// Remove On Screen Flights
// Hide the entities and then pop them from Array
function popFlights() {
	for (var i in viewer.entities.values) {
		try {
			//Hide 'On Screen' entities
			viewer.entities.values[i].point.show = false;
			viewer.entities.values[i].label.show = false;
		}
		catch (e) {
			console.log(e);
		}
	}
	//Delete previous entities
	viewer.entities.values.splice();
}


//Make HTTP request to get flight data
function worker() {
  $.ajax({

    url: 'http://lhr.data.fr24.com/zones/fcgi/feed.js?bounds=72.6887276154078,-37.6526917401809,5638.0078125,486.2109375&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=900&gliders=1&stats=1&', 
    success: function(data) {
      //Hide previous flights before adding new ones
      popFlights();
      var count = 0;
      for (var i in data) {
      	if (i != 'version' && i != 'stats' && i != 'full_count') {
	      	var lat = data[i][1];
	      	var lon = data[i][2];
	      	var source;
	      	if (data[i][12] === '') {
      			source = 'Not Available';
      		}
      		else {
      			source = data[i][11];
 			}     		
	      	var destination;
      		if (data[i][12] === '') {
      			destination = 'Not Available';
      		}
      		else {
      			destination = data[i][12];
      		}
	      	var details = '<body><h4>FROM :</h4>'+source+'<br><h4>TO :</h4>'+destination+'<h4>LATITUDE :</h4>'+lat+'<br><h4>LONGITUDE :</h4>'+lon+'</h4></body>';
	      	viewer.entities.add({
				name : 'Flight Code:' + data[i][16],
				description : details,
				position : Cesium.Cartesian3.fromDegrees(lon, lat),
					point : {
						pixelSize : 7,
						color : Cesium.Color.YELLOW,
						outlineColor : Cesium.Color.GREEN,
						outlineWidth : 1,
						show : true
						},
					label : {
						text : '',
						font : '8pt monospace',
						style: Cesium.LabelStyle.FILL_AND_OUTLINE,
						outlineWidth : 2,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						pixelOffset : new Cesium.Cartesian2(0, -9),
						show : true
					}
			});
      		count = count + 1;
      	}
      	// To limit the number of entities being displayed
      	// if (count >= 500) {
      	// 	break;
      	// }
      }
    },
    complete: function() {
      // Schedule the next request when the current one's complete
      // Refresh Interval: 3 seconds
      setTimeout(worker, 3000);
    }
  });
};