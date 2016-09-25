var map;

var utils = {
  stringContains: function (string, pattern) {
    string = string || "";
    if (pattern.length > string.length)
      return false;
    return string.indexOf(pattern) !== -1;
  }
}

var place = function(data) {
  this.marker = data.marker;
  this.title = ko.observable(data.title);
  this.iconUrl = ko.observable(data.iconUrl);
}

var viewModel = function() {
  var self = this;
  self.places = ko.observableArray([]);
  self.filter = ko.observable("");

  self.infoWindow = new google.maps.InfoWindow();

  var bounds = new google.maps.LatLngBounds();
  $.getJSON("data/places.json").done(function(data) {
    for (var i = 0; i < data.length; i++){
      var position = data[i].location;
      var title = data[i].title;
      var iconUrl = data[i].iconUrl;

      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: data[i].placeId
      });
      bounds.extend(marker.position);

      self.createIconForMarker(marker, iconUrl);

      marker.addListener('click', function(){
        self.toggleBounce({marker: this});
      });

      self.places.push(new place({marker: marker,title: title,iconUrl: iconUrl}));
    }
  });
  map.fitBounds(bounds);

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

  self.toggleBounce = function(data) {
    var marker = data.marker;
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    self.createModalBinding();
    self.getPlaceDetails(marker);
  };

  self.getPlaceDetails = function (marker){
    var placeInfoWindow = this.infoWindow;
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: marker.id
    }, function(place, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        placeInfoWindow.marker = marker;
        var innerHTML = "<div id='info-wrapper'><div>";
        if (place.name) {
          innerHTML += "<strong>" + place.name + "</strong>";
        }
        if (place.formatted_address){
          innerHTML += "<br>" + place.formatted_address;
        }
        if (place.formatted_phone_number) {
          innerHTML += "<br>" + place.formatted_phone_number;
        }
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
        if (place.photos) {
          innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxWidth: 100, maxHeight: 200}) + '">';
        }
        innerHTML += "</div><div id='services'><strong>Services</strong>";
        innerHTML += "<br><a href='#' id='google-street-view' data-target='#mapModal' data-toggle='modal'" +
          " data-title='Street View Image' data-markerpos='" + marker.position + "'>Google StreetView</a>";
        innerHTML += "<br><a href='#' id='google-reviews' data-target='#mapModal' data-toggle='modal'" +
          " data-markerid='" + marker.id +"'>Google Reviews</a>";
        innerHTML += "<br><a href='#' id='foursquare-reviews'>Foursquare Reviews</a>";
        innerHTML += "<br><a href='#' id='wiki-info'>Wikipedia Info</a>";
        innerHTML += "<br><a href='#' id='instagram-images'>Instagram Images</a></div></div>";
        placeInfoWindow.setContent(innerHTML);
        placeInfoWindow.open(map, marker);
        placeInfoWindow.addListener("closeclick", function(){
          placeInfoWindow.marker = null;
        });
      }
    });
  };

  self.createIconForMarker = function(marker, iconUrl) {
    icon = {
      url: iconUrl,
      size: new google.maps.Size(35,35),
      origin: new google.maps.Point(0,0),
      anchor: new google.maps.Point(15,34),
      scaledSize: new google.maps.Size(25,25)
    }
    marker.setIcon(icon);
  };

  self.createModalBinding = function() {
    $('#mapModal').on('show.bs.modal', function (event) {
      var a = $(event.relatedTarget);
      var title = a.data('title');
      var markerpos = a.data('markerpos');
      var markerid = a.data('markerid');
      var modal = $(this);
      modal.find('.modal-title').text(title);
      if (markerpos) {
        self.getStreetView(markerpos, modal);
      } else if (markerid) {
        self.getGoogleReviews(markerid, modal);
      }
    });
    $('#mapModal').on('hidden.bs.modal', function () {
      var modal = $(this);
      var modalbody = modal.find('.modal-body');
      modalbody.empty();
      modalbody.removeAttr('style');
    });
  };

  self.getGoogleReviews = function (markerid, modal) {
    var modalbody = modal.find('.modal-body');
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: markerid
    }, function(place, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        var reviews = "<div id='review'>";
        if (place.reviews) {
          place.reviews.forEach(function(review, index){
            reviews += "<strong>" + (index+1) + ". " + review.author_name + "</strong>";
            reviews += "<br>" + review.text;
            reviews += "<br><strong>Rating</strong>: " + review.rating;
            reviews += "<br><br>";
          });
          reviews += "</div>";
        } else {
          reviews = "No Reviews available!"
        }
        modal.find('.modal-body').append(reviews);
      }
    });
  };

  self.getStreetView = function(markerpos, modal) {
    var modalbody = modal.find('.modal-body');
    var latlng = markerpos.substring(1,markerpos.length - 1).split(",");
    var streetMarker = new google.maps.Marker({
      position: {lat: parseFloat(latlng[0].trim()), lng: parseFloat(latlng[1].trim())}
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    function getPanoImage(data, status){
      console.log(data, status);
      if (status == google.maps.StreetViewStatus.OK){
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, streetMarker.position);
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 10
          }
        };
        var panorama = new google.maps.StreetViewPanorama(modal.find('.modal-body')[0], panoramaOptions);
      } else {
        modal.find('.modal-body').text("No Street View Found");
      }
    }
    streetViewService.getPanoramaByLocation(streetMarker.position, radius, getPanoImage);
  };
}

var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.8847888, lng: -87.7383704},
    zoom: 13
  });

  ko.applyBindings(new viewModel());
}