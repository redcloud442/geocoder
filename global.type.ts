declare global {
  interface Window {
    autocomplete: google.maps.places.Autocomplete;
    google: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => unknown;
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: unknown
          ) => unknown;
        };
      };
    };
  }

  interface IntrinsicElements {
    "gmpx-placeautocomplete": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "input-id": string;
        placeholder?: string;
        "aria-label"?: string;
        onPlaceSelect?: (e: CustomEvent) => void;
      },
      HTMLElement
    >;
  }
}

export {};
