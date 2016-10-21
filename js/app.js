'use strict';
var map;
var FS_CLIENT_ID = '340F1OEHKVG1HKLISDYMXZDZLMOUWYMI251PFUNRHPJ0HB3K';
var FS_CLIENT_SECRET = 'CONDTWSVA1YTPTSJLN5FLMH5VBSWOJPFT5QHY1WOGR0NZBEB';
var FS_VERSION = '20160928';
var FS_M = 'foursquare';

// Utils variable containing utility methods
var utils = {
  stringContains: function (string, pattern) {
    string = string || '';
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
};

// Create GoogleReview object with author name, review text and rating
var gReview = function(data) {
  this.author_name = ko.observable(data.author_name);
  this.reviewText = ko.observable(data.reviewText);
  this.rating = ko.observable(data.rating);
};

// Create Wikipedia Info object with URL, link text and info text
var wikiInfo = function(data) {
  this.wikiLink = ko.observable(data.wikiLink);
  this.wikiLinkText = ko.observable(data.wikiLinkText);
  this.wikiInfoText = ko.observable(data.wikiInfoText);
}

// Create FourSquare object with reviewer's name, gender, photo, review URL and review text
var fsReview = function(data) {
  this.gender = ko.observable(data.gender);
  this.canonicalUrl = ko.observable(data.canonicalUrl);
  this.text = ko.observable(data.text);
  this.photoUrl = ko.observable(data.photoUrl);
  this.name = ko.computed(function() {
    return data.firstName + ' ' + data.lastName;
  });
}

// ViewModel object with relevant variables and functions
var ViewModel = function() {
  var self = this;
  self.places = ko.observableArray([]);
  self.filter = ko.observable('');
  self.modTitle = ko.observable('');
  self.modBody = ko.observable('');
  self.gReviews = ko.observableArray([]);
  self.wikiInfos = ko.observableArray([]);
  self.fsReviews = ko.observableArray([]);
  self.gsvhide = ko.observable('hide');
  self.grhide = ko.observable('hide');
  self.fsrhide = ko.observable('hide');
  self.wihide = ko.observable('hide');

  self.infoWindow = new google.maps.InfoWindow();

  var bounds = new google.maps.LatLngBounds();
  // AJAX call to retrieve the json data to create map marker and other details
  $.getJSON('data/places.json').done(function(data) {
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

      marker.setMap(map);

      // Create different icons for all the markers
      self.createIconForMarker(marker, iconUrl);

      // Toggle the marker and open infoWindow on click of the marker
      marker.addListener('click', function(){
        self.bounceAndDispInfoWind({marker: this});
      });

      // Push each place object to an array
      self.places.push(new place({marker: marker,title: title,iconUrl: iconUrl}));
    }
  }).fail(function() {
    alert('Error encountered while retrieving data.');
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
        place.marker.setVisible(false);
      } else {
        place.marker.setVisible(true);
      }
      return disp;
    });
  }, self);

  // Toggle the marker on click of the marker and the corresponding place in the list
  self.bounceAndDispInfoWind = function(data) {
    var marker = data.marker;
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){
        marker.setAnimation(null);
      }, 3540);
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
        var innerHTML = '<div id="info-wrapper"><div>';
        // Display place name if present
        if (place.name) {
          innerHTML += '<strong>' + place.name + '</strong>';
        }
        // Display formatted address if present
        if (place.formatted_address){
          innerHTML += '<br>' + place.formatted_address;
        }
        // Display formatted phone number if present
        if (place.formatted_phone_number) {
          innerHTML += '<br>' + place.formatted_phone_number;
        }
        // Display opening hours if present
        if (place.opening_hours){
          innerHTML += '<br><br><Strong>Hours: </strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
        }
        // Display first photo if available
        if (place.photos) {
          innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxWidth: 100, maxHeight: 200}) + '">';
        }
        innerHTML += '</div><div id="services"><strong>Services</strong>';
        // Google Street View display
        innerHTML += '<br><a href="#" id="google-street-view" data-target="#mapModal" data-toggle="modal"' +
          ' data-title="Street View Image" data-markerpos="' + marker.position + '">Google StreetView</a>';
        // Google Reviews display
        innerHTML += '<br><a href="#" id="google-reviews" data-target="#mapModal" data-toggle="modal"' +
          ' data-title="User Reviews" data-markerid="' + marker.id +'">Google Reviews</a>';
        // Display Foursquare Review
        innerHTML += '<br><a href="#" id="foursquare-reviews" data-target="#mapModal" data-toggle="modal"' +
          ' data-title="FourSquare Reviews" data-fsposition="' + marker.position + '"' +
          ' data-fstitle="' + marker.title + '">FourSquare Reviews</a>';
        // Display Wikipedia information about the place
        innerHTML += '<br><a href="#" id="wiki-info" data-target="#mapModal" data-toggle="modal"' +
          ' data-title="Wikipedia" data-placename="' + marker.title + '">Wikipedia Info</a>';
        placeInfoWindow.setContent(innerHTML);
        // Display the infoWindow
        placeInfoWindow.open(map, marker);
        // Disassociate the infoWidnow with the marker on closing the infoWindow
        placeInfoWindow.addListener('closeclick', function(){
          placeInfoWindow.marker = null;
        });
      } else {
        alert('Error encountered while retrieving place details.');
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
      self.modTitle(a.data('title'));
      var markerpos = a.data('markerpos');
      var markerid = a.data('markerid');
      var placename = a.data('placename');
      var fsposition = a.data('fsposition');
      var fstitle = a.data('fstitle');
      var modal = $(this);
      // If marker position is available, call the streetview api to get the street view image
      // If marker id is available, call the places service to get the reviews
      if (markerpos) {
        self.getStreetView(markerpos, modal);
      } else if (markerid) {
        self.getGoogleReviews(markerid, modal);
      } else if (placename) {
        self.getWikiInfo(placename, modal);
      } else if (fsposition) {
        self.getFourSquareInfo(fsposition, fstitle, modal);
      }
    });
    // When the modal window is closed (hidden), remove all the element that was added on opening the modal,
    // so that the data is not cached and fresh data is fetched again.
    $('#mapModal').on('hidden.bs.modal', function () {
      var modal = $(this);
      var strtView = modal.find('#googleStreetView');
      strtView.children().remove();
      if (self.gsvhide() == '')
        self.gsvhide('hide');
      self.gReviews([]);
      if (self.grhide() == '')
        self.grhide('hide');
      self.wikiInfos([]);
      if (self.wihide() == '')
        self.wihide('hide');
      self.fsReviews([]);
      if (self.fsrhide() == '')
        self.fsrhide('hide');
    });
  };

  // Function to retrieve the reviews of a place on FourSquare
  self.getFourSquareInfo = function(fsposition, fstitle, modal) {
    self.fsrhide('');
    // URLs and Params for the FourSquare APIs
    var baseparam =
      '?client_id=' + FS_CLIENT_ID + '&client_secret=' + FS_CLIENT_SECRET + '&v=' + FS_VERSION + '&m=' + FS_M;
    var searchurl = 'https://api.foursquare.com/v2/venues/search';
    var searchparam =
      baseparam + '&ll=' + fsposition.substring(1,fsposition.length - 1).replace(/\s+/g,'') +'&query='+fstitle;
    var tipsurl = 'https://api.foursquare.com/v2/venues/VENUE_ID/tips';
    // This is the error object that needs to be used when reviews are not found in four square
    var errorObj = {
      firstName: '',
      lastName: '',
      gender: '',
      canonicalUrl: '',
      text: 'No reviews found on FourSquare for this place.',
      photoUrl: ''
    }

    // FourSquare search service API AJAX call to get the place ID
    $.ajax({
      url: searchurl + searchparam,
      type: 'GET',
      dataType: 'json'
    }).done(function(data){
      var placeId = data.response.venues[0].id;
      // FourSquare Tips service API AJAX call to get the reviews
      $.ajax({
        url: tipsurl.replace('VENUE_ID',placeId) + baseparam + '&sort=recent',
        type: 'GET',
        dataType: 'json'
      }).done(function(tips){
        var numTips = tips.response.tips.items.length;
        var iter = numTips > 10 ? 10 : numTips;
        // Get all the reviews and store it in a variable
        if (iter == 0) {
          self.fsReviews.push(new fsReview(errorObj));
        }
        for (var i = 0; i < iter; i++){
          var item = tips.response.tips.items[i];
          self.fsReviews.push(new fsReview({
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            gender: item.user.gender,
            canonicalUrl: item.canonicalUrl,
            text: item.text,
            photoUrl: item.photourl
          }));
        }
      }).fail(function(error){
        self.fsReviews.push(new fsReview(errorObj));
        alert('Error encountered with FourSquare Tips service API.');
      });
    }).fail(function(data){
      self.fsReviews.push(new fsReview(errorObj));
      alert('Error encountered with FourSquare search service API.');
    });
  };

  // Function to retrieve the Wikipedia information
  self.getWikiInfo = function(placename, modal) {
    self.wihide('');
    // Wiki opensearch API URL
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
                      placename + '&format=json&callback=wikiCallback';

    // JSONP AJAX call to allow cross origin requests
    $.ajax({
      url: wikiUrl,
      dataType: 'jsonp'
    }).done(function(response) {
      // If ajax call is success, push each of the wiki information to observable array
      if (response[1].length > 0) {
        for (var i = 0; i < response[1].length; i++){
          self.wikiInfos.push(new wikiInfo({
            wikiLink: response[3][i],
            wikiLinkText: response[1][i],
            wikiInfoText: response[2][i]
          }));
        }
      } else {
        // Push a proper message to the array if the wiki info is not found
        self.wikiInfos.push(new wikiInfo({
          wikiLink:'',
          wikiLinkText:'',
          wikiInfoText:'No Wikipedia Information available!'
        }));
      }
    }).fail(function() {
      self.wikiInfos.push(new wikiInfo({
        wikiLink:'',
        wikiLinkText:'',
        wikiInfoText:'Wikipedia service not available!'
      }));
      alert('Wikipedia service not available!');
    });
  };

  // Function to retrieve the Google reviews for the place displayed
  self.getGoogleReviews = function (markerid, modal) {
    self.grhide('');
    // Call the getDetails API of the PlacesService to fetch the user reviews
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: markerid
    }, function(place, status){
      if (status == google.maps.places.PlacesServiceStatus.OK){
        // Push each and every review provided by the service to the knockout observable
        if (place.reviews) {
          place.reviews.forEach(function(review, index){
            self.gReviews.push(new gReview({
              author_name: review.author_name,
              reviewText: review.text,
              rating: review.rating
            }));
          });
        } else {
          // Display message if no reviews available
          self.gReviews.push(new gReview({
            author_name: 'No Reviews available',
            reviewText: '',
            rating: ''
          }));
        }
      } else {
        alert('Error encountered while retrieving Google Reviews.');
      }
    });
  };

  // Function to get the street view image of the location
  self.getStreetView = function(markerpos, modal) {
    self.gsvhide('');
    var latlng = markerpos.substring(1,markerpos.length - 1).split(',');
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
        var panorama = new google.maps.StreetViewPanorama(modal.find('#googleStreetView')[0], panoramaOptions);
      } else {
        alert('Error encountered with the getPanoImage service call.')
      }
    }
    // Make a call to the getPanoramaByLocation API of the StreetViewService using the params - position and radius
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
  $('.place-list').height($('#map').height() * 0.847);
  $('#list-container').perfectScrollbar();
  ko.applyBindings(new ViewModel());
}