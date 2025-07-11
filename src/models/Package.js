import Place from './Place.js';

export default class Package {
  constructor(id, name, location = null) {
    this.id = id;
    this.name = name;
    this.location = location; // 👈 Nuovo campo: luogo in cui si trova
  }

  setLocation(location) {
    if (location instanceof Place) {
      this.location = location;
    }
  }
}
