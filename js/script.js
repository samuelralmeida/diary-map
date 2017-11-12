var googleKey = config.GOOGLE_KEY;
var nytKey = config.NYT_KEY;
var map;
//control sidebar is enable or not
var sidebar;

// model of wishes
var Wish = function(mark) {
    if (!localStorage.wishes) {
        localStorage.wishes = JSON.stringify([]);
    }
    var data = JSON.parse(localStorage.wishes);
    data.push(mark);
    localStorage.wishes = JSON.stringify(data);
};

var getWishes = function() {
    if (localStorage.wishes) {
      return JSON.parse(localStorage.wishes);
    } else {
      return 'error';
    }
};

// model of dreams
var Dream = function(mark) {
    if (!localStorage.dreams) {
        localStorage.dreams = JSON.stringify([]);
    }
    var data = JSON.parse(localStorage.dreams);
    data.push(mark);
    localStorage.dreams = JSON.stringify(data);
};

var getDreams = function() {
    if (localStorage.dreams) {
      return JSON.parse(localStorage.dreams);
    } else {
      return 'error';
    }
};

var Marker = function(data) {
  this.title = ko.observable(data.title);
  this.position = ko.observable(data.position);
  this.id = ko.observable(data.id);
};

var ViewModel = function() {
    var self = this;

    // Create a new blank array for all the listing markers.
    var markers = [];

    // Create placemarkers array to use in multiple functions to have control
    // over the number of places that show.
    var placeMarkers = [];

    // locations to load with page
    var locations_wish = [
        {cost: '2000.00', date: "2017-11-15", id: "ChIJQwpTruuQ9pQRUqnEtHOUlyE", notes:"Visit Iguazu falls and meet the Itaipu hydroelectric", position:{lat: -25.5163356, lng: -54.58537639999997}, title: "Foz do Iguaçu"},
        {cost: '3500.00', date: "2018-12-15", id: "ChIJVVVViV-abZERJxqgpA43EDo", notes:"Climb up the ruins walking", position:{lat: -13.1631412, lng: -72.54496289999997}, title: "Machu Picchu"},
    ];
    var locations_dream = [
        {date: "2018-12-15", id: "ChIJje3e6NyipBIRPyri72JDJWc", notes:"The most beautiful church, it is seem a florest.", position:{lat: 41.40392219999999, lng: 2.175873000000024}, title: "Sagrada Família"},
        {date: "2014-01-07", id: "ChIJ8zFJXdU7NAcRo0WLkaO1EP4", notes:"Calm and piradise beach wish blue water", position:{lat: -16.8963919, lng: -39.11149610000001}, title: "Ponta do Corumbau"},
        {date: "2012-11-16", id: "ChIJV5Oc89AEdkgRYIIjBVjTCCc", notes:"One of the milestones of science", position:{lat: 51.50594799999999, lng: -0.1323539999999639}, title: "The Royal Society"}
    ];
    function create_markers(){

        var markersLoad = []
        if (getWishes() === 'error' || getDreams() === 'error') {
            var markersLoad = []
            for (var i = 0; i < locations_wish.length; i++ ) {
                var local = locations_wish[i];
                var wishIcon = makeMarkerIcon('0091ff');
                var mark = {
                    title: local.title,
                    position: local.position,
                    icon: wishIcon,
                    id: local.id,
                    date: local.date,
                    cost: local.cost,
                    notes: local.notes
                };
                Wish(mark);
                markersLoad.push(mark)
            }

            for (var j = 0; j < locations_dream.length; j++) {
                var local = locations_dream[j];
                var dreamIcon = makeMarkerIcon('FFFF24');
                var mark = {
                    title: local.title,
                    position: local.position,
                    icon: dreamIcon,
                    id: local.id,
                    date: local.date,
                    notes: local.notes
                };
                Dream(mark);
                markersLoad.push(mark)
            };
        }
    }

    // control feedback to user
    this.result = ko.observable(false);
    this.flash = ko.observable();

    //CONTROL SIDEBA MENU
    this.searches = ko.observable(false);
    this.wishes = ko.observable(false);
    this.dreams = ko.observable(false);
    var sidebar = null;
    $("#menu-toggle1").click(function(e) {
    if (sidebar === 'searches') {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = null;
    } else if (sidebar === null) {
      self.wishes(false);
      self.dreams(false);
      self.searches(true);
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = 'searches';
    } else if (sidebar === 'wishes' || sidebar === 'dreams') {
      self.wishes(false);
      self.dreams(false);
      self.searches(true);
      sidebar = 'searches';
    }
    });

    $("#menu-toggle2").click(function(e) {
    if (sidebar === 'wishes') {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = null;
    } else if (sidebar === null) {
      self.searches(false);
      self.dreams(false);
      self.wishes(true);
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = 'wishes';
    } else if (sidebar === 'searches' || sidebar === 'dreams') {
      self.searches(false);
      self.dreams(false);
      self.wishes(true);
      sidebar = 'wishes';
    }
    });

    $("#menu-toggle3").click(function(e) {
    if (sidebar === 'dreams') {
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = null;
    } else if (sidebar === null) {
      self.wishes(false);
      self.searches(false);
      self.dreams(true);
      e.preventDefault();
      $("#wrapper").toggleClass("toggled");
      sidebar = 'dreams';
    } else if (sidebar === 'searches' || sidebar === 'wishes') {
      self.wishes(false);
      self.searches(false);
      self.dreams(true);
      sidebar = 'dreams';
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
        resetLayout();
        var places = searchBox.getPlaces();
        // For each place, get the icon, name and location.
        createMarkersForPlaces(places);
        if (places.length === 0) {
            window.alert('We did not find any places matching that search!');
        }
    }

    // This function firest when the user select "go" on the places search.
    // It will do a nearby search using the entered query string or place.
    function textSearchPlaces() {
        resetLayout();
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

    //RESET TO INITIAL KO FUNCTIONS CONDITIONS
    function resetLayout() {
        if (self.currentMarker()) {
            self.currentMarker().setMap(null);
        }
        self.currentMarker(null);
        self.wikiMsg(null);
        self.wikiLinks(null);
        self.nytMsg(null);
        self.nytLinks(null);
        self.result(false);
        self.flash(null);
        self.currentWish(null);
        self.currentDream(null);
        if (self.wishOrDream()) {
          self.wishOrDream(null);
        }
        self.displayWish(null);
        self.displayDream(null);
        self.searchFlash(true);
        self.markersList([]);
    }


    //CREATE MARKERS AND THEM DETAILS
    this.searchFlash = ko.observable(true);
    this.currentMarker = ko.observable();
    function createMarkersForPlaces(places) {
        self.searchFlash(false);
        var placesSearched = [];
        var bounds = new google.maps.LatLngBounds();

        function markerListener(marker, placeInfoWindow){
            if (placeInfoWindow.marker == marker) {
                console.log("This infowindow already is on this marker!");
            } else {
                getPlacesDetails(marker, placeInfoWindow);
                self.currentMarker(marker);
                wikiSearch(marker);
                nytSearch(marker);
            }
        }
        // Create a marker for each place.
        for (var i = 0; i < places.length; i++) {
            var place = places[i];
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
            marker.addListener('click', markerListener(marker, placeInfoWindow));

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
            self.markersList.push(place);
        });
    }

    // change cuurent marker view
    this.setMarker = function(clickedMarker) {
        resetLayout();
        self.currentMarker(clickedMarker);
        self.currentMarker().setMap(map);
        map.setCenter(self.currentMarker().position);
        map.setZoom(15);
        wikiSearch(clickedMarker);
        nytSearch(clickedMarker);
    };

    // use wikipedia API to show articles about place
    this.wikiMsg = ko.observable();
    this.wikiLinks = ko.observableArray([]);
    function wikiSearch(marker) {
        var wikiUrl = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + marker.title + "&format=json&callback=wikiCallback";

        var wikiRequestTimeout = setTimeout(function(){
            self.wikiMsg("Failed to get Wikipedia resources");
        }, 8000);

        self.wikiLinks([]);
        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            success: function(response) {
                var articleList = response[1];
                if (articleList.length === 0) {
                    self.wikiMsg("Not wikipedia articles was found");
                } else {
                    for (var i = 0; i < articleList.length; i++) {
                        var articleStr = articleList[i];
                        var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                        self.wikiMsg("Wikipedia Links");
                        self.wikiLinks.push({
                            'title': articleStr,
                            'url': url
                        });
                        if (i === 4) {
                            break;
                        }
                    }
                }
                //se a requisição tiver sucesso, limpa o que foi feito pela função wikiRequestTimeout
                clearTimeout(wikiRequestTimeout);
            }
        });
    }

    this.nytMsg = ko.observable();
    this.nytLinks = ko.observableArray([]);
    function nytSearch(marker) {
        var nytUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + marker.title + '&sort=newest&api-key=' + nytKey;

        self.nytLinks([]);
        $.getJSON(nytUrl, function(data) {

            var articles = data.response.docs;
            if (articles.length === 0) {
                self.nytMsg("Not New York Times articles was found");
            } else {
                for (var i = 0; i < articles.length; i++) {
                    var article = articles[i];
                    self.nytMsg("New York Times Links");
                    self.nytLinks.push({
                        'title': article.headline.main,
                        'url': article.web_url,
                        'snippet': article.snippet
                    });
                    if (i === 4) {
                        break;
                    }
                }
            }
        }).fail(function(e){
            self.nytMsg("Failed to get New York Times resources");
        });
    }

    //create diferent icon to marker
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21,34)
        );
        return markerImage;
    }

    //FORM VARIABLES
    this.date = ko.observable();
    this.cost = ko.observable();
    this.notes = ko.observable();

    // SAVE WISH
    var placesWishes = [];
    this.saveWish = function() {
        var wishMarker;
        var wishIcon = makeMarkerIcon('0091ff');
        wishMarker = self.currentMarker();
        wishMarker.setIcon(wishIcon);

        var mark = {
            title: wishMarker.title,
            position: wishMarker.position,
            icon: wishMarker.icon,
            id: wishMarker.id,
            date: self.date(),
            cost: self.cost(),
            notes: self.notes()
        };

        Wish(mark);
        // reset array to load new infos to localStorage
        placesWishes = [];
        resetLayout();
        self.date(null);
        self.cost(null);
        self.notes(null);
        self.flash('Your wish has been saved');
        self.result(true);
    };

    // SAVE DREAM
    var placesDreams = [];
    this.saveDream = function(marker) {
        var dreamMarker;
        var dreamIcon = makeMarkerIcon('FFFF24');
        dreamMarker = self.currentMarker();
        dreamMarker.setIcon(dreamIcon);

        var mark = {
            title: dreamMarker.title,
            position: dreamMarker.position,
            icon: dreamMarker.icon,
            id: dreamMarker.id,
            date: self.date(),
            notes: self.notes()
        };

        Dream(mark);
        // reset array to load new infos to localStorage
        placesDreams = [];
        resetLayout();
        self.date(null);
        self.notes(null);
        self.flash('Your dream has been saved');
        self.result(true);
        self.searchFlash(true);
    };


    //RECUE WISH
    this.wishFlash = ko.observable(true);
    this.currentWish = ko.observable();
    this.wishList = ko.observableArray([]);
    this.showWishes = function() {
        if (placesWishes.length > 0) {
            showListings('wishes', placesWishes);
        } else {
            allWishes = getWishes();

            //set configs to wish marker
            function wishListener() {
                resetLayout();
                self.currentWish(this);
                self.currentWish().setMap(map);
            }
            function wishListenerDblClick() {
                resetLayout();
                self.currentWish(this);
                self.currentWish().setMap(map);
                map.setCenter(self.currentWish().position);
                map.setZoom(15);
            }

            // verify response from localStorage
            if (allWishes === 'error'){
                self.wishFlash(true);
            } else {
                self.wishFlash(false);
                for (var i = 0; i < allWishes.length; i++) {
                    wish = allWishes[i];
                    var marker = new google.maps.Marker({
                        map: map,
                        title: wish.title,
                        position: wish.position,
                        id: wish.id,
                        icon: wish.icon,
                        date: wish.date,
                        cost: wish.cost,
                        notes: wish.notes
                    });
                    marker.addListener('click', wishListener);
                    marker.addListener('dblclick', wishListenerDblClick)
                    marker.setMap(null);
                    placesWishes.push(marker);
                }
            listWish(placesWishes);
            showListings('wishes', placesWishes);
            }
        }
    };

    this.wishList = ko.observableArray([]);
    function listWish(placesWishes) {
        self.wishList([]);
        placesWishes.forEach(function(place){
            self.wishList.push(place);
        });
    }

    this.setWish = function(clickedMarker) {
        resetLayout();
        self.currentWish(clickedMarker);
        self.currentWish().setMap(map);
        map.setCenter(self.currentWish().position);
        map.setZoom(15);
    };

    //RECUE DREAM
    this.dreamFlash = ko.observable(true);
    this.currentDream = ko.observable();
    this.dreamList = ko.observableArray([]);
    this.showDreams = function() {
        if (placesDreams.length > 0) {
            showListings('dreams', placesDreams);
        } else {
            allDreams = getDreams();
            //set configs to dream marker
            function dreamListenerClick() {
                resetLayout();
                self.currentDream(this);
                self.currentDream().setMap(map);
            }
            function dreamListenerDblClick() {
                resetLayout();
                self.currentDream(this);
                self.currentDream().setMap(map);
                map.setCenter(self.currentDream().position);
                map.setZoom(15);
            }
            // verify response from localStorage
            if (allDreams === 'error'){
                self.dreamFlash(true);
            } else {
                self.dreamFlash(false);
                for (var i = 0; i < allDreams.length; i++) {
                    dream = allDreams[i];
                    var marker = new google.maps.Marker({
                        map: map,
                        title: dream.title,
                        position: dream.position,
                        id: dream.id,
                        icon: dream.icon,
                        date: dream.date,
                        notes: dream.notes
                    });
                    marker.addListener('click', dreamListenerClick);
                    marker.addListener('dblclick', dreamListenerDblClick);
                    marker.setMap(null);
                    placesDreams.push(marker);
                }
                listDream(placesDreams);
                showListings('dreams', placesDreams);
            }
        }
    };

    this.dreamList = ko.observableArray([]);
    function listDream(placesDreams) {
        self.dreamList([]);
        placesDreams.forEach(function(place){
            self.dreamList.push(place);
        });
    }

    this.setDream = function(clickedMarker) {
        resetLayout();
        self.currentDream(clickedMarker);
        self.currentDream().setMap(map);
        map.setCenter(self.currentDream().position);
        map.setZoom(15);
    };

    // CONTROL WISH OR DREAM FORM TO USER
    this.wishOrDream = ko.observable();
    this.displayWish = ko.observable(false);
    this.displayDream = ko.observable(false);
    this.display = function(clicked){
        if (clicked.wishOrDream() === 'Wish'){
            self.displayWish(true);
            self.displayDream(false);
        } else if (clicked.wishOrDream() === 'Dream') {
            self.displayWish(false);
            self.displayDream(true);
        } else {
            self.displayWish(false);
            self.displayDream(false);
        }
    };

    // This function will loop through the markers array and display them all.
    function showListings(token, markers) {
        if (token === 'wishes'){
            for (var i = 0; i < placesDreams.length; i++){
                placesDreams[i].setMap(null);
            }
        } else if (token === 'dreams') {
            for (var i = 0; i < placesWishes.length; i++) {
                placesWishes[i].setMap(null);
            }
        }
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
            bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
    }

    create_markers()

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
