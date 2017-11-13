// global variables
var nytKey = config.NYT_KEY;
var clientID = config.CLIENT_ID;
var clientSecret = config.CLIENT_SECRET;
var map;
var markersList = [];

// default locations
var locations = [
  {
    type: 'achievement',
    date: "2018-12-15",
    notes: "The most beautiful church, it is seem a florest.",
    lat: 41.40392219999999,
    lng: 2.175873000000024,
    title: "Sagrada Família"
  },
  {
    type: 'achievement',
    date: "2014-01-07",
    notes: "Calm and piradise beach wish blue water",
    lat: -16.8963919,
    lng: -39.11149610000001,
    title: "Ponta do Corumbau"
  },
  {
    type: 'achievement',
    date: "2012-11-16",
    notes:"One of the milestones of science",
    lat: 51.50594799999999,
    lng: -0.1323539999999639,
    title: "The Royal Society"
  },
  {
    type: 'wish',
    date: "2017-11-15",
    notes: "Visit Iguazu falls and meet the Itaipu hydroelectric",
    lat: -25.5163356,
    lng: -54.58537639999997,
    title: "Foz do Iguaçu"
  },
  {
    type: 'wish',
    date: "2018-12-15",
    notes: "Climb up the ruins walking",
    lat: -13.1631412,
    lng: -72.54496289999997,
    title: "Machu Picchu"},
]

var Location = function(data) {
  var self = this;
  this.type = data.type;
  this.title = data.title;
  this.lat = data.lat;
  this.lng = data.lng;
  this.date = data.date;
  this.notes = data.url;
  this.url = "";
  this.city = "";
  this.street = "";

  this.visible = ko.observable(true);

  // call foursquere api
  var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

  $.getJSON(foursquareURL).done(function(data) {
    var results = data.response.venues[0];
    self.url = results.url;
    if (typeof self.url === 'undefined'){
			self.url = "";
		}
    self.street = results.location.formattedAddress[0];
    self.city = results.location.formattedAddress[1];
  }).fail(function() {
    alert("Occur an error in Foursquare API call. Refresh page")
  });

  // crate infowindow content
  this.contentString = '<div class="info-window-content"><div class="title"><b>' + data.title + "</b></div>" +
    '<br><div class="content"><span class="info">Type: </span><span>' + data.type + '</span></div>' +
    '<div class="content"><span class="info">Date: </span><span>' + data.date + '</span></div>' +
    '<div class="content"><span class="info">notes: </span><span>' + data.notes + '</span></div>' +
    '<br><div class="content sub-title">FOURSQUARE INFOS</div>' +
    '<div class="content"><a href="' + self.url +'">' + self.url + "</a></div>" +
    '<div class="content">' + self.street + "</div>" +
    '<div class="content">' + self.city + "</div></div>";

  this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

  //create diferent icon to marker
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor + '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34)
    );
    return markerImage;
  }

  //create marker for location
  if(data.type === "achievement") {
    var icon = makeMarkerIcon('FFFF24');
  } else if (data.type === "wish") {
    var icon = makeMarkerIcon('0091ff');
  }

	this.marker = new google.maps.Marker({
    position: new google.maps.LatLng(data.lat, data.lng),
		map: map,
		title: data.title,
    icon: icon
	});

  this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

  this.marker.addListener('click', function(){
    self.contentString = '<div class="info-window-content"><div class="title"><b>' + data.title + "</b></div>" +
      '<br><div class="content"><span class="info">Type: </span><span>' + data.type + '</span></div>' +
      '<div class="content"><span class="info">Date: </span><span>' + data.date + '</span></div>' +
      '<div class="content"><span class="info">Notes: </span><span>' + data.notes + '</span></div>' +
      '<br><div class="content sub-title">FOURSQUARE INFOS</div>' +
      '<div class="content"><a href="' + self.url +'">' + self.url + "</a></div>" +
      '<div class="content">' + self.street + "</div>" +
      '<div class="content">' + self.city + "</div></div>";

    self.infoWindow.setContent(self.contentString);

    self.infoWindow.open(map, this);

    self.marker.setAnimation(google.maps.Animation.BOUNCE);

    setTimeout(function() {
      self.marker.setAnimation(null);
    }, 2100);
  });

  markersList.push(this.marker);

  this.bounce = function(place) {
    google.maps.event.trigger(self.marker, 'click');

    self
  };

};

function ViewModel () {
  var self = this;

  this.searchTerm = ko.observable("");
	this.locationList = ko.observableArray([]);

  map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -19.925382, lng: -43.942943},
      zoom: 4
  });

  locations.forEach(function(local){
    self.locationList.push(new Location(local));
  });

  this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
      self.locationList().forEach(function(local){
        local.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(local) {
				var string = local.title.toLowerCase();
				var result = (string.search(filter) >= 0);
				local.visible(result);
				return result;
			});
		}
	}, self);


  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markersList.length; i++) {
      bounds.extend(markersList[i].position);
  }
  map.fitBounds(bounds);

}

function initMap() {
	ko.applyBindings(new ViewModel());
}

function errorHandling() {
	alert("Google Maps has failed to load. Try again.");
}
