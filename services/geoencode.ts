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
