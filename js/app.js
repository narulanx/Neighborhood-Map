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

      infoWindow.setContent("<div>"+marker.title+"</div>");
      infoWindow.addListener('closeclick', function(){
        infoWindow.marker = null;
      });
      infoWindow.open(map, marker);
    }
  };
}

var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.8847888, lng: -87.7383704},
    zoom: 12
  });

  ko.applyBindings(new viewModel());
}