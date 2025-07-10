import Package from './Package.js';
import Place from './Place.js';
import * as constants from "../constants.js";

export default class Truck {
  constructor(id, name, location = null, subtype = constants.VEHICLE_SUBTYPES.TRUCK, gasoline = null, capacity = null) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.packages = [];
    this.subtype = subtype;
    this.gasoline = gasoline; // Livello di carburante (0-100)
    this.maxGasoline = 100;   // Capacità massima
    this.initialGasoline = gasoline; // Salva il valore iniziale per riferimento
    this.capacity = capacity; // Salva il valore iniziale per riferimento
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

 // Controlla se la gasoline è stata inizializzata
  hasGasoline() {
    return this.gasoline !== null && this.gasoline !== undefined;
  }

  setGasoline(amount) {
    if (this.hasGasoline()) {
      this.gasoline = Math.max(0, Math.min(this.maxGasoline, amount));
    }
  }

  addGasoline(amount) {
    if (this.hasGasoline()) {
      this.setGasoline(this.gasoline + amount);
    }
  }

  consumeGasoline(amount) {
    if (this.hasGasoline()) {
      this.setGasoline(this.gasoline - amount);
    }
  }

  getGasolinePercentage() {
    if (!this.hasGasoline()) return 0;
    return (this.gasoline / this.maxGasoline) * 100;
  }

  // Inizializza la gasoline se non è stata ancora impostata
  initializeGasoline(amount) {
    if (!this.hasGasoline()) {
      this.gasoline = amount;
      this.initialGasoline = amount;
    }
  }

    // Nuovi metodi per gestione capacità
  hasCapacity() {
    return this.capacity !== null && this.capacity !== undefined;
  }

  // Inizializza la capacità se non è stata ancora impostata
  initializeCapacity(amount) {
    if (!this.hasCapacity()) {
      this.capacity = amount;
    }
    console.log(`inizializzo la  capacity ad ${this.capacity}`)
  }
}