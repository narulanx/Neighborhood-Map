'use strict';
var map;

// Utils variable containing utility methods
var utils = {
  stringContains: function (string, pattern) {
    string = string || "";
    if (pattern.length > string.length)
      return false;
    return string.indexOf(pattern) !== -1;
  }
}

// Create Place object with marker, title and icon URL
var place = function(data) {
  this.marker = data.marker;
  this.title = ko.observable(data.title);
  this.iconUrl = ko.observable(data.iconUrl);
}

// ViewModel object with relevant variables and functions
var viewModel = function() {
  var self = this;
  self.places = ko.observableArray([]);
  self.filter = ko.observable("");

  self.infoWindow = new google.maps.InfoWindow();

  var bounds = new google.maps.LatLngBounds();
  // AJAX call to retrieve the json data to create map marker and other details
  $.getJSON("data/places.json").done(function(data) {
    for (var i = 0; i < data.length; i++){
      var position = data[i].location;
      var title = data[i].title;
      var iconUrl = data[i].iconUrl;

      // Create marker for each place object in the json
      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: data[i].placeId
      });
      bounds.extend(marker.position);

      // Create different icons for all the markers
      self.createIconForMarker(marker, iconUrl);

      // Toggle the marker and open infoWindow on click of the marker
      marker.addListener('click', function(){
        self.toggleBounce({marker: this});
      });

      // Push each place object to an array
      self.places.push(new place({marker: marker,title: title,iconUrl: iconUrl}));
    }
  });
  map.fitBounds(bounds);

  // Filter the places based on the user's input
  // For each place shown in the list, display the corresponding marker
  self.filteredPlaces = ko.computed(function() {
    var filter = this.filter().toLowerCase();
    return ko.utils.arrayFilter(this.places(), function(place) {
      var disp;
      if (!filter){
        disp = true;
      } else {
        disp = utils.stringContains(place.title().toLowerCase(), filter);
      }
      if (!disp){
        place.marker.setMap(null);
      } else {
        place.marker.setMap(map);
      }
      return disp;
    });
  }, self);

  // Toggle the marker on click of the marker and the corresponding place in the list
  self.toggleBounce = function(data) {
    var marker = data.marker;
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    // Unbind the modal before creating another 'on' bind
    $('#mapModal').unbind();
    // Create binding to display the modal
    self.createModalBinding();
    // Get the place details and display on the infoWindow
    self.getPlaceDetails(marker);
  };

  // GetPlaceDetails function to get the details of the place using PlacesService' getDetails API
  // Populate the name, address, phone number, opening hours and photo on the infoWindow
  // Display the list of services offered based on the place
  self.getPlaceDetails = function (marker){
    var placeInfoWindow = this.infoWindow;
    // Use the getDetails API of the PlacesService to get the place details
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: marker.id
    }, function(place, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        placeInfoWindow.marker = marker;
        var innerHTML = "<div id='info-wrapper'><div>";
        // Display place name if present
        if (place.name) {
          innerHTML += "<strong>" + place.name + "</strong>";
        }
        // Display formatted address if present
        if (place.formatted_address){
          innerHTML += "<br>" + place.formatted_address;
        }
        // Display formatted phone number if present
        if (place.formatted_phone_number) {
          innerHTML += "<br>" + place.formatted_phone_number;
        }
        // Display opening hours if present
        if (place.opening_hours){
          innerHTML += "<br><br><Strong>Hours: </strong><br>" +
            place.opening_hours.weekday_text[0] + "<br>" +
            place.opening_hours.weekday_text[1] + "<br>" +
            place.opening_hours.weekday_text[2] + "<br>" +
            place.opening_hours.weekday_text[3] + "<br>" +
            place.opening_hours.weekday_text[4] + "<br>" +
            place.opening_hours.weekday_text[5] + "<br>" +
            place.opening_hours.weekday_text[6];
        }
        // Display first photo if available
        if (place.photos) {
          innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxWidth: 100, maxHeight: 200}) + '">';
        }
        innerHTML += "</div><div id='services'><strong>Services</strong>";
        // Google Street View display
        innerHTML += "<br><a href='#' id='google-street-view' data-target='#mapModal' data-toggle='modal'" +
          " data-title='Street View Image' data-markerpos='" + marker.position + "'>Google StreetView</a>";
        // Google Reviews display
        innerHTML += "<br><a href='#' id='google-reviews' data-target='#mapModal' data-toggle='modal'" +
          " data-title='User Reviews' data-markerid='" + marker.id +"'>Google Reviews</a>";
        // Display Foursquare Review
        innerHTML += "<br><a href='#' id='foursquare-reviews'>Foursquare Reviews</a>";
        // Display Wikipedia information about the place
        innerHTML += "<br><a href='#' id='wiki-info'>Wikipedia Info</a>";
        // Display Instagram images of the place
        innerHTML += "<br><a href='#' id='instagram-images'>Instagram Images</a></div></div>";
        placeInfoWindow.setContent(innerHTML);
        // Display the infoWindow
        placeInfoWindow.open(map, marker);
        // Disassociate the infoWidnow with the marker on closing the infoWindow
        placeInfoWindow.addListener("closeclick", function(){
          placeInfoWindow.marker = null;
        });
      }
    });
  };

  // Function to create the icon for the marker
  self.createIconForMarker = function(marker, iconUrl) {
    var icon = {
      url: iconUrl,
      size: new google.maps.Size(35,35),
      origin: new google.maps.Point(0,0),
      anchor: new google.maps.Point(15,34),
      scaledSize: new google.maps.Size(25,25)
    }
    marker.setIcon(icon);
  };

  // Function to associate the bindings over the modal window
  self.createModalBinding = function() {
    // When the modal window is shown, populate the title and call the specific service based on the link clicked
    $('#mapModal').on('show.bs.modal', function (event) {
      var a = $(event.relatedTarget);
      var title = a.data('title');
      var markerpos = a.data('markerpos');
      var markerid = a.data('markerid');
      var modal = $(this);
      modal.find('.modal-title').text(title);
      // If marker position is available, call the streetview api to get the street view image
      // If marker id is available, call the places service to get the reviews
      if (markerpos) {
        self.getStreetView(markerpos, modal);
      } else if (markerid) {
        self.getGoogleReviews(markerid, modal);
      }
    });
    // When the modal window is closed (hidden), remove all the element that was added on opening the modal,
    // so that the data is not cached and fresh data is fetched again.
    $('#mapModal').on('hidden.bs.modal', function () {
      var modal = $(this);
      var modalbody = modal.find('.modal-body');
      modalbody.children().remove();
      modalbody.removeAttr('style');
    });
  };

  // Function to retrieve the Google reviews for the place displayed
  self.getGoogleReviews = function (markerid, modal) {
    var modalbody = modal.find('.modal-body');
    // Call the getDetails API of the PlacesService to fetch the user reviews
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: markerid
    }, function(place, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        var reviews = "<div id='review'>";
        // Display each and every review provided by the service, if available
        if (place.reviews) {
          place.reviews.forEach(function(review, index){
            reviews += "<strong>" + (index+1) + ". " + review.author_name + "</strong>";
            reviews += "<br>" + review.text;
            reviews += "<br><strong>Rating</strong>: " + review.rating;
            reviews += "<br><br>";
          });
        } else {
          reviews = "No Reviews available!"
        }
        reviews += "</div>";
        modal.find('.modal-body').append(reviews);
      }
    });
  };

  // Function to get the street view image of the location
  self.getStreetView = function(markerpos, modal) {
    var modalbody = modal.find('.modal-body');
    var latlng = markerpos.substring(1,markerpos.length - 1).split(",");
    var streetMarker = new google.maps.Marker({
      position: {lat: parseFloat(latlng[0].trim()), lng: parseFloat(latlng[1].trim())}
    });
    // Use Google's StreetViewService for this information
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // Callback function getPanoImage is called as a result of the getPanoramaByLocation service call
    function getPanoImage(data, status){
      // If the status is OK
      if (status == google.maps.StreetViewStatus.OK){
        var nearStreetViewLocation = data.location.latLng;
        // Heading is computed based on the nearStreetViewLocation and marker position using geometry library
        var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, streetMarker.position);
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 10
          }
        };
        // PanoramaOptions object is populated in the placeholder which displays the street view image.
        var panorama = new google.maps.StreetViewPanorama(modal.find('.modal-body')[0], panoramaOptions);
      } else {
        // Display a message of the status of the service call is not OK
        modal.find('.modal-body').text("No Street View Found");
      }
    }
    // Make a call to the getPanoramaByLocation API of the StreetViewService using the parameters - position and radius
    // The result of the service is passed as an argument to the callback function getPanoImage
    streetViewService.getPanoramaByLocation(streetMarker.position, radius, getPanoImage);
  };
}

// Initial method to load the Map
var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.8847888, lng: -87.7383704},
    zoom: 13
  });

  ko.applyBindings(new viewModel());
}