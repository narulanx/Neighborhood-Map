# Neighborhood-Map

This is a Chicago Neighborhood Map displaying some tourist attractions, restaurants, cafes and subway stations, on the list in the right pane as well as with the corresponding markers on the map. It is built with KnockoutJS framework using some Google Map APIs and some external APIs such as Wikipedia and FourSquare.
You can find this on [GitHub pages](https://narulanx.github.io/Neighborhood-Map/).

### Features
- The filter search box filters the places from the list and subsequently on the marker without refreshing the page.
- On click of the place name on the list or on marker, will bounce the marker indefinitely until you click again.
- On click of the place name on the list or on marker, will pop open an info window on the map displaying some information of the place and the services this is offered.
- The information displayed on the info window are retrieved using PlacesService Google Maps API. These information include name, address, phone number, opening hours and a photo of the place.
- The other services thar are included on the info window are Google StreetView, Google Reviews, FourSquare Reviews and Wikipedia Info. The information from these services are displayed on a modal window that gets opened in the middle of the page.
- Google StreetView uses the StreetViewService, StreetViewPanorama and ComputeHeading APIs of the Google Maps and displays the image that is returned.
- Google Reviews uses the PlacesService API of the Google Maps and displays all the user reviews with their name and rating.
- FourSquare Reviews uses the SearchService FourSquare API to get the PlaceID and uses this ID with TipsService FourSquare API to get the user reviews, and displays their name, gender, browser URL, review and a photo (if available).
- Wikipedia Info uses the OpenSearch Wikipedia API and displays the title and description from the return.
- A 'perfect scrollbar' JQuery plugin is used for the list of places in the right pane.

### Tools and APIs used
- KnockoutJS
- Google Maps API
	* PlacesService
	* StreetViewService
	* StreetViewPanorama
	* ComputeHeading
- FourSquare API
	* SearchService
	* TipsService
- Wikipedia OpenSearch API
- Bootstrap
- Google Fonts
- JQuery
- Perfect Scrollbar JQuery plugin