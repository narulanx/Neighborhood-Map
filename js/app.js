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

      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: i
      });
      bounds.extend(marker.position);

      self.createIconForMarker(marker, data[i].iconUrl)

      marker.addListener('click', function(){
        self.toggleBounce({marker: this});
      });

      self.places.push(new place({marker: marker,title: title}));
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
    self.populateInfoWindow(marker);
  };

  self.populateInfoWindow = function(marker){
    var infoWindow = this.infoWindow;
    if(infoWindow.marker != marker) {
      infoWindow.setContent('');
      infoWindow.marker = marker;

      infoWindow.addListener('closeclick', function(){
        infoWindow.marker = null;
      });

      var streetViewService = new google.maps.StreetViewService();
      var radius = 50;

      function getStreetView(data, status){
        if (status == google.maps.StreetViewStatus.OK){
          var nearStreetViewLocation = data.location.latLng;
          var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
          infoWindow.setContent('<div>'+marker.title+'</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 10
            }
          };
          console.log(panoramaOptions);
          var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
        } else {
          infoWindow.setContent("<div>"+marker.title+"</div><div>No Street View Found</div>");
        }
      }

      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

      infoWindow.open(map, marker);
    }
  }

  self.createIconForMarker = function(marker, iconUrl) {
    icon = {
      url: iconUrl,
      size: new google.maps.Size(35,35),
      origin: new google.maps.Point(0,0),
      anchor: new google.maps.Point(15,34),
      scaledSize: new google.maps.Size(25,25)
    }
    marker.setIcon(icon);
  }
}

var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.8847888, lng: -87.7383704},
    zoom: 13
  });

  ko.applyBindings(new viewModel());
}