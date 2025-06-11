<template>
  <button @click="moveTruckToPos('tru1', 'pos2')">Sposta tru1 in pos2</button>
  <button @click="moveTruckToPos('tru1', 'pos3')">Sposta tru1 in pos3</button>
  <button @click="moveTruckToPos('tru1', 'pos4')">Sposta tru1 in pos4</button>
  <button
    @click="
      () => {
        loadPackageOnTruck('obj11', 'tru1');
        animatePackageToTruck('obj11', 'tru1');
      }
    "
  >
    Carica e anima obj11 su tru1
  </button>
  <button @click="testUnloadPackage">Scarica pacco di test</button>


  <button @click="playSteps">▶️ Play Steps</button>

  <div ref="container" class="graph-container">
    <svg
      ref="svg"
      :width="width"
      :height="height"
      style="border: 1px solid #ccc"
      @click="handleSvgClick"
    ></svg>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as constants from "../constants.js";

export default {
  name: "MapVisualizer",
  props: {
    cities: Object,
    places: Object,
    trucks: Object,
    packages: Object,
    steps: Array,
    distances: Array,
  },
  data() {
    return {
      width: 800,
      height: 600,
      zoom: null,
      positions: {
        cities: {},
        places: {},
        trucks: {},
        packages: {},
      },
    };
  },
  mounted() {
    this.initPositions();
    this.initializeDistances();
    this.drawGraph();
  },
  watch: {
    distances: {
      handler(newDistances) {
        if (newDistances && newDistances.length > 0) {
          this.initializeDistances();
        }
      },
      immediate: true
    },
    cities: {
      handler() {
        this.initPositions();
        this.drawGraph();
      },
      deep: true,
    },
    places: {
      handler() {
        this.initPositions();
        this.drawGraph();
      },
      deep: true,
    },
    trucks: {
      handler() {
        this.drawGraph();
      },
      deep: true,
    },
    packages: {
      handler() {
        this.drawGraph();
      },
      deep: true,
    },
  },
  methods: {
    initPositions() {
      const cityIds = Object.keys(this.cities);
      const citySpacing = 300;
      cityIds.forEach((cityId, i) => {
        const city = this.cities[cityId];
        if (!this.positions.cities[city.name]) {
          this.positions.cities[city.name] = {
            x: 200 + i * citySpacing,
            y: 200,
          };
        }
      });

      const radius = 80;
      Object.values(this.places).forEach((place) => {
        if (!this.positions.places[place.id]) {
          const cityPos = this.positions.cities[place.city.name];
          if (cityPos) {
            const placesInCity = Object.values(this.places).filter(
              (p) => p.city.name === place.city.name
            );
            const idx = placesInCity.findIndex((p) => p.id === place.id);
            const numPlaces = placesInCity.length;
            const angle = ((2 * Math.PI) / numPlaces) * idx;
            this.positions.places[place.id] = {
              x: cityPos.x + radius * Math.cos(angle),
              y: cityPos.y + radius * Math.sin(angle),
            };
            console.log(
              `Posizione per il luogo ${place.name}:`,
              this.positions.places[place.id]
            );
          }
        }
      });
    },

    initializeDistances() {
      // Ora puoi usare this.distances direttamente
      console.log('Distanze ricevute:', this.distances);
      
      // Crea una mappa delle distanze per accesso rapido
      this.distanceMap = new Map();
      this.distances.forEach(dist => {
        this.distanceMap.set(`${dist.from}-${dist.to}`, dist.distance);
        // Aggiungi anche la direzione opposta se non esiste
        if (!this.distanceMap.has(`${dist.to}-${dist.from}`)) {
          this.distanceMap.set(`${dist.to}-${dist.from}`, dist.distance);
        }
      });
    },
    drawGraph() {
      const svg = d3.select(this.$refs.svg);
      svg.selectAll("*").remove();

      this.zoom = d3
        .zoom()
        .scaleExtent([constants.ZOOM_MIN_SCALE, constants.ZOOM_MAX_SCALE])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(this.zoom);
      const g = svg.append("g");

      // CITTÀ
      Object.entries(this.cities).forEach(([cityId, city], i) => {
        const pos = this.positions.cities[city.name];
        if (!pos) return;

        const cityGroup = g.append("g").attr("id", `city-${city.name}`);

        cityGroup
          .append("circle")
          .attr("cx", pos.x)
          .attr("cy", pos.y)
          .attr("r", constants.CITY_RADIUS)
          .attr("fill", constants.CITY_COLOR)
          .attr("stroke", constants.CITY_STROKE);

        cityGroup
          .append("text")
          .attr("x", pos.x)
          .attr("y", pos.y)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(city.name);
      });

      // LUOGHI (places)
      Object.values(this.places).forEach((place) => {
        const pos = this.positions.places[place.id];
        if (!pos) return;

        const placeGroup = g.append("g").attr("id", `place-${place.id}`);

        placeGroup
  .append("image")
  .attr("x", pos.x - constants.PLACE_IMAGE_WIDTH / 2)  // centra l'immagine
  .attr("y", pos.y - constants.PLACE_IMAGE_HEIGHT / 2)
  .attr("width", constants.IMAGE_SIZES.PLACE_WIDTH)
  .attr("height", constants.IMAGE_SIZES.PLACE_HEIGHT)
  .attr("href", constants.IMAGE_PATHS.PLACE);

        console.log(`constant: ${constants.PLACE_LABEL_OFFSET_Y} and pos`, pos);
        placeGroup
          .append("text")
          .attr("x", pos.x)
          .attr("y", pos.y + constants.PLACE_LABEL_OFFSET_Y)
          .attr("text-anchor", "middle")
          .attr("font-size", constants.PLACE_LABEL_FONT_SIZE)
          .text(place.name);

        // Pacchi (a sinistra)
        const packagesHere = this.getPackagesInPlace(place);
        const numPackages = packagesHere.length;
        packagesHere.forEach((pkg, k) => {
  const { x: pkgX, y: pkgY } = this.getPackagePositionInPlace(place, k, numPackages);
  
  const pkgGroup = g.append("g")
    .attr("id", `package-${pkg.name}`)
    .attr("transform", `translate(${pkgX - constants.PACKAGE_SIZE}, ${pkgY - constants.PACKAGE_SIZE / 2})`); // ← AGGIUNGI QUESTO

pkgGroup
  .append("image")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", constants.IMAGE_SIZES.PACKAGE_SIZE)
  .attr("height", constants.IMAGE_SIZES.PACKAGE_SIZE)
  .attr("href", constants.IMAGE_PATHS.PACKAGE);

  pkgGroup
    .append("text")
    .attr("x", -constants.PACKAGE_LABEL_OFFSET_X)  // ← CAMBIA: relativo al gruppo
    .attr("y", constants.PACKAGE_SIZE / 2 + constants.PACKAGE_LABEL_OFFSET_Y)  // ← CAMBIA: relativo al gruppo
    .attr("text-anchor", "end")
    .attr("font-size", constants.PACKAGE_LABEL_FONT_SIZE)
    .text(pkg.name);

  // Aggiorna posizione (quella assoluta per riferimento)
  this.positions.packages[pkg.id] = {
    x: pkgX - constants.PACKAGE_SIZE,
    y: pkgY - constants.PACKAGE_SIZE / 2,
  };
});

        // Camion (a destra)
        const trucksHere = this.getTrucksInPlace(place);
        const numTrucks = trucksHere.length;
        trucksHere.forEach((truck, k) => {
          const { x: truckX, y: truckY } = this.getTruckPositionInPlace(
            place,
            k,
            numTrucks
          );

          console.log(`${truckY - constants.TRUCK_OFFSET_Y}`);
          const truckGroup = g
            .append("g")
            .attr("id", `truck-${truck.name}`)
            .attr(
              "transform",
              `translate(${truckX}, ${truckY - constants.TRUCK_OFFSET_Y})`
            );

          truckGroup
  .append("image")
  .attr("x", 0)
  .attr("y", -constants.TRUCK_SIZE / 2)
  .attr("width", constants.IMAGE_SIZES.TRUCK_SIZE)
  .attr("height", constants.IMAGE_SIZES.TRUCK_SIZE)
  .attr("href", constants.IMAGE_PATHS.TRUCK);

          truckGroup
            .append("text")
            .attr("x", constants.TRUCK_LABEL_OFFSET_X)
            .attr("y", constants.TRUCK_LABEL_OFFSET_Y)
            .attr("text-anchor", "start")
            .attr("font-size", constants.TRUCK_LABEL_FONT_SIZE)
            .text(truck.name);

          // Aggiorna posizione
          this.positions.trucks[truck.id] = {
            x: truckX,
            y: truckY - constants.TRUCK_OFFSET_Y,
          };
        });
      });
    },
    getPlaceIdByName(name) {
      const placeEntry = Object.values(this.places).find(
        (p) => p.name === name
      );
      return placeEntry ? placeEntry.id : null;
    },
    animateTruck(truckName, newX, newY, distance = 0) {
  return new Promise((resolve) => {
    const truckGroup = d3.select(`#truck-${truckName}`);
    if (truckGroup.empty()) {
      resolve();
      return;
    }

    const truckId = this.getTruckIdByName(truckName);
    if (!this.positions.trucks[truckId]) {
      console.error(
        `Posizione per il truck con ID ${truckId} non trovata!`
      );
      resolve();
      return;
    }

    // Calcola la durata dell'animazione basata sulla distanza
    const duration = this.calculateAnimationDuration(distance);

    console.log(
      `Animazione del truck ${truckName} da (${this.positions.trucks[truckId].x},${this.positions.trucks[truckId].y}) a (${newX}, ${newY}) con durata ${duration}ms (distanza: ${distance})`
    );

    truckGroup
      .transition()
      .duration(duration) // Usa la durata calcolata
      .attr("transform", `translate(${newX}, ${newY})`)
      .on("end", () => {
        // Aggiorna la posizione nello stato
        console.log(
          "Transform finale nel DOM:",
          truckGroup.attr("transform")
        );
        this.positions.trucks[truckId].x = newX;
        this.positions.trucks[truckId].y = newY;
        console.log(
          `Posizione aggiornata per il truck ${truckName}:`,
          this.positions.trucks[truckId]
        );
        this.syncPackagePositionsOnTruck(truckName);

        resolve(); // Risolvi la Promise quando l'animazione è completata
      });
  });
}
,
    getTruckIdByName(name) {
      const truckEntry = Object.values(this.trucks).find(
        (t) => t.name === name
      );
      return truckEntry ? truckEntry.id : null;
    },
    getPackageIdByName(name) {
      const pkg = Object.values(this.packages).find((p) => p.name === name);
      return pkg ? pkg.id : null;
    },
  calculateDistanceBetweenPlaces(fromPlace, toPlace) {
      // Se sono nella stessa città, distanza 0 (movimento locale)
      if (fromPlace.city.id === toPlace.city.id) {
        return 0;
      }

      const fromCityName = fromPlace.city.name;
      const toCityName = toPlace.city.name;
      
      // Usa la mappa delle distanze per accesso rapido
      const distance = this.distanceMap.get(`${fromCityName}-${toCityName}`) || 
                      this.distanceMap.get(`${toCityName}-${fromCityName}`);
      
      return distance || 0; // Valore di default se non trovata
    },  
    async moveTruckToPos(truckName, placeName) {
  const truckEntry = Object.values(this.trucks).find(
    (t) => t.name === truckName
  );
  if (!truckEntry) return;

  const newPlaceEntry = Object.values(this.places).find(
    (p) => p.name === placeName
  );
  if (!newPlaceEntry) return;

  const oldPlaceId = truckEntry.location.id;
  const oldPlace = truckEntry.location;

  // Calcola la distanza tra le città PRIMA di aggiornare la location
  const distance = this.calculateDistanceBetweenPlaces(oldPlace, newPlaceEntry);

  // Aggiorna la location del truck PRIMA di ricalcolare
  truckEntry.location = newPlaceEntry;

  // Array di Promise per aspettare tutte le animazioni
  const promises = [];

  // Ricalcola e riposiziona tutti i truck nel posto di origine (se diverso)
  if (oldPlaceId !== newPlaceEntry.id) {
    promises.push(this.repositionTrucksInPlace(oldPlaceId));
  }

  // Ricalcola e riposiziona tutti i truck nel posto di destinazione
  // Passa la distanza per calcolare la durata dell'animazione
  promises.push(this.repositionTrucksInPlace(newPlaceEntry.id, distance, truckName));

  // Aspetta che tutte le animazioni siano completate
  await Promise.all(promises);
}
    ,

    async repositionTrucksInPlace(placeId, distance = 0, movingTruckName = null) {
  const placePos = this.positions.places[placeId];
  if (!placePos) return;

  const trucksHere = this.getTrucksInPlace(this.getPlaceById(placeId));
  const numTrucks = trucksHere.length;

  // Crea un array di Promise per tutte le animazioni
  const animationPromises = trucksHere.map((truck, k) => {
    const { x: truckX, y: truckY } = this.getTruckPositionInPlace(
      this.getPlaceById(placeId),
      k,
      numTrucks
    );

    // Calcola la durata dell'animazione solo per il truck che si sta muovendo
    const animationDistance = (truck.name === movingTruckName) ? distance : 0;

    // Restituisce la Promise dell'animazione
    return this.animateTruck(truck.name, truckX, truckY, animationDistance);
  });

  // Aspetta che tutte le animazioni siano completate
  await Promise.all(animationPromises);
},
    async processDriveTruckStep(actionPart) {
  const tokens = actionPart.replace(/[()]/g, '').split(' ');
  const truckName = tokens[1];   // secondo parametro
  const fromPlace = tokens[2];   // terzo parametro  
  const toPlace = tokens[3];     // quarto parametro

  console.log(`🚛 Spostamento: Truck ${truckName} da ${fromPlace} a ${toPlace}`);
  
  await this.moveTruckToPos(truckName, toPlace);
  
  console.log(`✅ Movimento completato: Truck ${truckName} ora in ${toPlace}`);
    },
async processLoadTruckStep(actionPart) {
  const tokens = actionPart.replace(/[()]/g, '').split(' ');
  const packageName = tokens[1];  // secondo parametro
  const truckName = tokens[2];    // terzo parametro
  const placeName = tokens[3];    // quarto parametro

  console.log(`📦⬆️ Caricamento: Package ${packageName} su truck ${truckName} in ${placeName}`);
  
  await this.loadPackageOnTruck(packageName, truckName);
  
  console.log(`✅ Caricamento completato: Package ${packageName} caricato su truck ${truckName}`);
    },
async processUnloadTruckStep(actionPart) {
  const tokens = actionPart.replace(/[()]/g, '').split(' ');
  const packageName = tokens[1];  // secondo parametro
  const truckName = tokens[2];    // terzo parametro
  const placeName = tokens[3];    // quarto parametro

  console.log(`📦⬇️ Scaricamento: Package ${packageName} da truck ${truckName} in ${placeName}`);
  
  await this.unloadPackageFromTruck(packageName, truckName);
  
  console.log(`✅ Scaricamento completato: Package ${packageName} scaricato da truck ${truckName} in ${placeName}`);
},
    async processStepsAndMoveTrucks(steps) {
  for (const step of steps) {
    const actionPart = step.split(': ')[1].trim();

    if (actionPart.startsWith('(drive-truck')) {
      await this.processDriveTruckStep(actionPart);
    } else if (actionPart.startsWith('(load-truck')) {
      await this.processLoadTruckStep(actionPart);
    } else if (actionPart.startsWith('(unload-truck')) {
      await this.processUnloadTruckStep(actionPart);
    } else {
      console.warn(`Tipo di step non riconosciuto: ${actionPart}`);
    }
    
    // Piccola pausa tra un'azione e l'altra
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('🎉 Tutti i movimenti e operazioni completati!');
},
    handleSvgClick(event) {
      // Ottieni il punto del clic rispetto all'SVG
      const svg = event.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;

      // Trasforma in coordinate SVG (considerando eventuali trasformazioni/zoom)
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

      console.log(`Coordinate SVG: x=${svgP.x}, y=${svgP.y}`);
    },
    playSteps() {
      if (this.steps && this.steps.length > 0) {
        this.processStepsAndMoveTrucks(this.steps);
      } else {
        console.warn("Non ci sono steps da processare!");
      }
    },
    async loadPackageOnTruck(packageName, truckName) {
  return new Promise((resolve) => {
    const pkg = Object.values(this.packages).find(p => p.name === packageName);
    const truck = Object.values(this.trucks).find(t => t.name === truckName);

    if (!pkg || !truck) {
      console.warn("Pacco o truck non trovato!");
      resolve();
      return;
    }

    // Verifica che le location coincidano
    if (!pkg.location || !truck.location || pkg.location.id !== truck.location.id) {
      console.warn(`Impossibile caricare: il pacco ${packageName} e il truck ${truckName} non sono nella stessa location!`);
      resolve();
      return;
    }

    // Prima fai l'animazione
    this.animatePackageToTruckAsync(packageName, truckName, () => {
      // Poi aggiorna la logica nel callback dell'animazione
      if (!truck.packages) {
        truck.packages = [];
      }
      truck.packages.push(pkg);
      pkg.location = null;

      console.log(`Package ${packageName} caricato su truck ${truckName}.`);
      resolve();
    });
  });
},
    animatePackageToTruckAsync(packageName, truckName, callback) {
  // 1️⃣ Trova gli ID
  const truckId = this.getTruckIdByName(truckName);
  const packageId = this.getPackageIdByName(packageName);

  if (truckId === null || packageId === null) {
    console.error("Impossibile trovare truck o package!");
    if (callback) callback();
    return;
  }

  // 2️⃣ Prendi le posizioni
  const truckPos = this.positions.trucks[truckId];
  const packagePos = this.positions.packages[packageId];

  if (!truckPos || !packagePos) {
    console.error("Posizioni mancanti per truck o package!");
    if (callback) callback();
    return;
  }

  // 3️⃣ Fai animazione usando D3.js
  const pkgGroup = d3.select(`#package-${packageName}`);
  pkgGroup
    .transition()
    .duration(1000)
    .attr("transform", `translate(${truckPos.x}, ${truckPos.y})`)
    .on("end", () => {
      // Alla fine dell'animazione: rimuovi pacchetto dalla mappa
      pkgGroup.style("display", "none");
      console.log(`Il pacchetto ${packageName} è stato caricato nel truck ${truckName}.`);
      
      if (callback) callback();
    });
}
,
    async unloadPackageFromTruck(packageName, truckName) {
  return new Promise((resolve) => {
    const truck = Object.values(this.trucks).find(t => t.name === truckName);
    const pkg = Object.values(this.packages).find(p => p.name === packageName);

    if (!truck || !pkg) {
      console.warn("Truck o package non trovato!");
      resolve();
      return;
    }

    if (truck.packages && truck.packages.includes(pkg)) {
      // Prima fai l'animazione
      this.animatePackageUnloadAsync(packageName, truckName, () => {
        // Poi aggiorna la logica nel callback dell'animazione
        truck.unloadPackage(pkg);
        pkg.setLocation(truck.location);

        console.log(`Pacco ${packageName} scaricato da ${truckName} in ${truck.location.name}`);
        resolve();
      });
    } else {
      console.log(`Errore: Il pacco ${packageName} non si trova nel camion ${truckName}`);
      resolve();
    }
  });
},
    animatePackageUnloadAsync(packageName, truckName, callback) {
  const truckId = this.getTruckIdByName(truckName);
  const truckPos = this.positions.trucks[truckId];
  const pkgId = this.getPackageIdByName(packageName);

  // Il luogo di scarico è la location del camion
  const truck = Object.values(this.trucks).find(t => t.name === truckName);
  const placeId = truck.location.id;
  
  // Calcola la posizione finale del package nel place
  const place = Object.values(this.places).find(p => p.id === placeId);
  const packagesInPlace = Object.values(this.packages).filter(p => p.location && p.location.id === placeId);
  const packageIndex = packagesInPlace.length; // Sarà l'ultimo
  const { x: finalX, y: finalY } = this.getPackagePositionInPlace(place, packageIndex, packageIndex + 1);

  const pkgGroup = d3.select(`#package-${packageName}`);
  if (!pkgGroup.empty()) {
    pkgGroup.style("display", "block");
    pkgGroup
      .transition()
      .duration(1000)
      .attr("transform", `translate(${finalX - constants.PACKAGE_SIZE}, ${finalY - constants.PACKAGE_SIZE / 2})`)
      .style("opacity", 1)
      .on("end", () => {
        // Aggiorna la posizione
        this.positions.packages[pkgId] = {
          x: finalX - constants.PACKAGE_SIZE,
          y: finalY - constants.PACKAGE_SIZE / 2,
        };
        
        // Ricalcola solo le posizioni dei package in quel place
        this.repositionPackagesInPlace(placeId);
        
        if (callback) callback();
      });
  } else {
    if (callback) callback();
  }
    },
calculateAnimationDuration(distance) {
      const MAX_DURATION = 10000; // Durata massima in ms
      const MIN_DURATION = 1000; // Durata minima in ms

      if (distance === 0) {
        return MIN_DURATION; // Movimento locale nella stessa città
      }

      const calculatedDuration = (distance * MIN_DURATION);
      return Math.min(Math.max(calculatedDuration, MIN_DURATION), MAX_DURATION);
    },
repositionPackagesInPlace(placeId) {
  const place = Object.values(this.places).find(p => p.id === placeId);
  const packagesHere = Object.values(this.packages).filter(p => p.location && p.location.id === placeId);
  
  
  packagesHere.forEach((pkg, k) => {
    const { x: pkgX, y: pkgY } = this.getPackagePositionInPlace(place, k, packagesHere.length);
    const finalX = pkgX - constants.PACKAGE_SIZE;
    const finalY = pkgY - constants.PACKAGE_SIZE / 2;
    
    const pkgGroup = d3.select(`#package-${pkg.name}`);
    if (!pkgGroup.empty()) {
      pkgGroup.transition()
        .duration(500)
        .attr("transform", `translate(${finalX}, ${finalY})`);
      
      this.positions.packages[pkg.id] = { x: finalX, y: finalY };
    }
  });
},
    unloadPackage(packageName, truckName) {
      this.unloadPackageFromTruck(packageName, truckName);
      this.animatePackageUnload(packageName, truckName);
    },
    getTrucksInPlace(place) {
      return Object.values(this.trucks).filter(
        (truck) => truck.location.id === place.id
      );
    },
    getPackagesInPlace(place) {
      return Object.values(this.packages).filter(
        (pkg) => pkg.location.id === place.id
      );
    },
    getPlaceById(placeId) {
      return Object.values(this.places).find((place) => place.id === placeId);
    },
    getPackagePositionInPlace(place, k, numPackages) {
      const pos = this.positions.places[place.id];
      const halfSide = constants.SIDE_LENGTH / 2;

      const pkgY =
        pos.y - halfSide + ((k + 1) * constants.SIDE_LENGTH) / (numPackages + 1);
      const pkgX = pos.x - halfSide - constants.PACKAGE_OFFSET_X;

      return {
        x: pkgX,
        y: pkgY,
      };
    },
    getTruckPositionInPlace(place, k, numTrucks) {
      const pos = this.positions.places[place.id];
      const halfSide = constants.SIDE_LENGTH / 2; // ← Cambiato

      const truckY =
        pos.y - halfSide + ((k + 1) * constants.SIDE_LENGTH) / (numTrucks + 1); // ← Cambiato
      const truckX = pos.x + halfSide + constants.TRUCK_OFFSET_X;

      return { x: truckX, y: truckY };
    },
      testUnloadPackage() {
    // Usa dei valori di esempio per il test
    const packageName = "obj11"; // Modifica con un nome esistente
    const truckName = "tru1";  // Modifica con un nome esistente
    this.unloadPackageFromTruck(packageName, truckName);
    },
  syncPackagePositionsOnTruck(truckName) {
  const truck = Object.values(this.trucks).find(t => t.name === truckName);
  const truckId = this.getTruckIdByName(truckName);
  const truckPos = this.positions.trucks[truckId];
  
  truck.packages.forEach(pkg => {
    this.positions.packages[pkg.id] = { ...truckPos };
    
    // Aggiorna anche visivamente se nascosto
    const pkgGroup = d3.select(`#package-${pkg.name}`);
    if (!pkgGroup.empty() && pkgGroup.style("display") === "none") {
      pkgGroup.attr("transform", `translate(${truckPos.x}, ${truckPos.y})`);
    }
  });
    },

  },
  
};
</script>

<style scoped>
.graph-container {
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
