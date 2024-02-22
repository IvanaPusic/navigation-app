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
  // list of historical landmarks
  const [landmarks, setLandmarks] = useState([])
 
  //Load the google maps API
  const loader = new Loader({
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places', 'routes'],
  });
  
  //Markers
  const [markers, setMarkers] = useState([]);
  //  polyline
  const [polyline, setPolyline] = useState(null);

  // Get list of historical landmarks based on users city
  const getChatCompletion = async (city) => {
    try {
      const data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": `give me a list of 10 historical landmarks in ${city} with coordinates in format of json array of objects without additional words`}],
        "temperature": 0.7
      };
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_KEY}`,
        },
        body: JSON.stringify(data)
      })
      const items = await response.json()
      console.log('items: ', JSON.parse(JSON.stringify(items.choices[0].message.content)));
      console.log(items.choices[0].message.content);
      
      setLandmarks(items.choices[0].message.content)
      localStorage.setItem(city, items.choices[0].message.content)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    // 15. START //
    let isMounted = true; 
    if(!isMounted) {
      return;
    }
    const getCityFromCoords = async (lat, lng) => {
      try {
        const city = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
        const data = await city.json();
        console.log('city data', data.results[9].address_components[0].long_name);

        const currentLandmarks = localStorage.getItem(data.results[9].address_components[0].long_name);
        console.log('landmarks from local storage', JSON.parse(currentLandmarks));

        if (currentLandmarks && isMounted) {
          setLandmarks(JSON.parse(currentLandmarks));
        } else if (isMounted) {
          await getChatCompletion(data.results[9].address_components[0].long_name);
        }

      } catch (error) {
        console.error(error);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          setCurrentPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          getCityFromCoords(position.coords.latitude, position.coords.longitude);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      isMounted = false; 
    };

  }, []);

  useEffect(() => {
    if (!currentPosition || !landmarks) {
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
        // 15. END - removed landmarks from dependency array // 
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
        
        if (!place.geometry || !place.geometry.location) {
          window.alert("No details available for input: '" + place.name + "'");
          return;
        }
        setDestination(place);

        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }
      });
    });
  }, [currentPosition]);


  useEffect(() => {
    if (!currentPosition || !destination || !landmarks || !directionsDisplay || !map) {
      return;
    }

    markers.forEach((marker) => {
      marker.setMap(null);
    });

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
        destination: new window.google.maps.LatLng(destination.geometry.location.lat(), destination.geometry.location.lng()),
        avoidTolls: true,
        avoidHighways: true,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (response, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = response.routes[0];
          const steps = route.legs.flatMap(leg => leg.steps);
          const waypoints = [];
          const radius = 300;

          landmarks.forEach((waypoint) => {
            const distances = steps.map(step => {
              return window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(waypoint.latitude, waypoint.longitude),
                new window.google.maps.LatLng(step.end_location.lat(), step.end_location.lng())
              );
            });

            const minDistance = Math.min(...distances);

            if (minDistance <= radius) {
              waypoints.push(waypoint);
            }
          });

          // 12. START //
          const placesService = new window.google.maps.places.PlacesService(map);

          waypoints.forEach((waypoint) => {
            const placesRequest = {
              location: new window.google.maps.LatLng(waypoint.latitude, waypoint.longitude),
              radius: 5,
              type: ['museum', 'park', 'church', 'point_of_interest'],
            };

            placesService.nearbySearch(placesRequest, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                let places = [...new Set(results)];
                for (const place of places) {
                  console.log('Place', place.name, place.geometry.location.lat(), place.geometry.location.lng());
                }
              }
            });
          });
          // 12. END //
          const request = {
            origin: new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
            destination: new window.google.maps.LatLng(destination.geometry.location.lat(), destination.geometry.location.lng()),
            waypoints: waypoints.map(waypoint => ({
              location: new window.google.maps.LatLng(waypoint.latitude, waypoint.longitude),
              stopover: true
            })),
            optimizeWaypoints: true, // 14. START AND END //
            travelMode: window.google.maps.TravelMode.WALKING,
          };

          directionsService.route(request, (updatedRoute, updatedStatus) => {
            if (updatedStatus === 'OK') {
              directionsDisplay.setDirections(updatedRoute);
            } else {
              window.alert('Directions request failed due to ' + updatedStatus);
            }
          });

          // 13. START //
          const mapClickListener = map.addListener('click', (event) => {
            const clickedLat = event.latLng.lat();
            const clickedLng = event.latLng.lng();

            waypoints.forEach((waypoint) => {
              const waypointLat = waypoint.latitude;
              const waypointLng = waypoint.longitude;

              const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                new window.google.maps.LatLng(clickedLat, clickedLng),
                new window.google.maps.LatLng(waypointLat, waypointLng)
              );

              if (distance <= 50) {
                console.log('Clicked waypoint:', waypoint);
              }
            });
          });

          return () => {
            window.google.maps.event.removeListener(mapClickListener);
          };
         // 13. END //
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      }
    );
  }, [currentPosition, destination, landmarks, directionsDisplay, map]);


  return (
    <section>
      <div className='input-wrapper'>
        <input type='text' ref={searchInput} />
      </div>
      <div ref={googleMapRef} style={{ width: '100vw', height: '100vh' }}></div>
    </section>
  );
}

export default App;
