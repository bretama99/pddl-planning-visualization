export default class Place {
  constructor(id, name, city = null, subtype = 'location') {
    this.id = id;
    this.name = name;
    this.city = city;         // oggetto City o null
    this.subtype = subtype;   // 'location' o 'gas-station'
  }
}
