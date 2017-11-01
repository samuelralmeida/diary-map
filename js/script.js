var googleKey = config.GOOGLE_KEY;

// Função para carregamento assíncrono
window.addEventListener('load',function(){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key='+googleKey+'&v=3&callback=initMap';
    document.body.appendChild(script);
});

var map;
// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarker = [];
// função para carregar o mapa
// função chamada pelo script abaixo para carregar api
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    // criar uma instancia de novo mapa
    // define pela id onde vai aparecer no html
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -19.925382, lng: -43.942943},
        zoom: 15
    });

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
        //**
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            window.alert('We did not find any places matching that search!');
        } else {
            // For each place, get the icon, name and location.
            //**
            createMarkersForPlaces(places);
            //console.log('places', places)
        }
    }
    // This function firest when the user select "go" on the places search.
    // It will do a nearby search using the entered query string or place.
    function textSearchPlaces() {
        //**
        var bounds = map.getBounds();
        var placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: document.getElementById('places-search').value,
            bounds: bounds
        }, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                //**
                createMarkersForPlaces(results);
                //console.log('results', results)
            }
        });
    }
    // This function creates markers for each place found in either places search.
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
                }
            });
            placeMarker = [];
            placeMarker.push(marker);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        console.log(placeMarker)
        map.fitBounds(bounds);
    }
}

var Wish = function(data) {

}

var ViewModel = function() {
    var self = this;
    this.wishOrRealized = ko.observable();
    this.showWish = ko.observable(false);
    this.showDream = ko.observable(false);

    this.wishOrRealized.subscribe(function(newValue){
        this.showForm(newValue);
    }, this);

    this.showForm = function(value) {
        if (value === 'wish') {
            this.showWish(true);
            this.showDream(false);
        } else if (value === 'realized'){
            this.showDream(true);
            this.showWish(false);
        } else {
            this.showDream(false);
            this.showWish(false);
        }
    }
}

ko.applyBindings(new ViewModel)
