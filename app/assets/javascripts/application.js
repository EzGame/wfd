// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require_tree .

var inactive = false;
var response = null;
var TO_LAT = 43.7001100;
var TO_LON = -79.4163000;
var map_markers = [];
var map = null;

$(document).ready(function() {
  centerGoogMap();
});

/* Functions */
var centerGoogMap = function( code ) {
  // Define some options for the map
  var mapOptions = {
    center: new google.maps.LatLng(TO_LAT, TO_LON),
    zoom: 12,
    // hide controls
    panControl: false,
    streetViewControl: false,
    // reconfigure the zoom controls
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
      style: google.maps.ZoomControlStyle.SMALL
    },
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  // create a new Google map with the options in the map element
  map = new google.maps.Map($('#google-map')[0], mapOptions);
};

var searchPostal = function() {
  value = $('#postal-code').val();
  $('#results').empty();
  clearMarkers();
  if (inactive) return;

  // Post our query to server
  $.post('/search', { postal_code: value }, function( json ) {
    inactive = true;
    console.log(json);
    if (json.status === 'success') {
      // Render categories
      $('#results').append("What\'re you feeling?");
      jQuery.each(json.businesses, function( category ) {
        $('#results').append(buildCategoryContainer(category));
      });

      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({address: value}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: map,
            position: results[0].geometry.location,
            title: "home",
            icon: "assets/home-services.png"
          });

          map.setZoom(15);
          map.panTo(marker.position);

          map_markers.push(marker);
        } else {
          console.log("Geocode was not successful for the following reason: " + status);
        }
      });

      // Save response
      response = json;
      inactive = false;
    } else {
      console.log("failed" + json.message);
      inactive = false;
    }
  });
};


var buildBusinessesFromCategories = function( div ) {
  $('#results').empty();
  $('#results').append("Here are some suggestions!");
  category = div.getAttribute('data');
  jQuery.each(response.businesses[category], function( index, business ) {
    $('#results').append(buildBusinessContainer(business.hash))
  })
};

var geolocateBusiness = function( div ) {
  address = div.getAttribute('data-address');

  var geocoder = new google.maps.Geocoder();
  // geocode the address and get the lat/lng
  geocoder.geocode({address: address}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      // create a marker and drop it on the name on the geocoded location
      var marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        map: map,
        position: results[0].geometry.location,
        title: name,
        icon: "assets/food.png"
      });

      map.setZoom(15);
      map.panTo(marker.position);

      map_markers.push(marker);
    } else {
      console.log("Geocode was not successful for the following reason: " + status);
    }
  });
};

var buildCategoryContainer = function( category ) {
  return [
    '<div class="category" data="', category,
    '" onclick="buildBusinessesFromCategories(this);">',
    category,
    '</div>'
  ].join('');
};

var buildBusinessContainer = function( business ) {
  return [
    '<div class="result" data-address="', business['location']['display_address'].join(","), '",' +
      ' onclick="geolocateBusiness(this)">',
    '<img class="biz_img" src="', business['image_url'], '">',
    '<h5><a href="', business['url'] ,'" target="_blank">', business['name'], '</a></h5>',
    '<img src="', business['rating_img_url'], '">',
    '<p>', business['review_count'], ' reviews</p>',
    '<p class="clear-fix"></p>',
    '</div>'
  ].join('');
};

var clearMarkers = function() {
  map_markers.forEach(function(marker) {
    marker.setMap(null);
  });

  map_markers = [];
};
