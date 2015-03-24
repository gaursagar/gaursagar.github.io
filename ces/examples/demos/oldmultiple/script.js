//to store the user input data
var nameArray = [];
var src = Cesium.GeoJsonDataSource.load('./ne_10m_us_states.topojson');
//max and minimun values of random data
var MAX = 599999;
var MIN = 1000;

//Array is of the type {1,1x,1xx,2,2x,3...}
//Required  format {1,2,3..}
function removeDuplicates(nameArray) {
    var newArr = [];
    newArr.push(nameArray[0]);
    for (var i=0, j = 1; j<nameArray.length; j++) {
        if (nameArray[i].stateName != nameArray[j].stateName) {
            newArr.push(nameArray[j]);
            i = j;
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
    var xtr = document.createElement('tr');
    var th1 = document.createElement('th');
    var th2 = document.createElement('th');
    var head1 = document.createTextNode('State');
    var head2 = document.createTextNode('Data');
    th1.appendChild(head1);
    th2.appendChild(head2);
    xtr.appendChild(th1);
    xtr.appendChild(th2);
    table.appendChild(xtr);
    for (var i = 0; i < nameArray.length; i++){
        var tr = document.createElement('tr');
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        //setting attribute id for the table cells
        td1.setAttribute('id', 'stateName' + i);
        var text2 = document.createTextNode(nameArray[i].stateName);
        //making inputbox for user to fill data
        var mi = document.createElement('input');
        mi.setAttribute('type', 'text');
        mi.setAttribute('value', '0');
        mi.setAttribute('id', 'stateData' + i);
        td1.appendChild(text2);
        td2.appendChild(mi);
        tr.appendChild(td1);
        tr.appendChild(td2);
        table.appendChild(tr);
    }
    // Go Button (to plot data)
    var btn = document.createElement('input');
    btn.setAttribute('type', 'button');
    btn.setAttribute('value', 'Go');
    btn.setAttribute('onclick', 'formToArray()');
    // Random data generator (for the lazy)
    var btn2 = document.createElement('input');
    btn2.setAttribute('type', 'button');
    btn2.setAttribute('value', 'Generate Random Data');
    btn2.setAttribute('onclick', 'randomData()');
    ctr.appendChild(btn);
    ctr.appendChild(btn2);
    ctr.appendChild(table);
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
    renderData();
}

function renderData() {
//Seed the random number generator for repeatable results.
    Cesium.Math.setRandomNumberSeed(0);

    src.then(function(dataSource) {
        viewer.dataSources.add(dataSource);

        //Get the array of entities
        var entities = dataSource.entities.values;
        
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
                    alpha : 1.0
                });
                colorHash[name] = color;
            }
            //Set the polygon material to our random color.
            entity.polygon.material = color;
            //Outline each polygon in black.
            entity.polygon.outlineColor = Cesium.Color.BLACK;

            for (var j=0; j < nameArray.length; j++) {
                if (name === nameArray[j].stateName) {
                    entity.polygon.extrudedHeight = parseInt(nameArray[j].stateData);
                }
            }
        }
    }).otherwise(function(error){
        //Display any errrors encountered while loading.
        window.alert(error);
    });
}