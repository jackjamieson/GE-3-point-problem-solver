var ge;//Google Earth reference
var geocoder = null;//geocode reference

var bordersEnabled = true;

//x,y,z for the 3 points
var point1 = [];
var point2 = [];
var point3 = [];

var clickCount;//The number of times a marker has been placed.  Will get reset to 0 when > 3.
var symbolCount = 0;

var modelFolder;
var placemarkFolder;

var csvArray = [];

////////////////////////////////////////////////////////////////////////////////////////
//Init functions
//Set up GE and init click count
function load() {

	clickCount = 0;
	google.load("earth", "1", {"other_params":"sensor=false"});//We are not using gps sensors
	google.load('maps', '3.6', {
		other_params: 'sensor=false'
	});
}

//Create instance of GE
function init() {
	google.earth.createInstance('map3d', initCB, failureCB);
}

//If GE succeeds setup, run this method
function initCB(instance) {

	ge = instance;
	geocoder = new window.google.maps.Geocoder(); //v3 Geocoder
	ge.getWindow().setVisibility(true);

	//create the folders
	modelFolder = ge.createFolder('models');
	placemarkFolder = ge.createFolder('annos');

	//Turn the nav controls on
	ge.getNavigationControl().setVisibility(true);

	//Turn on border and elevation layers, historical imagery
	var layerRoot = ge.getLayerRoot();
	var terrainLayer = layerRoot.getLayerById(ge.LAYER_TERRAIN);
	terrainLayer.setVisibility(true);
	ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
	//ge.getTime().setHistoricalImageryEnabled(true);
	//Set meters as the default measurement
	//ge.getOptions().setScaleLegendVisibility(true);
	ge.getOptions().setUnitsFeetMiles(false);
	ge.getOptions().setStatusBarVisibility(true);

	//Track mouse movements and output them left of the plugin window
	google.earth.addEventListener(ge.getWindow(), 'mousemove', function(event) {
		var statusHTML = 'Elevation: N/A';
		var lat = 'Latitude: N/A';
		var lon = 'Longitude: N/A';
		if (event.getDidHitGlobe()) {
			var latitude = event.getLatitude();
			var longitude = event.getLongitude();

			var groundAltitude = ge.getGlobe().getGroundAltitude(latitude, longitude);
			if (groundAltitude) {
				statusHTML = 'Elevation: <span style="color:#000; font-weight:bold;">' +
					groundAltitude.toFixed(2) + ' meters</span>';

				lat = 'Latitude: <span style="color:#000; font-weight:bold;">' + latitude +'</span>';
				lon = 'Longitude: <span style="color:#000; font-weight:bold;">' + longitude +'</span>';
			}
		}

		document.getElementById('ground-altitude').innerHTML = statusHTML;
		document.getElementById('latitude').innerHTML = lat;
		document.getElementById('longitude').innerHTML = lon;

	});

	//Add event handler for a click(alt-click) check in eventHandler()
	google.earth.addEventListener(ge.getGlobe(), 'click', eventHandler);

}

//Run the method if GE does not set up correctly.
function failureCB(errorCode) {

	alert("Geocode Error: " + errorCode);

}
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
//Utility functions to calculate radians and degrees
if (typeof Number.prototype.toRadians == 'undefined') {
	Number.prototype.toRadians = function() { return this * Math.PI / 180; }
}

if (typeof Number.prototype.toDegrees == 'undefined') {
	Number.prototype.toDegrees = function() { return this * 180 / Math.PI; }
}

//returns the sign of the given number
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
//GE interaction functions
//Move the camera to the specified point
function moveCamera(point)
{
	// Get the current view.
	var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);

	// Set new latitude and longitude values.
	lookAt.setLatitude(point[0]);
	lookAt.setLongitude(point[1]);

	// Update the view in Google Earth.
	ge.getView().setAbstractView(lookAt);	
}

//Exports the features on GE to a kml file
function exportFeatures()
{

	var kmlString = '';

	var models = ge.getElementsByType('KmlPlacemark');
	for (var i = 0; i < models.getLength(); ++i) {
		var model = models.item(i);
		//if(placemark.getKml)
		//	console.log(placemark.getKml());
		//var geom = placemark.getGeometry();
		kmlString += model.getKml();
	}

	//var kmlPMarkString = '';
	//var kmlModelString = '';

	//These are to seperate into folders, removed temporarily
	/*
	var models = modelFolder.getElementsByType('KmlPlacemark');
	for (var i = 0; i < models.getLength(); ++i) {
		var model = models.item(i);
		//if(placemark.getKml)
		//	console.log(placemark.getKml());
		//var geom = placemark.getGeometry();
		kmlModelString += model.getKml();
	}
	var placemarks = placemarkFolder.getElementsByType('KmlPlacemark');
	for (var i = 0; i < placemarks.getLength(); ++i) {
		var placemark = placemarks.item(i);
		//if(placemark.getKml)
		//	console.log(placemark.getKml());
		//var geom = placemark.getGeometry();
		kmlPMarkString += placemark.getKml();
	}
	*/


	//regex to remove the headers from each kmlobject.  Just the placemarks remain.
	//kmlPMarkString = kmlPMarkString.replace(/<\?xml version\="1\.0" encoding\="UTF-8"\?>*/mg, '');
	//kmlPMarkString = kmlPMarkString.replace(/<kml xmlns\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:gx\="http:\/\/www.google.com\/kml\/ext\/2.2" xmlns:kml\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:atom\="http:\/\/www.w3.org\/2005\/Atom">*/mg, '');
	//kmlPMarkString = kmlPMarkString.replace(/<\/kml>*/mg, '');

	//kmlModelString = kmlModelString.replace(/<\?xml version\="1\.0" encoding\="UTF-8"\?>*/mg, '');
	//kmlModelString = kmlModelString.replace(/<kml xmlns\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:gx\="http:\/\/www.google.com\/kml\/ext\/2.2" xmlns:kml\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:atom\="http:\/\/www.w3.org\/2005\/Atom">*/mg, '');
	//kmlModelString = kmlModelString.replace(/<\/kml>*/mg, '');


	//kmlModelString = '<?xml version="1.0" encoding="UTF-8"?>\n' +
	//	'<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
	//	'<Document>\n' +
	//	'\t<name>3ppGeoSymbols.kml</name>\n' +
	//	'\t<Folder>\n' +
	//	'\t\t<name>Models</name>\n' + 
	//	kmlModelString;


	//kmlModelString += '\t</Folder>\n';

	//kmlPMarkString = '\t<Folder><name>Annotations</name>' + kmlPMarkString + '</Folder>';

	//kmlPMarkString +=
	//	'</Document>\n' +
	//	'</kml>';

	//return kmlModelString + kmlPMarkString;
	//console.log(kmlPMarkString);

	//regex to remove the headers from each kmlobject.  Just the placemarks remain.
	kmlString = kmlString.replace(/<\?xml version\="1\.0" encoding\="UTF-8"\?>*/mg, '');
	kmlString = kmlString.replace(/<kml xmlns\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:gx\="http:\/\/www.google.com\/kml\/ext\/2.2" xmlns:kml\="http:\/\/www.opengis.net\/kml\/2.2" xmlns:atom\="http:\/\/www.w3.org\/2005\/Atom">*/mg, '');
	kmlString = kmlString.replace(/<\/kml>*/mg, '');

	kmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
		'<Document>\n' +
		'\t<name>3ppGeoSymbols.kml</name>\n' +
		'\t<Folder>\n' +
		'\t\t<name>Annotations and Models</name>\n' + 
		kmlString;

	kmlString +=
		'</Folder>\n' +
		'</Document>\n' +
		'</kml>';

	//console.log(kmlString);
	return kmlString;


}

function exportCSV()
{
	var csv = ', Location 1, Location 2, Location 3, Strike, Dip, Dip Azimuth';

	csvArray.forEach(function(entry){
		csv += '\nLatitude, ' + entry.loc1[0] + ', ' + entry.loc2[0] + ', ' + entry.loc3[0] + ', ' + entry.strike + ', ' + entry.dip + ', ' + entry.dipaz;
		csv += '\nLongitude, ' + entry.loc1[1] + ', ' + entry.loc2[1] + ', ' + entry.loc3[1];
		csv += '\nElevation, ' + entry.loc1[2] + ', ' + entry.loc2[2] + ', ' + entry.loc3[2];
		csv += '\n';

	});

	return csv;
}

//plots a point at the specified lat/long with the provided title.
function plotPoint(title, lat, lon){



	lat = parseFloat(lat);
	lon = parseFloat(lon);

	var placemark = ge.createPlacemark('');


	placemark.setName(title);

	// Define a custom icon.
	var icon = ge.createIcon('');
	icon.setHref('http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png');
	var style = ge.createStyle(''); //create a new style
	style.getIconStyle().setIcon(icon); //apply the icon to the style
	placemark.setStyleSelector(style); //apply the style to the placemark

	// Set the placemark's location.  
	var point = ge.createPoint('');
	//console.log(lat);
	point.setLatitude(lat);
	point.setLongitude(lon);
	placemark.setGeometry(point);

	// Add the placemark to Earth.
	placemarkFolder.getFeatures().appendChild(placemark);
	ge.getFeatures().appendChild(placemarkFolder);

}


//draw the geologic symbol
function drawSymbol(p2, dist, dip, dipaz)
{

	//draw the point with dip/dip azimuth
	var dipF = Math.floor(dip);
	var dipAzF = Math.floor(dipaz);

	dipF = dipF.toString();
	dipAzF = dipAzF.toString();

	if(dipF.length == 1)
	{
		dipF = "0" + dipF.toString();	
	}
	if(dipAzF.length == 2)
	{
		dipAzF = "0" + dipAzF.toString();	
	}
	if(dipAzF.length == 1)
	{
		dipAzF = "00" + dipAzF.toString();	
	}

	//console.log(dipF.length);
	plotPoint("" + dipF + "/" + dipAzF, p2[0], p2[1]);

	//Get the selected option from the dropdown
	symbolCount++;
	var option = ($("#sel")[0].selectedOptions); 


	// Placemark
	var placemark = ge.createPlacemark(option.item(0).value + "" + symbolCount);
	placemark.setName(option.item(0).value + "" + symbolCount);



	// Placemark/Model (geometry)
	var model = ge.createModel('');
	placemark.setGeometry(model);

	// Placemark/Model/Link
	var link = ge.createLink('');
	link.setHref('https://dl.dropboxusercontent.com/u/89445333/GEsymbols/' + option.item(0).value + '.dae');
	model.setLink(link);

	// Placemark/Model/Location
	var loc = ge.createLocation('');
	loc.setLatitude(p2[0]);
	loc.setLongitude(p2[1]);

	model.setLocation(loc);

	var scale = ge.createScale('');
	var orient = ge.createOrientation('');

	if(option.item(0).value == "5-m-Wcircle" || option.item(0).value == "5-m-Bcircle" || option.item(0).value == "5-m-Pcircle")
	{
		orient.set(dipaz, dip, 0);
		model.setOrientation(orient);
		//console.log($('#scalex').val().length);
		if($('#scalex').val().length < 1 || $('#scaley').val().length < 1)
		{
			scale.set(dist/5 , dist/5, 1.0);

		}
		else scale.set(Number($('#scalex').val())/10 ,Number($('#scaley').val())/10, 1.0);
	}
	else
	{
		orient.set(dipaz, 0, 0);
		model.setOrientation(orient);
		scale.set(dist/5 , dist/5, 1.0);
		//loc.setAltitude(p2[2] + 1000);//Trying to fix the altitude, doesn't seem to do anything.
	}

	model.setScale(scale);

	// add the model placemark to Earth and the model folder
	modelFolder.getFeatures().appendChild(placemark);
	ge.getFeatures().appendChild(modelFolder);
}

//find the location on the earth and go to it
var geocode = function(address) {
	geocoder.geocode({ 'address': address }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			// do something with the result, such as flying to it...
			var point = results[0].geometry.location;
			var lookat = ge.createLookAt('');
			lookat.set(point.lat(), point.lng(), 100, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 1000);
			ge.getView().setAbstractView(lookat);
		} else {
			alert("Geocode Error: " + status);
		}
	});
};

//Handle an alt+click event
function eventHandler(event) {



	if(event.getAltKey() === true) {
		if(clickCount == 3)
			clickCount = 0;
		clickCount++;

		var latitude = event.getLatitude();
		var longitude = event.getLongitude();
		var groundAltitude = ge.getGlobe().getGroundAltitude(latitude, longitude);

		switch(clickCount) {
			case 1:
				//Reset the arrays
				point1 = [];
				point2 = [];
				point3 = [];

				document.getElementById('strike').innerHTML = 'Strike: ';
				document.getElementById('dip').innerHTML = 'Dip: ';
				document.getElementById('quad').innerHTML = 'Quadrant: ';
				document.getElementById('dip-az').innerHTML = 'Dip-Azimuth: ';
				point1.push(latitude, longitude, groundAltitude);
				console.log(point1);
				//Plot the point on the map
				plotPoint("P1", point1[0], point1[1]);

				break;
			case 2:
				point2.push(latitude, longitude, groundAltitude);
				plotPoint("P2", point2[0], point2[1]);

				break;
			case 3:
				point3.push(latitude, longitude, groundAltitude);

				plotPoint("P3", point3[0], point3[1]);

				//Find which is highest, medium, lowest
				var p1z, p2z, p3z;
				p1z = point1[2];
				p2z = point2[2];
				p3z = point3[2];

				var sortArr = [p1z, p2z, p3z];
				sortArr = sortArr.sort(function(a,b) { return a - b;});//Sort the elevation values

				var l = sortArr[0];
				var m = sortArr[1];
				var h = sortArr[2];

				//vars for azimuth, distance, plunge
				var hmAzimuth, hlAzimuth;
				var hmDist, hlDist;
				var hmPlunge, hlPlunge;


				//Logic to see which point is the high, medium, low
				if(point1[2] == h && point2[2] == m && point3[2] == l)
				{
					hmAzimuth = calcBearing(point1, point2);
					hlAzimuth = calcBearing(point1, point3);

					hmDist = calcDistance(point1, point2);
					hlDist = calcDistance(point1, point3);

					hmPlunge = calcPlunge(point1, point2, hmDist);
					hlPlunge = calcPlunge(point1, point3, hlDist);
				}
				else if(point1[2] == h && point2[2] == l && point3[2] == m)
				{
					hmAzimuth = calcBearing(point1, point3);
					hlAzimuth = calcBearing(point1, point2);

					hmDist = calcDistance(point1, point3);
					hlDist = calcDistance(point1, point2);

					hmPlunge = calcPlunge(point1, point3, hmDist);
					hlPlunge = calcPlunge(point1, point2, hlDist);
				}
				else if(point1[2] == m && point2[2] == h && point3[2] == l)
				{
					hmAzimuth = calcBearing(point2, point1);
					hlAzimuth = calcBearing(point2, point3);

					hmDist = calcDistance(point2, point1);
					hlDist = calcDistance(point2, point3);

					hmPlunge = calcPlunge(point2, point1, hmDist);
					hlPlunge = calcPlunge(point2, point3, hlDist);

				}
				else if(point1[2] == l && point2[2] == h && point3[2] == m)
				{
					hmAzimuth = calcBearing(point2, point3);
					hlAzimuth = calcBearing(point2, point1);

					hmDist = calcDistance(point2, point3);
					hlDist = calcDistance(point2, point1);

					hmPlunge = calcPlunge(point2, point3, hmDist);
					hlPlunge = calcPlunge(point2, point1, hlDist);
				}
				else if(point1[2] == m && point2[2] == l && point3[2] == h)
				{
					hmAzimuth = calcBearing(point3, point1);
					hlAzimuth = calcBearing(point3, point2);

					hmDist = calcDistance(point3, point1);
					hlDist = calcDistance(point3, point2);

					hmPlunge = calcPlunge(point3, point1, hmDist);
					hlPlunge = calcPlunge(point3, point2, hlDist);
				}
				else if(point1[2] == l && point2[2] == m && point3[2] == h)
				{
					hmAzimuth = calcBearing(point3, point2);
					hlAzimuth = calcBearing(point3, point1);

					hmDist = calcDistance(point3, point2);
					hlDist = calcDistance(point3, point1);

					hmPlunge = calcPlunge(point3, point2, hmDist);
					hlPlunge = calcPlunge(point3, point1, hlDist);
				}


				//Calculate the strike and dip and store in object results
				var results = calcStrikeDip(hmAzimuth, hlAzimuth, hmPlunge, hlPlunge);

				document.getElementById('strike').innerHTML = 'Strike: <span style="color:#000; font-weight:bold;">' + results.strike +'</span>';
				document.getElementById('dip').innerHTML = 'Dip: <span style="color:#000; font-weight:bold;">' + results.dip +'</span>';
				document.getElementById('quad').innerHTML = 'Quadrant: <span style="color:#000; font-weight:bold;">' + results.quad +'</span>';
				document.getElementById('dip-az').innerHTML = 'Dip-Azimuth: <span style="color:#000; font-weight:bold;">' + results.dipaz +'</span>';



				//Draw the chosen symbol
				drawSymbol(point2, hlDist, results.dip, results.dipaz);
				moveCamera(point2);//Move the camera to point2
				clickCount = 3;

				//add the results to the csv array to export later.
				//make it into an object too for easy storage
				
				var csvObj = {
					loc1:  point1,
					loc2: point2,
					loc3: point3,
					dip: results.dip,
					strike: results.strike,
					dipaz: results.dipaz
				};
				csvArray.push(csvObj);
				break;
			default:

		}	
	}


}

//manualPlot takes in the values from the input boxes and calculates the 3 point problem.
//It ignores GE elevations and uses the ones provided for the calc
function manualPlot(lat1, lon1, alt1, lat2, lon2, alt2, lat3, lon3, alt3) {
	point1 = [];
	point2 = [];
	point3 = [];

	lat1 = parseFloat(lat1);
	lon1 = parseFloat(lon1);
	alt1 = parseFloat(alt1);
	lat2 = parseFloat(lat2);
	lon2 = parseFloat(lon2);
	alt2 = parseFloat(alt2);
	lat3 = parseFloat(lat3);
	lon3 = parseFloat(lon3);
	alt3 = parseFloat(alt3);

	//plot p1
	//useful if we wanted to get the ground altitude from GE, but sometimes inaccurate
	//var groundAltitude = ge.getGlobe().getGroundAltitude(lat1, lon1);
	point1.push(lat1, lon1, alt1);
	//Plot the point on the map
	plotPoint("P1", lat1, lon1);


	//plot p2
	//groundAltitude = ge.getGlobe().getGroundAltitude(lat2, lon2);
	point2.push(lat2, lon2, alt2);
	plotPoint("P2", lat2, lon2);


	//plot p3
	//groundAltitude = ge.getGlobe().getGroundAltitude(lat3, lon3);
	point3.push(lat3, lon3, alt3);
	plotPoint("P3", lat3, lon3);

	//Find which is highest, medium, lowest
	var p1z, p2z, p3z;
	p1z = point1[2];
	p2z = point2[2];
	p3z = point3[2];

	var sortArr = [p1z, p2z, p3z];
	sortArr = sortArr.sort(function(a,b) { return a - b;});//Sort the elevation values

	var l = sortArr[0];
	var m = sortArr[1];
	var h = sortArr[2];

	//vars for azimuth, distance, plunge
	var hmAzimuth, hlAzimuth;
	var hmDist, hlDist;
	var hmPlunge, hlPlunge;


	//Logic to see which point is the high, medium, low
	if(point1[2] == h && point2[2] == m && point3[2] == l)
	{
		hmAzimuth = calcBearing(point1, point2);
		hlAzimuth = calcBearing(point1, point3);

		hmDist = calcDistance(point1, point2);
		hlDist = calcDistance(point1, point3);

		hmPlunge = calcPlunge(point1, point2, hmDist);
		hlPlunge = calcPlunge(point1, point3, hlDist);
	}
	else if(point1[2] == h && point2[2] == l && point3[2] == m)
	{
		hmAzimuth = calcBearing(point1, point3);
		hlAzimuth = calcBearing(point1, point2);

		hmDist = calcDistance(point1, point3);
		hlDist = calcDistance(point1, point2);

		hmPlunge = calcPlunge(point1, point3, hmDist);
		hlPlunge = calcPlunge(point1, point2, hlDist);
	}
	else if(point1[2] == m && point2[2] == h && point3[2] == l)
	{
		hmAzimuth = calcBearing(point2, point1);
		hlAzimuth = calcBearing(point2, point3);

		hmDist = calcDistance(point2, point1);
		hlDist = calcDistance(point2, point3);

		hmPlunge = calcPlunge(point2, point1, hmDist);
		hlPlunge = calcPlunge(point2, point3, hlDist);

	}
	else if(point1[2] == l && point2[2] == h && point3[2] == m)
	{
		hmAzimuth = calcBearing(point2, point3);
		hlAzimuth = calcBearing(point2, point1);

		hmDist = calcDistance(point2, point3);
		hlDist = calcDistance(point2, point1);

		hmPlunge = calcPlunge(point2, point3, hmDist);
		hlPlunge = calcPlunge(point2, point1, hlDist);
	}
	else if(point1[2] == m && point2[2] == l && point3[2] == h)
	{
		hmAzimuth = calcBearing(point3, point1);
		hlAzimuth = calcBearing(point3, point2);

		hmDist = calcDistance(point3, point1);
		hlDist = calcDistance(point3, point2);

		hmPlunge = calcPlunge(point3, point1, hmDist);
		hlPlunge = calcPlunge(point3, point2, hlDist);
	}
	else if(point1[2] == l && point2[2] == m && point3[2] == h)
	{
		hmAzimuth = calcBearing(point3, point2);
		hlAzimuth = calcBearing(point3, point1);

		hmDist = calcDistance(point3, point2);
		hlDist = calcDistance(point3, point1);

		hmPlunge = calcPlunge(point3, point2, hmDist);
		hlPlunge = calcPlunge(point3, point1, hlDist);
	}


	//Calculate the strike and dip and store in object results
	var results = calcStrikeDip(hmAzimuth, hlAzimuth, hmPlunge, hlPlunge);

	document.getElementById('strike').innerHTML = 'Strike: <span style="color:#000; font-weight:bold;">' + results.strike +'</span>';
	document.getElementById('dip').innerHTML = 'Dip: <span style="color:#000; font-weight:bold;">' + results.dip +'</span>';
	document.getElementById('quad').innerHTML = 'Quadrant: <span style="color:#000; font-weight:bold;">' + results.quad +'</span>';
	document.getElementById('dip-az').innerHTML = 'Dip-Azimuth: <span style="color:#000; font-weight:bold;">' + results.dipaz +'</span>';



	//Draw the chosen symbol
	drawSymbol(point2, hlDist, results.dip, results.dipaz);
	moveCamera(point2);

}	

////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
//Calculation functions
//Calculate the distance based on two points lat and long
//p1 and p2 are arrays with [0] containing lat and [1] containing long
function calcDistance(p1, p2)
{

	//haversine formula
	var R = 6371 * 1000; // km to m
	var x1 = p1[0].toRadians();
	var x2 = p2[0].toRadians();
	var dx = (p2[0]-p1[0]).toRadians();
	var dy = (p2[1]-p1[1]).toRadians();

	var a = Math.sin(dx/2) * Math.sin(dx/2) +
		Math.cos(x1) * Math.cos(x2) *
		Math.sin(dy/2) * Math.sin(dy/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;


	return d;//distance between 2 points

}


//Calculate the aziumuth between hm and hl
function calcBearing(p1, p2)
{

	var x1 = p1[0].toRadians();
	var y1 = p1[1].toRadians();
	var x2 = p2[0].toRadians();
	var y2 = p2[1].toRadians();

	var y = Math.sin(y2-y1) * Math.cos(x2);
	var x = Math.cos(x1)*Math.sin(x2) -
		Math.sin(x1)*Math.cos(x2)*Math.cos(y2-y1);
	var brng = Math.atan2(y, x).toDegrees();

	return brng; //the azimuth aka bearing


}

//p1 is the high point, p2 is the lower point, dist is always from the lowest
function calcPlunge(p1, p2, dist)
{
	var plunge = Math.atan((p2[2] - p1[2])/dist);
	plunge = plunge.toDegrees();

	return plunge * -1;

}

//Takes in 2 points + plunge and calculate the strike and dip from them
function calcStrikeDip(hmAz, hlAz, hmPl, hlPl)
{
	//Set up the variables for calculation
	var l1Alpha, l1Beta, l1Gamma, l2Alpha, l2Beta, l2Gamma, theta;
	var dAlpha, dBeta, dGamma, hAlpha, hBeta, hGamma;
	var poleAzimuth, polePlunge;
	var strike, dip, quad, dipaz;

	//x,y,z linear 1
	l1Alpha = (Math.sin(hmAz.toRadians()) * Math.sin((90-hmPl).toRadians()));
	l1Beta = (Math.cos(hmAz.toRadians()) * Math.sin((90-hmPl).toRadians()));
	l1Gamma = Math.cos((90-hmPl).toRadians());

	//x,y,z linear 2
	l2Alpha = (Math.sin(hlAz.toRadians()) * Math.sin((90-hlPl).toRadians()));
	l2Beta = (Math.cos(hlAz.toRadians()) * Math.sin((90-hlPl).toRadians()));
	l2Gamma = Math.cos((90-hlPl).toRadians());

	//theta
	theta = Math.acos(l1Alpha * l2Alpha + l1Beta * l2Beta + l1Gamma * l2Gamma);


	//cross product 3d
	if(theta == 0)
	{
		dAlpha = 0;
		dBeta = 0;
		dGamma = 0;
	}
	else{
		dAlpha = ((l1Beta * l2Gamma - l1Gamma * l2Beta) / Math.sin(theta));
		dBeta = ((-1 * (l1Alpha * l2Gamma - l1Gamma * l2Alpha)) / Math.sin(theta));
		dGamma = ((l1Alpha * l2Beta - l1Beta * l2Alpha) / Math.sin(theta));
	}

	//lower hemi
	hAlpha = dAlpha * sign(dGamma);
	hBeta = dBeta * sign(dGamma);
	hGamma = dGamma * sign(dGamma);



	//calc pole azimuth
	if(hAlpha == 0 && hBeta == 0)
	{
		poleAzimuth = 0;
	}
	if(hAlpha < 0 && hBeta >= 0)
	{
		poleAzimuth = (450 - (Math.atan2(hBeta, hAlpha)).toDegrees());
	}
	else
	{
		poleAzimuth = (90 - (Math.atan2(hBeta, hAlpha)).toDegrees());

	}



	//calc pole plunge
	polePlunge = 90 - Math.acos(hGamma).toDegrees();



	//calc strike
	if(poleAzimuth >= 0 && poleAzimuth <= 90)
	{
		strike = 270 + poleAzimuth;	
	}
	else if(poleAzimuth > 90 && poleAzimuth <= 180)
	{
		strike = poleAzimuth - 90;
	}
	else if(poleAzimuth > 180 && poleAzimuth <= 270)
	{
		strike = poleAzimuth + 90;
	}
	else if(poleAzimuth > 270 && poleAzimuth <= 360)
	{
		strike = poleAzimuth - 270;	
	}
	else strike = "ERROR";



	//calc dip
	dip = 90 - polePlunge;



	//calc quad
	if(poleAzimuth >= 0 && poleAzimuth <= 90)
	{
		quad = "W";	
	}
	else if(poleAzimuth > 90 && poleAzimuth <=180)
	{
		quad = "W";
	}
	else if(poleAzimuth > 180 && poleAzimuth <= 270)
	{
		quad = "E";
	}
	else if(poleAzimuth > 270 && poleAzimuth <= 360)
	{
		quad = "E";
	}
	else quad = "ERROR";

	//calc dip azimuth
	if(poleAzimuth < 180)
	{
		dipaz = poleAzimuth + 180;
	}
	else dipaz = poleAzimuth - 180;

	var strikeDipQuad = {
		strike:  strike,
		dip: dip,
		quad: quad,
		dipaz: dipaz
	};

	return strikeDipQuad;

}


////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
//jQuery and interface functions
//Dropdown selector for the geologic symbol.
$( "#sel" ).change(function() {

	var option = ($( "#sel option:selected" ).text()); 

	//console.log(option);
	if(option.indexOf("(3D)") > -1)
	{
		var sym = document.getElementById('symbols');
		var displaySetting = sym.style.display;
		sym.style.display = 'block';
	}
	else
	{

		var sym2 = document.getElementById('symbols');
		var displaySetting = sym2.style.display;
		sym2.style.display = 'none';
	}
});

//import from url button click
$('#importURL').click(function() {

	importURL($('#urlkmz').val());
	return false;
});

//fly to on click and enter
$('#fly').click(function() {

	geocode($('#geocode').val());
	return false;
});

//geocode click on enter
$('#geocode').keypress(function (e) {
	if (e.which == 13) {
		geocode($('#geocode').val());
	}
});

//Export button click
$('#export').click(function() {


	var kmlString = exportFeatures();

	var textFile = null,
		makeTextFile = function (text) {
			var data = new Blob([text], {type: 'text/kml'});

			// If we are replacing a previously generated file we need to
			// manually revoke the object URL to avoid memory leaks.
			if (textFile !== null) {
				window.URL.revokeObjectURL(textFile);
			}

			textFile = window.URL.createObjectURL(data);

			return textFile;
		};


	this.href = makeTextFile(kmlString);

});

//Export button click
$('#exportCSV').click(function() {


	var csvString = exportCSV();

	var textFile = null,
		makeTextFile = function (text) {
			var data = new Blob([text], {type: 'text,csv'});

			// If we are replacing a previously generated file we need to
			// manually revoke the object URL to avoid memory leaks.
			if (textFile !== null) {
				window.URL.revokeObjectURL(textFile);
			}

			textFile = window.URL.createObjectURL(data);

			return textFile;
		};


	this.href = makeTextFile(csvString);

});



//import kml files by clicking the import button
$(function(){
	$("#import").on('click', function(e){
		e.preventDefault();
		$("#upload:hidden").trigger('click');
	});
});

//autoplot is actually the manual plot button click
$('#autoplot').click(function(e) {

	e.preventDefault();
	manualPlot($('#lat1').val(), $('#lon1').val(), $('#alt1').val(), $('#lat2').val(), $('#lon2').val(), $('#alt2').val(), $('#lat3').val(), $('#lon3').val(), $('#alt3').val());

});

//deletes all data on the GE instance
$('#delete').click(function(e) {

	e.preventDefault();
	csvArray = [];
	clickCount = 0;
	point1 = [];
	point2 = [];
	point3 = [];
	document.getElementById('strike').innerHTML = 'Strike: ';
	document.getElementById('dip').innerHTML = 'Dip: ';
	document.getElementById('quad').innerHTML = 'Quadrant: ';
	document.getElementById('dip-az').innerHTML = 'Dip-Azimuth: ';

	//Clear Earth of all points, reset the point outputs
	var features = ge.getFeatures();
	while (features.getFirstChild())
		features.removeChild(features.getFirstChild());

	//remove items from the model folder
	var featuresModel = modelFolder.getFeatures();
	while (featuresModel.getFirstChild())
		featuresModel.removeChild(featuresModel.getFirstChild());

	//remove items from the points folder
	var featuresPlaces = placemarkFolder.getFeatures();
	while (featuresPlaces.getFirstChild())
		featuresPlaces.removeChild(featuresPlaces.getFirstChild());





});

//undo last point, only works on the problem you are trying to solve, not on the previous
$('#undo').click(function(e) {
	e.preventDefault();
	var featuresPlaces = placemarkFolder.getFeatures();
	var featuresModel = modelFolder.getFeatures();

	if(clickCount > 0)
	{
		if(clickCount == 1)
		{
			point1.length = 0;
			featuresPlaces.removeChild(featuresPlaces.getLastChild());
		}
		if(clickCount == 2)
		{
			point2.length = 0;
			featuresPlaces.removeChild(featuresPlaces.getLastChild());

		}
		if(clickCount == 3)
		{
			point3.length = 0;
			featuresPlaces.removeChild(featuresPlaces.getLastChild());
			featuresPlaces.removeChild(featuresPlaces.getLastChild());
			featuresModel.removeChild(featuresModel.getLastChild());
			csvArray.pop();
		}
		clickCount--;

	}


});

//toggle historical imagery
$('#hist').click(function(e) {
	e.preventDefault();
	if(ge.getTime().getHistoricalImageryEnabled() == true)
	{
		ge.getTime().setHistoricalImageryEnabled(false);

	}
	else ge.getTime().setHistoricalImageryEnabled(true);


});

//toggle borders/places
$('#bord').click(function(e) {
	e.preventDefault();
	if(bordersEnabled == true)
	{
		ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, false);
		bordersEnabled = false;
	}
	else
	{
		ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
		bordersEnabled = true;
	}



});

//Handles file "uploads" for importing KML.  Imagery must be web accessible.
window.onload = function() {
	var fileInput = document.getElementById('upload');
	//var fileDisplayArea = document.getElementById('strike');

	fileInput.addEventListener('change', function(e) {
		var file = fileInput.files[0];
		var textType = /\.kml/i;

		if (file.type.match(textType)) {
			var reader = new FileReader();
			reader.readAsBinaryString(file);		
			reader.onload = function(e) {
				importKML(reader.result);
				$('#upload').val('')
			}


		} else {
			alert("File not supported!");
		}
	});
}

//Import KMZ from a specified url
function importURL(url)
{
	var link = ge.createLink('');
	var href = url;
	link.setHref(href);

	var networkLink = ge.createNetworkLink('');
	networkLink.set(link, true, true); // Sets the link, refreshVisibility, and flyToView

	ge.getFeatures().appendChild(networkLink);	
}

function importKML(input)
{
	//console.log(input);

	var kml = ge.parseKml(input);
	ge.getFeatures().appendChild(kml);

	if (kml.getAbstractView())
		ge.getView().setAbstractView(kml.getAbstractView());


}

//Stretch the globe div to the sidebar div(page height)
$(document).ready(function() {

	setHeight($('#map3d'), $('#sidebar'));

	window.onresize = function(event) {
		setHeight($('#map3d'), $('#sidebar'));


	};

});

// sets height of element 1 to equal the height of element 2
function setHeight(elem1, elem2) {
	var height = elem2.height()
	elem1.css('height', height); 
}

//full screen toggle
function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {  
      document.documentElement.requestFullScreen();  
    } else if (document.documentElement.mozRequestFullScreen) {  
      document.documentElement.mozRequestFullScreen();  
    } else if (document.documentElement.webkitRequestFullScreen) {  
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
    }  
  } else {  
    if (document.cancelFullScreen) {  
      document.cancelFullScreen();  
    } else if (document.mozCancelFullScreen) {  
      document.mozCancelFullScreen();  
    } else if (document.webkitCancelFullScreen) {  
      document.webkitCancelFullScreen();  
    }  
  }  
}


////////////////////////////////////////////////////////////////////////////////////////




//Start the plugin
load();
google.setOnLoadCallback(init);

