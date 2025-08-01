
export const reverseGeocodeAndUpdate = async (coords: { lat: number; lng: number }) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const results = await new Promise<google.maps.GeocoderResult[] | null>((resolve, reject) => {
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      const fullAddress = results?.[0].formatted_address || '';


     return fullAddress;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
  };
