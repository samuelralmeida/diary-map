var googleKey = config.GOOGLE_KEY;
var map;
// model of wishes
var Wish = function(data) {
    this.wishName = ko.observable(data.wishName);
    this.date = ko.observable(data.date);
    this.cost = ko.observable(data.cost);
    this.notes = ko.observable(data.notes);
    this.place = ko.observable(data.place);
    this.position = ko.observable(data.position);
};

// model of achievements
var Achievement = function(data) {

};

var ChosenPlace = function(data) {
    this.title = ko.observable(data.title);
    this.position = ko.observable(data.position);
}

var ViewModel = function() {
    var self = this;
    // marker is result of google maps api search
    var marker;
    // mark is a object that created from marker using knockoutJS
    var mark;

    this.wishOrRealized = ko.observable();
    self.inputWish = ko.observable(false);
    self.inputAnchievement = ko.observable(false);
    self.outcome = ko.observable(false);
    self.result = ko.observable();
    self.step0 = ko.observable(false);
    self.title = ko.observable();
    self.currentPlace = ko.observable();
    self.wishOrRealized = ko.observable();
    this.wikipediaLinks = ko.observableArray([]);
    self.wikiError = ko.observable();

    function resetLayout() {
        document.getElementById("radio").checked = false;
        self.step0(false);
        self.inputAnchievement(false);
        self.inputWish(false);
    }

    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map.
    searchBox.setBounds(map.getBounds());
    searchBox.addListener('places_changed', function() {searchBoxPlaces(this);});
    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    document.getElementById('go-places').addEventListener('click', textSearchPlaces);
    // This function fires when the user selects a searchbox picklist item.
    // It will do a nearby search using the selected query string or place.
    function searchBoxPlaces(searchBox) {
        // return layout as initial
        self.outcome(false);
        self.result();
        resetLayout();

        var places = searchBox.getPlaces();
        if (places.length == 0) {
            window.alert('We did not find any places matching that search!');
        } else {
            // For each place, get the icon, name and location.
            createMarkersForPlaces(places);
        }
    }
    // This function firest when the user select "go" on the places search.
    // It will do a nearby search using the entered query string or place.
    function textSearchPlaces() {
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

    function createMarkersForPlaces(places) {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < places.length; i++) {
            var place = places[i];
            var icon = {
                url: place.icon,
                size: new google.maps.Size(35, 35),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(15, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            // Create a marker for each place.
            marker = new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP,
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
                  checkMarker(this);
                }
            });
            //placeMarkers.push(marker);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
              } else {
                bounds.extend(place.geometry.location);
              }
      }
      map.setZoom(10);
      map.fitBounds(bounds);
    }

    function getPlacesDetails(marker, infowindow) {
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({placeId: marker.id}, function(place, status) {
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

    function checkMarker(marker) {
        mark = new ChosenPlace(marker);
        self.title(mark.title());
        self.step0(true);
        //this.scrollView('step');
    }

    this.wishOrRealized.subscribe(function(value){
        if (value === 'wish') {
            this.inputAnchievement(false);
            this.inputWish(true);
            this.searchUrl()
        } else if (value === 'realized'){
            this.inputAnchievement(true);
            this.inputWish(false);
        } else {
            this.inputAnchievement(false);
            this.inputWish(false);
        }
    }, this);

    this.scrollView = function(step) {
        document.getElementById(step).scrollIntoView();
    }

    this.searchUrl = function(){
        var wikiUrl =  "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + mark.title() + "&format=json&callback=wikiCallback";

        var wikiRequestTimeout = setTimeout(function(){
            self.wikiError("failed to get wikipedia resources");
        }, 8000);

        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            success: function(response) {
                var articleList = response[1];
                self.wikipediaLinks([]);
                if (articleList.length === 0) {
                    self.wikiError("not wikipedia articles was found");
                } else {
                    for (var i = 0; i < 2; i++) {
                        var articleStr = articleList[i];
                        var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                        self.wikipediaLinks.push({'title': articleStr, 'url': url})
                    };
                }

                //se a requisição tiver sucesso, limpa o que foi feito pela função wikiRequestTimeout
                clearTimeout(wikiRequestTimeout);
            }
        })
    }

    // varibles to wish input form
    self.wishName = ko.observable();
    self.date = ko.observable();
    self.cost = ko.observable();
    self.notes = ko.observable();
    // function to save and reset form
    this.saveWish = function(formElement) {
        var data = {
            wishName: self.wishName(),
            date: self.date(),
            cost: self.cost(),
            notes: self.notes(),
            place: mark.title(),
            position: mark.position()
        }
        var wish = new Wish(data);
        var jsonData = ko.toJSON(wish)

        var existingEntries = JSON.parse(localStorage.getItem("allWishes"));
        if(existingEntries == null) existingEntries = [];
        localStorage.setItem(self.wishName(), jsonData);
        existingEntries.push(jsonData);
        localStorage.setItem("allWishes", JSON.stringify(existingEntries));

        console.log(localStorage.getItem("allWishes"));
            // Last entry inserted
        console.log(localStorage.getItem(self.wishName()));

        reset();

        function reset() {
            self.wishName(null);
            self.date(null);
            self.cost(null);
            self.notes(null);
            self.result('Your dream has been saved. Make it happen!')
            self.outcome(true);
            resetLayout();
        }

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

$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});
