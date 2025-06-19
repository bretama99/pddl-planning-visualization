// constants.js

import { axisRight } from "d3";

// Posizionamento delle città
export const CITY_START_X = 200;
export const CITY_START_Y = 200;
export const CITY_SPACING = 300;
export const CITY_RADIUS = 80;
export const CITY_COLOR = "#add8e6";
export const CITY_STROKE = "#333";
export const CITY_LABEL_OFFSET_Y = 50; // Offset verticale per il testo delle città

// Posizionamento dei luoghi (places)
export const PLACE_RADIUS = 15;
export const PLACE_COLOR = "#90ee90";
export const PLACE_STROKE = "#333";
export const PLACE_LABEL_FONT_SIZE = "10px";
export const PLACE_LABEL_OFFSET_Y = 30;

// Dimensioni per pacchi e camion
export const SIDE_LENGTH = 50;
export const PACKAGE_SIZE = 25;
export const PACKAGE_COLOR = "#ffa500";
export const PACKAGE_STROKE = "#333";
export const PACKAGE_LABEL_FONT_SIZE = "8px";
export const PACKAGE_OFFSET_X = 10;
export const PACKAGE_LABEL_OFFSET_X = 18;
export const PACKAGE_LABEL_OFFSET_Y = 4;
export const PACKAGE_OFFSET_Y = 7;
export const PACKAGE_RECT_OFFSET_X = 15;
export const PACKAGE_RECT_OFFSET_Y = 7;

export const TRUCK_SIZE = 25;
export const TRUCK_COLOR = "#ff69b4";
export const TRUCK_STROKE = "#333";
export const TRUCK_LABEL_FONT_SIZE = "8px";
export const TRUCK_OFFSET_X = 10;
export const TRUCK_LABEL_OFFSET_X = 38;
export const TRUCK_LABEL_OFFSET_Y = 4;
export const TRUCK_OFFSET_Y = 7;
export const AIRPLANE_OFFSET_Y = 7;

// Zoom
export const ZOOM_MIN_SCALE = 0.5;
export const ZOOM_MAX_SCALE = 5;

// Durata animazioni
export const MAX_ANIMATION_DURATION = 20000;
export const MIN_ANIMATION_DURATION = 1000;

// Immagini
export const PLACE_IMAGE_WIDTH = 40;
export const PLACE_IMAGE_HEIGHT = 40;

export const IMAGE_PATHS = {
  PLACE: "https://cdn-icons-png.flaticon.com/512/1692/1692037.png",
  PACKAGE: "https://cdn.pixabay.com/photo/2024/06/26/23/36/package-8856091_1280.png",
  TRUCK: "https://static.vecteezy.com/system/resources/thumbnails/027/182/338/small_2x/trailler-truck-isolated-on-a-transparent-background-png.png",
  AIRPLANE: "https://static.vecteezy.com/system/resources/previews/026/773/766/non_2x/plane-with-ai-generated-free-png.png",
  GAS_STATION: "https://cdn-icons-png.flaticon.com/512/5900/5900376.png",
  AIRPORT: "https://cdn-icons-png.flaticon.com/512/8382/8382446.png",
  CITY: "https://mappemondo.com/italy/city/milan/milan-street-map-max.jpg"
};

export const IMAGE_SIZES = {
  PLACE_WIDTH: 40,
  PLACE_HEIGHT: 40,
  PACKAGE_SIZE: 25,
  TRUCK_SIZE: 35
};

// Subtypes dei Place
export const PLACE_SUBTYPE_LOCATION = "location";
export const PLACE_SUBTYPE_GASSTATION = "gasstation";
export const PLACE_SUBTYPE_AIRPORT = "airport";

// Subtypes dei Truck/Airplane
export const VEHICLE_SUBTYPES = {
  TRUCK: "truck",
  AIRPLANE: "airplane"
};

// Mappa immagine per ciascun subtype di veicolo
export const VEHICLE_IMAGE_PATHS = {
  [VEHICLE_SUBTYPES.TRUCK]: IMAGE_PATHS.TRUCK,
  [VEHICLE_SUBTYPES.AIRPLANE]: IMAGE_PATHS.AIRPLANE
};

// Mappa dimensioni per ciascun subtype di veicolo
export const VEHICLE_IMAGE_SIZES = {
  [VEHICLE_SUBTYPES.TRUCK]: {
    width: IMAGE_SIZES.TRUCK_SIZE,
    height: IMAGE_SIZES.TRUCK_SIZE
  },
  [VEHICLE_SUBTYPES.AIRPLANE]: {
    width: IMAGE_SIZES.TRUCK_SIZE,
    height: IMAGE_SIZES.TRUCK_SIZE
  }
};

export const AIRPLANE_SPACING_FACTOR = 1.8; // o 1.5, dipende da quanto spazio vuoi


export const GASOLINE_BAR = {
  WIDTH: 30,
  HEIGHT: 4,
  BACKGROUND_COLOR: '#333',
  FILL_COLOR: '#4CAF50',
  LOW_FUEL_COLOR: '#FF5722',  // Rosso quando benzina < 30%
  OFFSET_Y: -20, // Posizione sopra il truck (regola in base al tuo layout)
  BORDER_RADIUS: 2
};