import { Loader } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState } from 'react';

function App() {
  
  const possibleLocations = [
    {
     lat: 45.770863,
     lng: 15.857940,
     name: 'skydive croatia'
    },
    {
     lat: 45.763354,
     lng: 15.868353,
     name: 'sportski centar lučko'
    },
    {
     lat: 45.760026,
     lng: 15.895544,
     name: 'royal apartments & rooms'
    },
    {
     lat: 45.762487,
     lng: 15.915800,
     name: 'profa caffe & pub'
    },
    {
     lat: 45.764780,
     lng: 15.925699,
     name: 'suman d.o.o'
    },
    {
     lat: 45.777850,
     lng: 15.949579,
     name: 'mc donalds rotor'
    },
    {
     lat: 45.784435,
     lng: 15.950761,
     name: 'pizzeria stara sava'
    },
    {
     lat: 45.787396,
     lng: 15.953021,
     name: 'hendrick\'s gin garden'
    },
    {
     lat: 45.790257,
     lng: 15.955924,
     name: 'vintage industrial'
    },
    {
     lat: 45.795086,
     lng: 15.967092,
     name: 'caffe bar marko polo'
    },
  ];

  /**
   *
   *
   * ispisati broj lokacija koje su na toj ruti i njihov info
   * https://medium.com/@yashwantltce/a-simple-way-to-find-places-along-the-route-using-google-maps-api-4237fb452ec2
   *
   * 1. upisati 10 lokacija
   * 2. setiranje rute između korisnika i destinacije
   * 3. naći lokacije u blizini rute
   * 4. napraviti rutu sa lokacijama kao stop mjestima koje su nađene u prethodnom koraku
   * -- generirati possible locations kao stopove waypointova na ruti ako su u krugu od 150 m od tražene rute.
   * 5. ispisati lokacije koje su na ruti i njihov info
   */
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
    libraries: ['places', 'routes'],
  });
  
  //Markers
  const [markers, setMarkers] = useState([]);
  //  polyline
  const [polyline, setPolyline] = useState(null);

  const getChatCompletion = async () => {
   const data = {
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": `Give me a list of landmarks that are between ${currentPosition} and Trg bana Josipa Jelačića, Zagreb.`}],
    "temperature": 0.7
   };

   fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
    },
    body: JSON.stringify(data)
   })
   .then(response => {
    if(!response.ok){
      throw new Error('Network response was not ok')
    }
    return response.json();
   })
   .then(data => {
    console.log(data)
   })
   .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
   })
  }

  //Get the current position of the user
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position.coords.latitude, position.coords.longitude);
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
   
  }, []);

  useEffect(() => {
    getChatCompletion()
  },[])
 
  //Load the map and add autocomplete
  useEffect(() => {
    if (!currentPosition) {
      return;
    }

    loader.load().then(() => {
      const map = new window.google.maps.Map(googleMapRef.current, {
        center: currentPosition,
        zoom: 8,
      });

      setMap(map);

      if (!directionsDisplay) {
        console.log('set');
        setDirectionsDisplay(
          new window.google.maps.DirectionsRenderer({ map: map })
        );
      }

      const options = {
        fields: ['formatted_address', 'geometry', 'name'],
        strictBounds: false,
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInput.current,
        options
      );
      autocomplete.bindTo('bounds', map);

      autocomplete.addListener('place_changed', () => {
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
    if (!directionsDisplay) {
      return;
    }

    directionsDisplay.set('directions', null);

    markers.forEach((marker) => {
      marker.setMap(null);
    });

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(
          currentPosition.lat,
          currentPosition.lng
        ),
        destination: new window.google.maps.LatLng(
          destination.geometry.location.lat(),
          destination.geometry.location.lng()
        ),
        avoidTolls: true,
        avoidHighways: false,
        travelMode: window.google.maps.TravelMode.WALKING,
      },

      function (response, status) {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = response.routes[0];
          const legs = route.legs;
          const waypoints = [];
          const radius = 150;
          
          directionsDisplay.setDirections(response);
          
          for(const waypoint of possibleLocations) {
            for(const leg of legs) {
              const steps = leg.steps;
              for(const step of steps) {
                // calculate distance between waypoints and route
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                  new window.google.maps.LatLng(waypoint.lat, waypoint.lng),
                  new window.google.maps.LatLng(step.end_location.lat(), step.end_location.lng()),
                );
                
                if(distance <= radius) {
                  waypoints.push({
                    location: new window.google.maps.LatLng(waypoint.lat, waypoint.lng),
                    stopover: true,
                  });
                  console.log('waypoints',waypoints);
                  directionsDisplay.set('directions', null); 
                }
              }
            } 
         }
         
          const placesService = new window.google.maps.places.PlacesService(map);
   
          // get the nearest places around the waypoints
          for(let i = 0; i <= waypoints.length - 1; i++) {
            const placesRequest = {
              location: new window.google.maps.LatLng(waypoints[i].location.lat(), waypoints[i].location.lng()),
              radius: 30,
              type: ['restaurant', 'bar', 'food', 'cafe'],
            }

            placesService.nearbySearch(placesRequest, (results, status) => {
              if(status === window.google.maps.places.PlacesServiceStatus.OK) {
                let places = [...new Set(results)]
                for (const place of places) {
                  console.log('Place',place.name, place.geometry.location);
                }
              }
            });
          }

          const request = {
            origin: new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
            destination: new window.google.maps.LatLng(destination.geometry.location.lat(), destination.geometry.location.lng()),
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.WALKING,
          }
        
          directionsService.route(request, function(updatedRoute, updatedStatus) {
            if(updatedStatus === 'OK') {
              setDirectionsDisplay(new window.google.maps.DirectionsRenderer({
                map: map,
                directions: updatedRoute,
                preserveViewport: true
              }));
              directionsDisplay.set('directions', null);  
            }
          });
        } else {
           window.alert('Directions request failed due to ' + status);
          }
      });

  }, [destination]);


  return (
    <section>
    <form className='autocomplete-wrapper' onSubmit={getChatCompletion}>
        <input type='text' ref={searchInput} />
    </form>
      <div ref={googleMapRef} style={{ width: '100vw', height: '100vh' }}></div>
    </section>
  );
}

export default App;









