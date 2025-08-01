export const handleFetch = async (address: string) => {
  try {
    const res = await fetch(
      `/api/geoencode?address=${encodeURIComponent(address)}`
    );
    const data = await res.json();

    if (!data) {
      throw new Error("Failed to fetch address");
    }

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const handleReverseGeocode = async (
  latitude: number,
  longitude: number
) => {
  try {
    const res = await fetch(`/api/geoencode/user-location`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
    const data = await res.json();

    if (!data) {
      throw new Error("Failed to fetch address");
    }

    return data;
  } catch (error) {
    console.error(error);
  }
};
