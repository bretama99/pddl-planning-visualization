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
    this.drawGraph();
  },
  watch: {
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
          .append("circle")
          .attr("cx", pos.x)
          .attr("cy", pos.y)
          .attr("r", constants.PLACE_RADIUS)
          .attr("fill", constants.PLACE_COLOR)
          .attr("stroke", constants.PLACE_STROKE);

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
    .append("rect")
    .attr("x", 0)  // ← CAMBIA: coordinate relative al gruppo
    .attr("y", 0)  // ← CAMBIA: coordinate relative al gruppo
    .attr("width", constants.PACKAGE_SIZE)
    .attr("height", constants.PACKAGE_SIZE)
    .attr("fill", constants.PACKAGE_COLOR)
    .attr("stroke", constants.PACKAGE_STROKE);

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
            .append("rect")
            .attr("x", 0)
            .attr("y", -constants.TRUCK_SIZE / 2)
            .attr("width", constants.TRUCK_SIZE)
            .attr("height", constants.TRUCK_SIZE)
            .attr("fill", constants.TRUCK_COLOR)
            .attr("stroke", constants.TRUCK_STROKE);

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
    animateTruck(truckName, newX, newY) {
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

        console.log(
          `Animazione del truck ${truckName} da (${this.positions.trucks[truckId].x},${this.positions.trucks[truckId].y}) a (${newX}, ${newY})`
        );
        console.log(
          `I delta sono: (${newX - this.positions.trucks[truckId].x}, ${
            newY - this.positions.trucks[truckId].y
          })`
        );

        truckGroup
          .transition()
          .duration(1000)
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
    },
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

      // Aggiorna la location del truck PRIMA di ricalcolare
      truckEntry.location = newPlaceEntry;

      // Array di Promise per aspettare tutte le animazioni
      const promises = [];

      // Ricalcola e riposiziona tutti i truck nel posto di origine (se diverso)
      if (oldPlaceId !== newPlaceEntry.id) {
        promises.push(this.repositionTrucksInPlace(oldPlaceId));
      }

      // Ricalcola e riposiziona tutti i truck nel posto di destinazione
      promises.push(this.repositionTrucksInPlace(newPlaceEntry.id));

      // Aspetta che tutte le animazioni siano completate
      await Promise.all(promises);
    },
    async repositionTrucksInPlace(placeId) {
      const placePos = this.positions.places[placeId];
      if (!placePos) return;

      const trucksHere = this.getTrucksInPlace(this.getPlaceById(placeId));
      const numTrucks = trucksHere.length;
      const side = constants.SIDE_LENGTH;
      const halfSide = side / 2;

      // Crea un array di Promise per tutte le animazioni
      const animationPromises = trucksHere.map((truck, k) => {
        const { x: truckX, y: truckY } = this.getTruckPositionInPlace(
          this.getPlaceById(placeId),
          k,
          numTrucks
        );

        // Restituisce la Promise dell'animazione
        return this.animateTruck(truck.name, truckX, truckY);
      });

      // Aspetta che tutte le animazioni siano completate
      await Promise.all(animationPromises);
    },
    async processStepsAndMoveTrucks(steps) {
      for (const step of steps) {
        // step ad esempio: "1.0: (drive-truck tru1 pos1 pos2 cit1)"
        const actionPart = step.split(": ")[1].trim();

        if (actionPart.startsWith("(drive-truck")) {
          const tokens = actionPart.replace(/[()]/g, "").split(" ");
          const truckName = tokens[1];
          const fromPlace = tokens[2];
          const toPlace = tokens[3];

          console.log(
            `🚛 Spostamento: Truck ${truckName} da ${fromPlace} a ${toPlace}`
          );

          // Aspetta che TUTTE le animazioni di questo movimento siano completate
          await this.moveTruckToPos(truckName, toPlace);

          console.log(
            `✅ Movimento completato: Truck ${truckName} ora in ${toPlace}`
          );

          // Piccola pausa opzionale tra un movimento e l'altro
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
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
    loadPackageOnTruck(packageName, truckName) {
      const pkg = Object.values(this.packages).find(
        (p) => p.name === packageName
      );
      const truck = Object.values(this.trucks).find(
        (t) => t.name === truckName
      );

      if (!pkg || !truck) {
        console.warn("Pacco o truck non trovato!");
        return;
      }

      // Verifica che le location coincidano
      if (
        !pkg.location ||
        !truck.location ||
        pkg.location.id !== truck.location.id
      ) {
        console.warn(
          `Impossibile caricare: il pacco ${packageName} e il truck ${truckName} non sono nella stessa location!`
        );
        return;
      }

      if (!truck.packages) {
        truck.packages = [];
      }
      truck.packages.push(pkg);

      pkg.location = null;

      console.log(`Package ${packageName} caricato su truck ${truckName}.`);
    },
    animatePackageToTruck(packageName, truckName) {
      // 1️⃣ Trova gli ID
      const truckId = this.getTruckIdByName(truckName);
      const packageId = this.getPackageIdByName(packageName);

      if (truckId === null || packageId === null) {
        console.error("Impossibile trovare truck o package!");
        return;
      }

      // 2️⃣ Prendi le posizioni
      const truckPos = this.positions.trucks[truckId];
      const packagePos = this.positions.packages[packageId];

      if (!truckPos || !packagePos) {
        console.error("Posizioni mancanti per truck o package!");
        return;
      }

      // 3️⃣ Fai animazione usando D3.js
      const pkgGroup = d3.select(`#package-${packageName}`);
      pkgGroup
        .transition()
        .duration(1000)
        .attr(
          "transform",
          `translate(${truckPos.x}, ${
            truckPos.y
          })`
        )
        .on("end", () => {
          // Alla fine dell'animazione: rimuovi pacchetto dalla mappa
          pkgGroup.style("display", "none");
          console.log(
            `Il pacchetto ${packageName} è stato caricato nel truck ${truckName}.`
          );
        });
    },
    unloadPackageFromTruck(packageName, truckName) {
  const truck = this.trucks[truckName];
  const pkg = this.packages[packageName];

  if (truck.packages.includes(pkg)) {
    // Prima fai l'animazione
    this.animatePackageUnload(packageName, truckName);
    
    // Poi aggiorna la logica (o fallo nel callback dell'animazione)
    truck.unloadPackage(pkg);
    pkg.setLocation(truck.location);

    console.log(`Pacco ${packageName} scaricato da ${truckName} in ${truck.location.name}`);
  } else {
    console.log(`Errore: Il pacco ${packageName} non si trova nel camion ${truckName}`);
  }
},
    animatePackageUnload(packageName, truckName) {
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
      .attr("transform", `translate(${finalX - constants.PACKAGE_SIZE}, ${finalY - constants.PACKAGE_SIZE / 2})`) // ← POSIZIONE ASSOLUTA
      .style("opacity", 1)
      .on("end", () => {
        // Aggiorna la posizione
        this.positions.packages[pkgId] = {
          x: finalX - constants.PACKAGE_SIZE,
          y: finalY - constants.PACKAGE_SIZE / 2,
        };
        // Non chiamare drawGraph(), ricalcola solo le posizioni dei package in quel place
        this.repositionPackagesInPlace(placeId);
      });
  }
    },
repositionPackagesInPlace(placeId) {
  const place = Object.values(this.places).find(p => p.id === placeId);
  const packagesHere = Object.values(this.packages).filter(p => p.location.id === placeId);
  
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
}
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
