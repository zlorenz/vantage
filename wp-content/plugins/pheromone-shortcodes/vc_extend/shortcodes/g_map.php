<?php
/*GOOGLE MAP*/
add_shortcode('vc_g_map', 'vc_g_map_f');
function vc_g_map_f( $atts, $content = null)
{
  extract(shortcode_atts(
    array(
      'api_key' => null,
      'address' => '235 Bowery, New York, NY',
      'zoom' => '16',
      'height' => '430px',
    ), $atts)
  );

if($api_key == true) {
  $output ='<div id="map" style="height:'.$height.'"></div>
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key='.$api_key.'"></script>
         <script>
var geocoder;
var map;
var marker;
var address = "'.$address.'";

function initialize() {
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(-34.397, 150.644);

  var myOptions = {
    zoom: '.$zoom.',
    center: latlng,
    disableDefaultUI: true,
    scrollwheel: true,
    draggable: true,
    styles: [
              {
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#ebe3cd"
                  }
                ]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#523735"
                  }
                ]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [
                  {
                    "color": "#f5f1e6"
                  }
                ]
              },
              {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [
                  {
                    "color": "#c9b2a6"
                  }
                ]
              },
              {
                "featureType": "administrative.land_parcel",
                "elementType": "geometry.stroke",
                "stylers": [
                  {
                    "color": "#dcd2be"
                  }
                ]
              },
              {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#ae9e90"
                  }
                ]
              },
              {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#dfd2ae"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#dfd2ae"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#93817c"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                  {
                    "color": "#a5b076"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#447530"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#f5f1e6"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#fdfcf8"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#f8c967"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                  {
                    "color": "#e9bc62"
                  }
                ]
              },
              {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#e98d58"
                  }
                ]
              },
              {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry.stroke",
                "stylers": [
                  {
                    "color": "#db8555"
                  }
                ]
              },
              {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#806b63"
                  }
                ]
              },
              {
                "featureType": "transit.line",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#dfd2ae"
                  }
                ]
              },
              {
                "featureType": "transit.line",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#8f7d77"
                  }
                ]
              },
              {
                "featureType": "transit.line",
                "elementType": "labels.text.stroke",
                "stylers": [
                  {
                    "color": "#ebe3cd"
                  }
                ]
              },
              {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#dfd2ae"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "geometry.fill",
                "stylers": [
                  {
                    "color": "#b9d3c2"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#92998d"
                  }
                ]
              }
            ],
    mapTypeControl: false,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      },
    navigationControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById("map"), myOptions);

  if (geocoder) {
    geocoder.geocode({
      "address": address
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
          map.setCenter(results[0].geometry.location);

          var infowindow = new google.maps.InfoWindow({
            content: "<b>" + address + "</b>",
            size: new google.maps.Size(150, 50)
          });

          var marker = new google.maps.Marker({
            position: results[0].geometry.location,
            map: map,
            icon: "'.get_template_directory_uri().'/assets/images/map-marker.png",
            title: address
          });
          google.maps.event.addListener(marker, "click", function() {
            infowindow.open(map, marker);
          });
        } else {
          alert("No results found");
        }
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }
};
google.maps.event.addDomListener(window, "load", initialize);</script>';
} else {
    $output ='<div id="map" style="height:'.$height.'"><p style="text-align: center;margin-bottom: 0;line-height: '.$height.';font-size: 21px;background:#fff;border-top:2px solid #eee;">Please, set up your API key for display Google Maps.</p></div>';;
};
  return $output;
};


vc_map( array(
  "name" => __("Google Map",'pheromone'),
  "base" => "vc_g_map",
  "category" => __('Pheromone','pheromone'),
  "params" => array(
    array(
      "type" => "textfield",
      "admin_label" => true,
      "param_name" => "api_key",
      "heading" => __("API Key", 'pheromone'),
      "description" => 'Enter your own key for enable Google Maps. <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank">Create new key.</a>', 'pheromone',
    ),
    array(
      "type" => "textfield",
      "admin_label" => true,
      "param_name" => "address",
      "heading" => __("Addres", 'pheromone'),
      "value" => '235 Bowery, New York, NY',
    ),
    array(
      "type" => "textfield",
      "admin_label" => true,
      "param_name" => "zoom",
      "heading" => __("Zoom", 'pheromone'),
      "value" => '16',
    ),
    array(
      "type" => "textfield",
      "admin_label" => true,
      "param_name" => "height",
      "heading" => __("Map Height", 'pheromone'),
      "value" => '430px',
    ), 
  )
) );