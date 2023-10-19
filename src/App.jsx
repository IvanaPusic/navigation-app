import { useEffect, useRef, useState } from 'react';

function App() {
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [destination, setDestination] = useState({
    lat: 45.7957,
    lng: 15.96646,
  });
  // const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const googleMapRef = useRef(null);
  const searchInput = useRef(null);
  // get user geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) =>
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      );
    }
  }, []);

  // initialize map
  const initMap = () => {
    const map = new window.google.maps.Map(googleMapRef.current, {
      center: userLocation,
      zoom: 15,
    });

    const markerA = new window.google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'User location',
    });

    const autoCompleteService =
      new window.google.maps.places.AutocompleteService(searchInput.current);

    console.log('test');
    // const markerB = new window.google.maps.Marker({
    //   position: destination,
    //   map: map,
    //   title: 'destination',
    // });

    // const directionsService = new window.google.maps.DirectionsService();
    // const directionsDisplay = new window.google.maps.DirectionsRenderer();

    // directionsDisplay.setMap(map);
    // setDirectionsService(directionsService);
    // setDirectionsDisplay(directionsDisplay);
    // calculateAndDisplayRoute(
    //   directionsService,
    //   directionsDisplay,
    //   userLocation,
    //   destination
    // );
    // const distanceBetweenMarkers =
    //   window.google.maps.geometry.spherical.computeDistanceBetween(
    //     new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
    //     new window.google.maps.LatLng(destination.lat, destination.lng)
    //   );

    //   setDistance(distanceBetweenMarkers);
  };

  //  load map
  useEffect(() => {
    const script = document.createElement('script');
    if (!window.google) {
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_API_KEY}&libraries=geometry,places`;
      console.log('test2');
      script.addEventListener('load', initMap);
      document.body.appendChild(script);
    }

    return () => {
      if (window.google) {
        document.body.removeChild(script);
      }
    };
  }, [userLocation, destination]);

  // handle input
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  // console.log(searchQuery);
  // };

  // const handleInputChange = (value) => {
  //   setSearchQuery(value);
  //   if (value) {
  //     autoCompleteService.getPlacePredictions(
  //       {
  //         input: value,
  //         types: ['(regions)'], // You can specify the type of data you want (e.g., 'geocode', 'establishment', etc.)
  //       },
  //       (predictions, status) => {
  //         if (status === 'OK') {
  //           setPredictions(predictions);
  //         } else {
  //           setPredictions([]);
  //         }
  //       }
  //     );
  //   } else {
  //     setPredictions([]);
  //   }
  //   setSearchQuery(value);
  // };

  // const handleSelect = (prediction) => {
  //   setSearchQuery(prediction.description);
  //   setPredictions([]); // Clear predictions
  // };

  return (
    <section>
      {/* <Input
        destinationRef={destinationInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        ref={searchInput}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        handleSelect={handleSelect}
        setPredictions={setPredictions}
        predictions={predictions}
      /> */}
      <input type='text' ref={searchInput} />
      <div ref={googleMapRef} style={{ width: '100vw', height: '100vh' }}></div>
      {/* <Map map={googleMapRef} /> */}
      {/* <div ref={googleMapRef} style={{ width: '100%', height: '100vh' }}></div> */}
      {/* <p>Distance between points: {distance}</p> */}
    </section>
  );
}

export default App;
