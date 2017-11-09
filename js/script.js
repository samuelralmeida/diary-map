var googleKey = config.GOOGLE_KEY;
var map;
//control sidebar is enable or not
var sidebar;

// model of wishes
var Wish = function(data) {

};

// model of achievements
var Achievement = function(data) {

};

var Marker = function(data) {
  this.title = ko.observable(data.title);
  this.position = ko.observable(data.position);
  this.id = ko.observable(data.id);
}

var ViewModel = function() {
  var self = this;

  // Create a new blank array for all the listing markers.
  var markers = [];

  // Create placemarkers array to use in multiple functions to have control
  // over the number of places that show.
  var placeMarkers = [];

  //CONTROL SIDEBA MENU
  this.searches = ko.observable(false)
  this.saves = ko.observable(false)
  var sidebar = null;
  $("#menu-toggle1").click(function(e) {
    if (sidebar === 'searches') {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = null
    } else if (sidebar === null) {
      self.saves(false);
      self.searches(true);
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = 'searches'
    } else if (sidebar === 'saves') {
      self.saves(false);
      self.searches(true);
      sidebar = 'searches'
    }
  });

  $("#menu-toggle2").click(function(e) {
    if (sidebar === 'saves') {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = null
    } else if (sidebar === null) {
      self.saves(true);
      self.searches(false);
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = 'saves'
    } else if (sidebar === 'searches') {
      self.saves(true);
      self.searches(false);
      sidebar = 'saves'
    }
  });

  //SEARCH SYSTEM

  // Create a searchbox in order to execute a places search
  var searchBox = new google.maps.places.SearchBox(
    document.getElementById('places-search'));
  // Bias the searchbox to within the bounds of the map.
  searchBox.setBounds(map.getBounds());
  // Listen for the event fired when the user selects a prediction from the
  // picklist and retrieve more details for that place.
  searchBox.addListener('places_changed', function() {
    searchBoxPlaces(this);
  });
  // Listen for the event fired when the user selects a prediction and clicks
  // "go" more details for that place.
  document.getElementById('go-places').addEventListener(
    'click', textSearchPlaces);

  // This function fires when the user selects a searchbox picklist item.
  // It will do a nearby search using the selected query string or place.
  function searchBoxPlaces(searchBox) {
    self.currentMarker(null)
    var places = searchBox.getPlaces();
    // For each place, get the icon, name and location.
    createMarkersForPlaces(places);
    if (places.length == 0) {
      window.alert('We did not find any places matching that search!');
    }
  }

  // This function firest when the user select "go" on the places search.
  // It will do a nearby search using the entered query string or place.
  function textSearchPlaces() {
    self.currentMarker(null)
    var bounds = map.getBounds();
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
      query: document.getElementById('places-search').value,
      bounds: bounds
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarkersForPlaces(results);
      }
    });
  }

  //CREATE MARKERS AND THEM DETAILS
  this.currentMarker = ko.observable();
  function createMarkersForPlaces(places) {
    var placesSearched = []
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
      var place = places[i];

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });
      // Create a single infowindow to be used with the place details information
      // so that only one is open at once.
      var placeInfoWindow = new google.maps.InfoWindow();
      // If a marker is clicked, do a place details search on it in the next function.
      marker.addListener('click', function() {
        if (placeInfoWindow.marker == this) {
          console.log("This infowindow already is on this marker!");
        } else {
          getPlacesDetails(this, placeInfoWindow);
          self.currentMarker(this);
          wikiSearch(this);
        }
      });
      //placeMarkers.push(marker);
      placesSearched.push(marker);
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    }
    map.fitBounds(bounds);
    listResult(placesSearched);
  }

  // This is the PLACE DETAILS search - it's the most detailed so it's only
  // executed when a marker is selected, indicating the user wants more
  // details about that place.
  function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: marker.id
    }, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Set the marker property on this infowindow so it isn't created again.
        infowindow.marker = marker;
        var innerHTML = '<div>';
        if (place.name) {
          innerHTML += '<strong>' + place.name + '</strong>';
        }
        if (place.formatted_address) {
          innerHTML += '<br>' + place.formatted_address;
        }
        if (place.formatted_phone_number) {
          innerHTML += '<br>' + place.formatted_phone_number;
        }
        if (place.opening_hours) {
          innerHTML += '<br><br><strong>Hours:</strong><br>' +
              place.opening_hours.weekday_text[0] + '<br>' +
              place.opening_hours.weekday_text[1] + '<br>' +
              place.opening_hours.weekday_text[2] + '<br>' +
              place.opening_hours.weekday_text[3] + '<br>' +
              place.opening_hours.weekday_text[4] + '<br>' +
              place.opening_hours.weekday_text[5] + '<br>' +
              place.opening_hours.weekday_text[6];
        }
        if (place.photos) {
          innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
              {maxHeight: 100, maxWidth: 200}) + '">';
        }
        innerHTML += '</div>';
        infowindow.setContent(innerHTML);
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
        });
      }
    });
  }

  // list all result by search to user find a place easly
  this.markersList = ko.observableArray([]);
  function listResult(placesSearched) {
    self.markersList([]);
    placesSearched.forEach(function(place){
      self.markersList.push(place)
    })
  }

  // change cuurent marker view
  this.setMarker = function(clickedMarker) {
      self.currentMarker(clickedMarker)
      wikiSearch(clickedMarker);
  };

  // use wikipedia API to show articles about place
  this.wikiMsg = ko.observable();
  this.wikiLinks = ko.observableArray([]);
  function wikiSearch(marker) {
    var wikiUrl = "https://en.wikipedia.org/w/api.php?action=opensearch&search="
      + marker.title + "&format=json&callback=wikiCallback";

    var wikiRequestTimeout = setTimeout(function(){
        self.wikiMsg("failed to get wikipedia resources");
    }, 8000);

    self.wikiLinks([]);
    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        success: function(response) {
            var articleList = response[1];
            if (articleList.length === 0) {
              self.wikiMsg("not wikipedia articles was found");
            } else {
                for (var i = 0; i < 2; i++) {
                    var articleStr = articleList[i];
                    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                    self.wikiMsg("Wikipedia Links");
                    self.wikiLinks.push({'title': articleStr, 'url': url})
                };
            }

            //se a requisição tiver sucesso, limpa o que foi feito pela função wikiRequestTimeout
            clearTimeout(wikiRequestTimeout);
        }
    })
  }

};
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -19.925382, lng: -43.942943},
        zoom: 4
    });


    ko.applyBindings(new ViewModel());
}

window.addEventListener('load',function(){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = "https://maps.googleapis.com/maps/api/js?key="+googleKey+"&libraries=geometry,places&callback=initMap";
    script.setAttribute('defer','');
    script.setAttribute('async','');
    document.body.appendChild(script);
});
