import Package from './Package.js';
import Place from './Place.js';

export default class Truck {
  constructor(id, name, location = null) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.packages = [];
  }

  setLocation(location) {
    if (location instanceof Place) {
      this.location = location;
    }
  }

  loadPackage(pkg) {
    if (pkg instanceof Package) {
      this.packages.push(pkg);
    }
  }

  unloadPackage(pkg) {
    const index = this.packages.indexOf(pkg);
    if (index !== -1) {
      this.packages.splice(index, 1);
    }
  }

  listPackages() {
    return this.packages;
  }
}
