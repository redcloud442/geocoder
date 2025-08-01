export type ManualAddress = {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  

  export type Payload = {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
    fullAddress?: string;
    isVerified: boolean;
    lat?: number;
    lng?: number;
  };
  
  