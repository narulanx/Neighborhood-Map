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
  this.marker = ko.observable(data.marker);
  this.title = ko.observable(data.title);
}

var viewModel = function() {
  var self = this;
  self.places = ko.observableArray([]);
  self.filter = ko.observable("");

  var bounds = new google.maps.LatLngBounds();
  $.getJSON("data/places.json").done(function(data) {
    for (var i = 0; i < data.length; i++){
      var position = data[i].location;
      var title = data[i].title;

      var marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: i
      });

      marker.setMap(map);
      bounds.extend(marker.position);

      self.places.push(new place({marker: marker,title: title}));
    }
  });
  map.fitBounds(bounds);

  self.filteredPlaces = ko.computed(function() {
    var filter = this.filter().toLowerCase();
    if (!filter) {
        return this.places();
    } else {
        return ko.utils.arrayFilter(this.places(), function(place) {
            return utils.stringContains(place.title().toLowerCase(), filter);
        });
      }
  }, self);
}

var initMap = function() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 41.8847888, lng: -87.7383704},
    zoom: 12
  });

  ko.applyBindings(new viewModel());
}