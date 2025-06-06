export default class City {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.connections = new Set();
  }

  addConnection(city) {
    if (city instanceof City && city !== this) {
      this.connections.add(city);
      city.connections.add(this);
    }
  }

  removeConnection(city) {
    if (this.connections.has(city)) {
      this.connections.delete(city);
      city.connections.delete(this);
    }
  }

  getConnections() {
    return Array.from(this.connections);
  }
}
