// constants.js

// Posizionamento delle città
export const CITY_START_X = 200;
export const CITY_START_Y = 200;
export const CITY_SPACING = 300;
export const CITY_RADIUS = 80;
export const CITY_COLOR = "#add8e6";
export const CITY_STROKE = "#333";

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
export const PACKAGE_OFFSET_X = 10;  // Spazio tra il place e i pacchi
export const PACKAGE_LABEL_OFFSET_X = 18;  // Spazio etichetta pacco
export const PACKAGE_LABEL_OFFSET_Y = 4;
export const PACKAGE_OFFSET_Y = 7; // Offset verticale pacchi
export const PACKAGE_RECT_OFFSET_X = 15; // Offset x per rect
export const PACKAGE_RECT_OFFSET_Y = 7;  // Offset y per rect

export const TRUCK_SIZE = 25;
export const TRUCK_COLOR = "#ff69b4";
export const TRUCK_STROKE = "#333";
export const TRUCK_LABEL_FONT_SIZE = "8px";
export const TRUCK_OFFSET_X = 10;  // Spazio tra il place e i trucks
export const TRUCK_LABEL_OFFSET_X = 38;
export const TRUCK_LABEL_OFFSET_Y = 4;
export const TRUCK_OFFSET_Y = 7;

// Zoom
export const ZOOM_MIN_SCALE = 0.5;
export const ZOOM_MAX_SCALE = 5;

// Durata animazioni
export const ANIMATION_DURATION = 1000;

export const PLACE_IMAGE_WIDTH = 40;
export const PLACE_IMAGE_HEIGHT = 40;

export const IMAGE_PATHS = {
  PLACE: "https://png.pngtree.com/png-vector/20230428/ourmid/pngtree-location-point-icon-on-map-vector-png-image_6735196.png",
  PACKAGE: "https://cdn.pixabay.com/photo/2024/06/26/23/36/package-8856091_1280.png",
  TRUCK: "https://static.vecteezy.com/system/resources/thumbnails/027/182/338/small_2x/trailler-truck-isolated-on-a-transparent-background-png.png"
};

export const IMAGE_SIZES = {
  PLACE_WIDTH: 40,
  PLACE_HEIGHT: 40,
  PACKAGE_SIZE: 25,
  TRUCK_SIZE: 35
};