import { Loader } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState } from 'react';

function App() {

  //Ref to HTML elements
  const googleMapRef = useRef(null);
  const searchInput = useRef(null);

  //Geolocation of the user
  const [currentPosition, setCurrentPosition] = useState(null);
  //Destination of the user
  const [destination, setDestination] = useState(null);
  //Direction display instance
  const [directionsDisplay, setDirectionsDisplay] = useState(null);
  //Map instance
  const [map, setMap] = useState(null);
  //Load the google maps API
  const loader = new Loader({
    apiKey: process.env.REACT_APP_API_KEY,
    version: 'weekly',
    libraries: ['places', 'routes']
  });
  //Markers
  const [markers, setMarkers] = useState([]);


  //Get the current position of the user
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords.latitude, position.coords.longitude);
      setCurrentPosition({lat: position.coords.latitude, lng: position.coords.longitude});
    }, () => {}, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
  }, []);


  //Load the map and add autocomplete
  useEffect(() => {
    if(!currentPosition) {
      return;
    } 

    loader.load().then(() => {
      const map = new window.google.maps.Map(googleMapRef.current, {
        center: currentPosition,
        zoom: 8,
      });

      setMap(map);

      if(!directionsDisplay) {
        console.log('set');
        setDirectionsDisplay(new window.google.maps.DirectionsRenderer({map: map}));
      }

      const options = {
        fields: ["formatted_address", "geometry", "name"],
        strictBounds: false,
      };
    
      const autocomplete = new window.google.maps.places.Autocomplete(searchInput.current, options);
      autocomplete.bindTo("bounds", map);

      autocomplete.addListener("place_changed", () => {
        
        const place = autocomplete.getPlace();
        setDestination(place);
    
        // If the place has no geometry, then present an error message
        if (!place.geometry || !place.geometry.location) {
          window.alert("No details available for input: '" + place.name + "'");
          return;
        }
    
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17); 
        }
      });
    });
  }, [currentPosition]);

  //Display the route
  useEffect(() => {

    if(!directionsDisplay) {
      return;
    }

    directionsDisplay.set('directions', null);
    markers.forEach((marker) => {
      marker.setMap(null);
    });

    const markerA = new window.google.maps.Marker({
      position: new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
      title: "point A",
      label: "A",
      map: map
    });
    const markerB = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(destination.geometry.location.lat(), destination.geometry.location.lng()),
        title: "point B",
        label: "B",
        map: map
    });
    setMarkers([markerA, markerB]);

    const directionsService = new window.google.maps.DirectionsService;

    directionsService.route({
      origin: new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
      destination: new window.google.maps.LatLng(destination.geometry.location.lat(), destination.geometry.location.lng()),
      avoidTolls: true,
      avoidHighways: false,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, function (response, status) {
      if (status == window.google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }, [destination]);

  return (
    <section>
      <input type='text' ref={searchInput} />
      <div ref={googleMapRef} style={{ width: '100vw', height: '100vh' }}></div>
    </section>
  );
}

export default App;
