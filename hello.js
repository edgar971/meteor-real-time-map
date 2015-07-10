//Todo: Make data private
//Todo: Delete markers
MapMarkers = new Mongo.Collection('MapMarkers');



if (Meteor.isClient) {
    Meteor.startup(function() {

        if(navigator.geolocation) {
            console.log('Getting users location.');
            navigator.geolocation.getCurrentPosition(function(geo){

                Session.set('mapLat', geo.coords.latitude);
                Session.set('mapLong', geo.coords.longitude);
                GoogleMaps.load();
            });
        }



    });

    Template.body.helpers({
        //Map stuff
        exampleMapOptions: function() {
            // Make sure the maps API has loaded
            if (GoogleMaps.loaded()) {
                // Map initialization options
                return {
                    center: new google.maps.LatLng(Session.get('mapLat'), Session.get('mapLong')),
                    zoom: 10
                };

            }
        }


    });

    Template.body.onCreated(function() {
        // We can use the `ready` callback to interact with the map API once the map is ready.
        GoogleMaps.ready('exampleMap', function(map) {

            console.log(map.instance.getBounds());

            // Add a marker to the map once it's ready
            //add coordinates to DB on map click
            google.maps.event.addListener(map.instance, 'click', function(event) {
                MapMarkers.insert({ lat: event.latLng.lat(), lng: event.latLng.lng() });
                //todo: remove console log
                console.log(event);
            });

            //markers array
            var markers = {};

            //observe the db
            MapMarkers.find().observe({
                added: function(document) {

                    var marker = new google.maps.Marker({
                        draggable: true,
                        animation: google.maps.Animation.DROP,
                        position: new google.maps.LatLng(document.lat, document.lng),
                        map: map.instance,
                        id: document._id
                    });

                    //update marker POS on drag of marker
                    google.maps.event.addListener(marker, 'dragend', function(event) {
                        MapMarkers.update(marker.id, { $set: { lat: event.latLng.lat(), lng: event.latLng.lng() }});

                    });

                    markers[document._id] = marker;
                },
                //update map with database when the marker is updated
                changed: function(newMarker, oldMarker) {
                    markers[newMarker._id].setPosition({ lat: newMarker.lat, lng: newMarker.lng });
                },

                //delete marker from map when deleted
                removed: function(oldMarker) {
                    markers[oldMarker._id].setMap(null);
                    google.maps.event.clearInstanceListeners(markers[oldMarker._id]);
                    //delete from JS array.
                    delete markers[oldMarker._id];
                }

            });


        });
    });
    //Markers list view
    Template.MapMarkersList.helpers({
        "mapMarker": function() {
            if (GoogleMaps.loaded()) {
                return MapMarkers.find();
            }

        }
    })
}

if (Meteor.isServer) {
    Meteor.startup(function () {
    // code to run on server at startup
    });
}
