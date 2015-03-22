
//to store the user input data
var nameArray = [];
var src = Cesium.GeoJsonDataSource.load('./ne_10m_us_states.topojson');
//max and minimun values of random data
var MAX = 599999;
var MIN = 1000;
//Coordinates of State
var stateCoords = [ { id: 'MA', lat: 42.2373, lon: -71.5314 },
  { id: 'MN', lat: 45.7326, lon: -93.9196 },
  { id: 'MT', lat: 46.9048, lon: -110.3261 },
  { id: 'ND', lat: 47.5362, lon: -99.793 },
  { id: 'HI', lat: 21.1098, lon: -157.5311 },
  { id: 'ID', lat: 44.2394, lon: -114.5103 },
  { id: 'WA', lat: 47.3917, lon: -121.5708 },
  { id: 'AZ', lat: 33.7712, lon: -111.3877 },
  { id: 'CA', lat: 36.17, lon: -119.7462 },
  { id: 'CO', lat: 39.0646, lon: -105.3272 },
  { id: 'NV', lat: 38.4199, lon: -117.1219 },
  { id: 'NM', lat: 34.8375, lon: -106.2371 },
  { id: 'OR', lat: 44.5672, lon: -122.1269 },
  { id: 'UT', lat: 40.1135, lon: -111.8535 },
  { id: 'WY', lat: 42.7475, lon: -107.2085 },
  { id: 'AR', lat: 34.9513, lon: -92.3809 },
  { id: 'IA', lat: 42.0046, lon: -93.214 },
  { id: 'KS', lat: 38.5111, lon: -96.8005 },
  { id: 'MO', lat: 38.4623, lon: -92.302 },
  { id: 'NE', lat: 41.1289, lon: -98.2883 },
  { id: 'OK', lat: 35.5376, lon: -96.9247 },
  { id: 'SD', lat: 44.2853, lon: -99.4632 },
  { id: 'LA', lat: 31.1801, lon: -91.8749 },
  { id: 'TX', lat: 31.106, lon: -97.6475 },
  { id: 'CT', lat: 41.5834, lon: -72.7622 },
  { id: 'NH', lat: 43.4108, lon: -71.5653 },
  { id: 'RI', lat: 41.6772, lon: -71.5101 },
  { id: 'VT', lat: 44.0407, lon: -72.7093 },
  { id: 'AL', lat: 32.799, lon: -86.8073 },
  { id: 'FL', lat: 27.8333, lon: -81.717 },
  { id: 'GA', lat: 32.9866, lon: -83.6487 },
  { id: 'MS', lat: 32.7673, lon: -89.6812 },
  { id: 'SC', lat: 33.8191, lon: -80.9066 },
  { id: 'IL', lat: 40.3363, lon: -89.0022 },
  { id: 'IN', lat: 39.8647, lon: -86.2604 },
  { id: 'KY', lat: 37.669, lon: -84.6514 },
  { id: 'NC', lat: 35.6411, lon: -79.8431 },
  { id: 'OH', lat: 40.3736, lon: -82.7755 },
  { id: 'TN', lat: 35.7449, lon: -86.7489 },
  { id: 'VA', lat: 37.768, lon: -78.2057 },
  { id: 'WI', lat: 44.2563, lon: -89.6385 },
  { id: 'WV', lat: 38.468, lon: -80.9696 },
  { id: 'DE', lat: 39.3498, lon: -75.5148 },
  { id: 'DC', lat: 38.8964, lon: -77.0262 },
  { id: 'MD', lat: 39.0724, lon: -76.7902 },
  { id: 'NJ', lat: 40.314, lon: -74.5089 },
  { id: 'NY', lat: 42.1497, lon: -74.9384 },
  { id: 'PA', lat: 40.5773, lon: -77.264 },
  { id: 'ME', lat: 44.6074, lon: -69.3977 },
  { id: 'MI', lat: 43.3504, lon: -84.5603 },
  { id: 'AK', lat: 61.385, lon: -152.2683 } ];

//Array is of the type {1,1x,1xx,2,2x,3...}
//Required  format {1,2,3..}
function removeDuplicates(nameArray) {
    var newArr = [];
    newArr.push(nameArray[0]);
    for (var i=0, j = 1; j<nameArray.length; j++) {
        if (nameArray[i].stateName != nameArray[j].stateName) {
            newArr.push(nameArray[j]);
            i = j;
            //console.log(nameArray[j].id);
        }
    }
    return newArr;
}

function extractData() {
    src.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        //Get the array of entities
        var entities = dataSource.entities.values;
        // to store State names
        for (var i = 0; i < entities.length; i++) {
            //For each entity, find the name, id and push to nameArray
            var entity = entities[i];
            var name = entity.name;
            var id = entity.id;
            nameArray.push({id:id,stateName:name});
        }
        //nameArray = removeDuplicate(nameArray);
        nameArray = removeDuplicates(nameArray);
        //Display Controls for Users to add data
        drawControls(nameArray);
    }).otherwise(function(error){
        //Display any errrors encountered while loading.
        console.log(error);
    });
}

function drawControls(nameArray) {
    //form table is to be appended in div 'dataForm'
    var ctr = document.getElementById('toolbar');
    if(document.getElementById('dataTable')) {
        return;
    }
    //creating the table
    var table = document.createElement('table');
    table.setAttribute('id', 'dataTable');
    table.setAttribute('class', 'table table-striped table-hover table-condensed');
    //table head
    var thead = document.createElement('thead');
    var xtr = document.createElement('tr');
    var th1 = document.createElement('th');
    var th2 = document.createElement('th');
    var head1 = document.createTextNode('State');
    // var inputDiv = document.createElement('div');
    var head2 = document.createElement('input');
    // inputDiv.setAttribute('class','form-group');
    head2.setAttribute('type', 'text');
    head2.setAttribute('value', 'Data');
    head2.setAttribute('id', 'userDataName');
    head2.setAttribute('class', 'form-control');
    // inputDiv.appendChild(head2);
    th1.appendChild(head1);
    th2.appendChild(head2);
    xtr.appendChild(th1);
    xtr.appendChild(th2);
    thead.appendChild(xtr);
    table.appendChild(thead);
    //table body
    var tbody = document.createElement('tbody');
    for (var i = 0; i < nameArray.length; i++){
        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        //setting attribute id for the table cells
        td1.setAttribute('id', 'stateName' + i);
        var text2 = document.createTextNode(nameArray[i].stateName);
        //making inputbox for user to fill data
        // inputDiv = document.createElement('div');
        // inputDiv.setAttribute('class','form-group');
        var mi = document.createElement('input');
        mi.setAttribute('type', 'text');
        mi.setAttribute('value', '0');
        mi.setAttribute('id', 'stateData' + i);
        mi.setAttribute('class', 'form-control');
        // inputDiv.appendChild(mi);
        td1.appendChild(text2);
        td2.appendChild(mi);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    var btngroup = document.createElement('div');
    btngroup.setAttribute('class', 'btn-group');
    btngroup.setAttribute('role', 'group');
    // Go Button (to plot data)
    var btn = document.createElement('input');
    btn.setAttribute('type', 'button');
    btn.setAttribute('value', 'Go');
    btn.setAttribute('onclick', 'formToArray()');
    btn.setAttribute('class', 'btn btn-success');
    // Random data generator (for the lazy)
    var btn2 = document.createElement('input');
    btn2.setAttribute('type', 'button');
    btn2.setAttribute('value', 'Generate Random Data');
    btn2.setAttribute('onclick', 'randomData()');
    btn2.setAttribute('class', 'btn btn-primary');
    btngroup.appendChild(btn);
    btngroup.appendChild(btn2);
    ctr.appendChild(btngroup);
    ctr.appendChild(table);
}

//Hide On Screen Text Data
//And Pop The Entities from viewer
function popScreenText() {
    for (var i in viewer.entities.values) {
        try {
            //Hide 'On Screen' entities
            viewer.entities.values[i].label.show = false;
        }
        catch (e) {
            console.log(e);
        }
    }
    //Delete previous entities
    viewer.entities.values.splice();
}

//Generating Random Data for the forms
//for demo purpose
function randomData() {
    for (var i = 0; i < nameArray.length; i++) {
        document.getElementById('stateData' + i).value = Math.floor((Math.random() * MAX) + MIN);;
    }
}

//Extracting data from forms
function formToArray() {
    for (var i = 0; i < nameArray.length; i++) {
        var fieldData = document.getElementById('stateData' + i).value;
        nameArray[i].stateData = fieldData;
    }
    //plot the user data on map
    plotData();
}

function plotData() {
    //Remove on screen text data(if any)
    popScreenText();
    //Seed the random number generator for repeatable results.
    Cesium.Math.setRandomNumberSeed(42);
    viewer.dataSources.removeAll();
    src.then(function(dataSource) {
        viewer.dataSources.add(dataSource);

        //Get the array of entities
        var entities = dataSource.entities.values;
        //console.log(entities);
        var userDataName = document.getElementById('userDataName').value;
        if (userDataName.replace(/^\s+|\s+$/g,'').length === 0) {
            userDataName = 'User Data';
        }
        var colorHash = {};
        for (var i = 0; i < entities.length; i++) {
            //For each entity, create a random color based on the state name.
            //Some states have multiple entities, so we store the color in a
            //hash so that we use the same color for the entire state.
            var entity = entities[i];
            var name = entity.name;
            var color = colorHash[name];
            if (!color) {
                color = Cesium.Color.fromRandom({
                    alpha : 0.5
                });
                colorHash[name] = color;
            }
            //Set the polygon material to our random color.
            entity.polygon.material = color;
            //Outline each polygon in black.
            entity.polygon.outlineColor = Cesium.Color(0, 0, 1, 0.5);
            for (var j=0; j < nameArray.length; j++) {
                if (name === nameArray[j].stateName) {
                    var data = parseInt(nameArray[j].stateData)
                    entity.properties[userDataName] = data;
                    entity.polygon.extrudedHeight = data;
                    test(nameArray[j].id, j, data);
                }
            }
        }
    }).otherwise(function(error){
        //Display any errrors encountered while loading.
        window.alert(error);
    });
    //addLabels();
}

function test(_id, index, height) {
    //console.log(index);
    //console.log(stateCoords[index].id, _id);
    if (stateCoords[index].id === _id) {
        //console.log(Cesium.Cartesian3.fromDegrees(stateCoords[index].lon, stateCoords[index].lat, height+50));
        viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(stateCoords[index].lon, stateCoords[index].lat, height+100),
            label : {
                text : String(height),
                font : '10px Helvetica',
                fillColor : Cesium.Color.WHITE,
                outlineColor : Cesium.Color.BLACK,
                outlineWidth : 2,
                style : Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin : Cesium.VerticalOrigin.TOP
            }
        });
    }
}