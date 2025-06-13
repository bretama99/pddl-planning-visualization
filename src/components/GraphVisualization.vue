<template>
  <div>
    <h1 class="main-title">LOGISTICS PLANNING VISUALIZER</h1>
    <div class="main-visualization-layout">
      <div ref="container" class="graph-container">
        <svg
          ref="svg"
          :width="width"
          :height="height"
          style="border: 1px solid #ccc"
          @click="handleSvgClick"
        ></svg>
      </div>
      <div class="steps-visualization">
        <h3>Step del piano</h3>
        <ol>
          <li v-for="(step, idx) in steps" :key="idx" :class="{ current: idx === currentStepIndex }">
            <span v-if="planFormat === 'PDDL+'">
              {{ step.action }} <span v-if="step.duration">({{ step.duration }})</span>
            </span>
            <span v-else>
              {{ step }}
            </span>
          </li>
        </ol>
        <div style="display: flex; gap: 8px;">
          <button class="play-steps-btn" @click="playSteps" :disabled="isPlaying">▶️ </button>
          <button class="pause-steps-btn" @click="pauseSteps" :disabled="!isPlaying || isPaused">⏸️ </button>
          <button class="resume-steps-btn" @click="resumeSteps" :disabled="!isPaused">▶️ </button>
        </div>
      </div>
    </div>
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
      planFormat: null,
      width: 800,
      height: 600,
      zoom: null,
      positions: {
        cities: {},
        places: {},
        trucks: {},
        packages: {},
      },
      currentStepIndex: -1, // Indice dello step corrente
      isPlaying: false, // Stato di riproduzione
      isPaused: false, // Stato di pausa
      pauseRequested: false, // Interno per la pausa
      resumeRequested: false, // Interno per la ripresa
      pausedStepIndex: null, // Step dove si è fermato
    };
  },
  mounted() {
    this.initializeDistances();
    this.planFormat = this.determinePlanFormat();
    console.log("Formato del piano:", this.planFormat);
    this.initPositions();
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
      const numCities = cityIds.length;
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const circleRadius = Math.min(this.width, this.height) / 2.5;

      cityIds.forEach((cityId, i) => {
        const city = this.cities[cityId];
        // Disposizione circolare
        const angle = (2 * Math.PI * i) / numCities;
        this.positions.cities[city.name] = {
          x: centerX + circleRadius * Math.cos(angle),
          y: centerY + circleRadius * Math.sin(angle),
        };
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
          }
        }
      });
    },

    initializeDistances() {
      console.log('Distanze ricevute:', this.distances);
      
      // Crea una mappa delle distanze per accesso rapido
      this.distanceMap = new Map();
      this.hasDistances = false;
      
      // Controlla se ci sono distanze valide
      if (this.distances && Array.isArray(this.distances) && this.distances.length > 0) {
        this.hasDistances = true;
        this.distances.forEach(dist => {
          this.distanceMap.set(`${dist.from}-${dist.to}`, dist.distance);
          // Aggiungi anche la direzione opposta se non esiste
          if (!this.distanceMap.has(`${dist.to}-${dist.from}`)) {
            this.distanceMap.set(`${dist.to}-${dist.from}`, dist.distance);
          }
        });
        console.log('Distanze inizializzate:', this.distanceMap.size, 'connessioni');
      } else {
        console.log('Nessuna distanza trovata, usando durata fissa per le animazioni');
      }
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

      // --- LINEE TRA LE CITTÀ CON DISTANZA ---
      if (this.distances && this.distances.length > 0) {
        const cityPos = this.positions.cities;
        this.distances.forEach(dist => {
          if (dist.from && dist.to && cityPos[dist.from] && cityPos[dist.to] && dist.from !== dist.to) {
            g.append("line")
              .attr("x1", cityPos[dist.from].x)
              .attr("y1", cityPos[dist.from].y)
              .attr("x2", cityPos[dist.to].x)
              .attr("y2", cityPos[dist.to].y)
              .attr("stroke", "#888")
              .attr("stroke-width", 25)
              .attr("opacity", 0.85)
              .lower();
          }
        });
      }

      // CITTÀ
      Object.entries(this.cities).forEach(([cityId, city], i) => {
        const pos = this.positions.cities[city.name];
        if (!pos) return;

        const cityGroup = g.append("g").attr("id", `city-${city.name}`);

        // Crea un clipPath unico per ogni città
  const clipId = `clip-${city.name}`;
  g.append("clipPath")
    .attr("id", clipId)
    .append("circle")
    .attr("cx", pos.x)
    .attr("cy", pos.y)
    .attr("r", constants.CITY_RADIUS);

  // Immagine ritagliata nel cerchio
  cityGroup
    .append("image")
    .attr("xlink:href", "https://mappemondo.com/italy/city/milan/milan-street-map-max.jpg")
    .attr("x", pos.x - constants.CITY_RADIUS)
    .attr("y", pos.y - constants.CITY_RADIUS)
    .attr("width", constants.CITY_RADIUS * 2)
    .attr("height", constants.CITY_RADIUS * 2)
    .attr("clip-path", `url(#${clipId})`)
    .attr("preserveAspectRatio", "xMidYMid slice");
    ;

  // Bordo del cerchio sopra
  cityGroup
    .append("circle")
    .attr("cx", pos.x)
    .attr("cy", pos.y)
    .attr("r", constants.CITY_RADIUS)
    .attr("fill", "none")
    .attr("stroke", constants.CITY_STROKE)
    .attr("stroke-width", 2);

  // Testo sotto
  cityGroup
    .append("text")
    .attr("x", pos.x)
    .attr("y", pos.y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "hanging")
    .text(city.name);
      });

      // LUOGHI (places)
      Object.values(this.places).forEach((place) => {
        const pos = this.positions.places[place.id];
        if (!pos) return;

        const placeGroup = g.append("g").attr("id", `place-${place.id}`);
        const imageHref = place.subtype === 'gasstation'
    ? constants.IMAGE_PATHS.GAS_STATION
    : constants.IMAGE_PATHS.PLACE;

        placeGroup
  .append("image")
  .attr("x", pos.x - constants.PLACE_IMAGE_WIDTH / 2)  // centra l'immagine
  .attr("y", pos.y - constants.PLACE_IMAGE_HEIGHT / 2)
  .attr("width", constants.IMAGE_SIZES.PLACE_WIDTH)
  .attr("height", constants.IMAGE_SIZES.PLACE_HEIGHT)
  .attr("href", imageHref);

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
    animateTruck(truckName, newX, newY, duration = 0) {
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
    const animationduration = this.calculateAnimationDuration(duration);

    console.log(
      `Animazione del truck ${truckName} da (${this.positions.trucks[truckId].x},${this.positions.trucks[truckId].y}) a (${newX}, ${newY}) con durata ${animationduration}ms`
    );

    truckGroup
      .transition()
      .duration(animationduration) // Usa la durata calcolata
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
      // Se non ci sono distanze definite, restituisce 0 (durata fissa)
      if (!this.hasDistances) {
        return 0;
      }
      
      // Se sono nella stessa città, distanza 0 (movimento locale)
      if (fromPlace.city && toPlace.city && fromPlace.city.id === toPlace.city.id) {
        return 0;
      }

      // Se i places non hanno città definite, usa durata fissa
      if (!fromPlace.city || !toPlace.city) {
        return 0;
      }

      const fromCityName = fromPlace.city.name;
      const toCityName = toPlace.city.name;
      
      // Usa la mappa delle distanze per accesso rapido
      const distance = this.distanceMap.get(`${fromCityName}-${toCityName}`) || 
                      this.distanceMap.get(`${toCityName}-${fromCityName}`);
      
      return distance || 0; // Restituisce 0 se non trovata (durata fissa)
    },  
    async moveTruckToPos(truckName, placeName, duration = null, preCalculatedData = null) {
  let truckEntry, newPlaceEntry, oldPlace, distance;
  
  if (preCalculatedData) {
    // Usa i dati già calcolati
    truckEntry = preCalculatedData.truckEntry;
    newPlaceEntry = preCalculatedData.toPlaceEntry;
    oldPlace = preCalculatedData.fromPlaceEntry;
    distance = preCalculatedData.distance;
  } else {
    // Calcola i dati (logica originale)
    truckEntry = Object.values(this.trucks).find(
      (t) => t.name === truckName
    );
    if (!truckEntry) return;

    newPlaceEntry = Object.values(this.places).find(
      (p) => p.name === placeName
    );
    if (!newPlaceEntry) return;

    oldPlace = truckEntry.location;
    distance = this.calculateDistanceBetweenPlaces(oldPlace, newPlaceEntry);
  }

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
  // Usa la duration se fornita, altrimenti usa la distance per calcolare la durata dell'animazione
  const animationDuration = duration !== null ? duration : distance;
  promises.push(this.repositionTrucksInPlace(newPlaceEntry.id, animationDuration, truckName));

  // Aspetta che tutte le animazioni siano completate
  await Promise.all(promises);
}
    ,

    async repositionTrucksInPlace(placeId, duration = 0, movingTruckName = null) {
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
    const animationDuration = (truck.name === movingTruckName) ? duration : 0;

    // Restituisce la Promise dell'animazione
    return this.animateTruck(truck.name, truckX, truckY, animationDuration);
  });

  // Aspetta che tutte le animazioni siano completate
  await Promise.all(animationPromises);
},
    async processDriveTruckStep(actionPart, duration = null, movementData = null) {
  const tokens = actionPart.replace(/[()]/g, '').split(' ');
  const truckName = tokens[1];   // secondo parametro
  const fromPlace = tokens[2];   // terzo parametro  
  const toPlace = tokens[3];     // quarto parametro

  console.log(`🚛 Spostamento: Truck ${truckName} da ${fromPlace} a ${toPlace}`);
  
  // Usa i dati pre-calcolati se disponibili
  await this.moveTruckToPos(truckName, toPlace, duration,movementData);
  
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
async processRefuelStep(actionPart, duration) {
  console.log(`Processando step di rifornimento: ${actionPart}`);
  
  // Parse per start-refuel (con truck e stazione)
  let match = actionPart.match(/\(start-refuel\s+(\w+)\s+(\w+)\)/);
  if (match) {
    const [, truckName, stationName] = match;
    const truckId = this.getTruckIdByName(truckName);
    await this.startRefuelAnimation(truckId, truckName, stationName, duration);
    return;
  }
  
  // Parse per stop-refuel (solo truck)
  match = actionPart.match(/\(stop-refuel\s+(\w+)\)/);
  if (match) {
    const [, truckName] = match;
    const truckId = this.getTruckIdByName(truckName);
    await this.stopRefuelAnimation(truckId, truckName);
    return;
  }
  
  console.warn(`Formato azione rifornimento non riconosciuto: ${actionPart}`);
},
calculateMovementDistance(actionPart) {
  const tokens = actionPart.replace(/[()]/g, '').split(' ');
  let truckName, fromPlace, toPlace;
  
  if (actionPart.startsWith('(drive-truck')) {
    truckName = tokens[1];   // secondo parametro
    fromPlace = tokens[2];   // terzo parametro  
    toPlace = tokens[3];     // quarto parametro
  } else if (actionPart.startsWith('(start-move')) {
    truckName = tokens[1];   // secondo parametro
    fromPlace = tokens[2];   // terzo parametro  
    toPlace = tokens[3];     // quarto parametro
  }
  
  if (!truckName || !fromPlace || !toPlace) return null;

  const truckEntry = Object.values(this.trucks).find(
    (t) => t.name === truckName
  );
  if (!truckEntry) return null;

  const fromPlaceEntry = Object.values(this.places).find(
    (p) => p.name === fromPlace
  );
  if (!fromPlaceEntry) return null;

  const toPlaceEntry = Object.values(this.places).find(
    (p) => p.name === toPlace
  );
  if (!toPlaceEntry) return null;

  // Calcola la distanza tra i luoghi
  const distance = this.calculateDistanceBetweenPlaces(fromPlaceEntry, toPlaceEntry);
  
  return {
    truckName,
    fromPlace,
    toPlace,
    distance,
    truckEntry,
    fromPlaceEntry,
    toPlaceEntry
  };
},
async processStepsAndMoveTrucks(steps, startIndex = 0) {
      this.isPlaying = true;
      this.isPaused = false;
      this.pauseRequested = false;
      this.pausedStepIndex = null;
      for (let i = startIndex; i < steps.length; i++) {
        this.currentStepIndex = i;
        if (this.pauseRequested) {
          this.isPlaying = false;
          this.isPaused = true;
          this.pausedStepIndex = i;
          break;
        }
        const step = steps[i];
        let actionPart;
        let duration = null;
        
        // Estrai l'azione e la durata in base al formato del plan
        if (this.planFormat === 'PDDL+') {
          // Formato PDDL+ - step è un oggetto con proprietà action e duration
          actionPart = step.action.trim();
          duration = step.duration;
        } else {
          // Formato PDDL1/PDDL2 - step è una stringa con formato "timestamp: action"
          actionPart = step.split(': ')[1].trim();
          if (actionPart.startsWith('(drive-truck') || actionPart.startsWith('(start-move')) {
            const movementData = this.calculateMovementDistance(actionPart);
            if (movementData) {
              duration = movementData.distance; // Usa la distanza come durata
            }
          }
        }

        // Processa l'azione in base al tipo
        if (actionPart.startsWith('(drive-truck') || actionPart.startsWith('(start-move')) {
          await this.processDriveTruckStep(actionPart, duration);
        } else if (actionPart.startsWith('(load-truck')) {
          await this.processLoadTruckStep(actionPart, duration);
        } else if (actionPart.startsWith('(unload-truck')) {
          await this.processUnloadTruckStep(actionPart, duration);
        } else if (actionPart.startsWith('(start-refuel') || actionPart.startsWith('(stop-refuel')) {
          await this.processRefuelStep(actionPart, duration);
        } else {
          console.warn(`Tipo di step non riconosciuto: ${actionPart}`);
        }
        let delay = 300;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      if (!this.pauseRequested) {
        this.currentStepIndex = -1; // Reset dopo la fine
        this.isPlaying = false;
        this.isPaused = false;
        this.pausedStepIndex = null;
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
        this.isPlaying = true;
        this.isPaused = false;
        this.pauseRequested = false;
        this.pausedStepIndex = null;
        this.processStepsAndMoveTrucks(this.steps);
      } else {
        console.warn("Non ci sono steps da processare!");
      }
    },
    pauseSteps() {
      this.pauseRequested = true;
    },
    resumeSteps() {
      if (this.isPaused && this.pausedStepIndex !== null) {
        this.isPlaying = true;
        this.isPaused = false;
        this.pauseRequested = false;
        this.processStepsAndMoveTrucks(this.steps, this.pausedStepIndex);
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
      const MAX_DURATION = constants.MAX_ANIMATION_DURATION; // Durata massima in ms
      const MIN_DURATION = constants.MIN_ANIMATION_DURATION; // Durata minima in ms

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
      // Rileva il formato degli steps
    determinePlanFormat() {
    console.log("Rilevamento del formato degli steps:", this.steps);
    if (!this.steps || this.steps.length === 0) return 'UNKNOWN';
    
    const firstStep = this.steps[0];
    
    // Formato PDDL+ (oggetti con start, action, duration)
    if (typeof firstStep === 'object' && firstStep.hasOwnProperty('start') && firstStep.hasOwnProperty('action')) {
      return 'PDDL+';
    }
    
    // Formato PDDL1/PDDL2 - step è una stringa con formato "timestamp: action"
    if (typeof firstStep === 'string') {
      return this.distances ? 'PDDL2' : 'PDDL1';
    }
    
    return 'UNKNOWN';
    },
    async startRefuelAnimation(truckId, truckName, stationName, duration = 3000) {
  const truckGroup = d3.select(`#truck-${truckName}`);
  
  if (truckGroup.empty()) {
    console.warn(`Truck ${truckId} non trovato nel DOM`);
    return;
  }
  
  console.log(`Iniziando rifornimento per ${truckName} alla stazione ${stationName}`);
  
  return new Promise((resolve) => {
    // Crea il gruppo per l'animazione di rifornimento
    const refuelGroup = truckGroup
      .append("g")
      .attr("class", `refuel-animation-${truckId}`);
    
    // Icona della pompa di benzina
    const fuelIcon = refuelGroup
      .append("g")
      .attr("transform", "translate(0, -35)");
    
    // Background dell'icona
    fuelIcon
      .append("circle")
      .attr("r", 12)
      .attr("fill", "#4CAF50")
      .attr("stroke", "#2E7D32")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);
    
    // Emoji della pompa
    fuelIcon
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-size", "14px")
      .text("⛽")
      .attr("fill", "white");
    
    // Barra di progresso
    const progressGroup = refuelGroup
      .append("g")
      .attr("transform", "translate(0, -20)");
    
    // Background della barra
    progressGroup
      .append("rect")
      .attr("x", -25)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", 6)
      .attr("fill", "#E0E0E0")
      .attr("stroke", "#BDBDBD")
      .attr("stroke-width", 1)
      .attr("rx", 3);
    
    // Barra di progresso
    const progressBar = progressGroup
      .append("rect")
      .attr("x", -25)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", 6)
      .attr("fill", "#4CAF50")
      .attr("rx", 3);
    
    // Testo di stato
    const statusText = refuelGroup
      .append("text")
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("");
    
    // Anima la barra di progresso
    progressBar
      .transition()
      .duration(duration*constants.MIN_ANIMATION_DURATION || 3000)
      .attr("width", 50)
      .on("end", () => {
        statusText.text("");
        
        // Aggiorna lo stato del carburante
        /* if (this.trucks[truckName]) {
          this.trucks[truckName].fuel = 100;
        } */
        
        console.log(`Rifornimento completato per ${truckName}`);
        resolve();
      });
    
    // Animazione pulsante per l'icona
    const pulseAnimation = () => {
      fuelIcon
        .transition()
        .duration(1000)
        .attr("transform", "translate(0, -35) scale(1.1)")
        .transition()
        .duration(1000)
        .attr("transform", "translate(0, -35) scale(1)")
        .on("end", () => {
          // Continua il pulsing solo se l'animazione è ancora attiva
          if (!refuelGroup.empty()) {
            pulseAnimation();
          }
        });
    };
    
    pulseAnimation();
  });
    },
async stopRefuelAnimation(truckId, truckName) {
  const truckGroup = d3.select(`#truck-${truckName}`);
  const refuelAnimation = truckGroup.select(`.refuel-animation-${truckId}`);
  
  if (!refuelAnimation.empty()) {
    console.log(`Terminando rifornimento per ${truckName}`);
    
    return new Promise((resolve) => {
      // Ferma tutte le transizioni in corso
      refuelAnimation.selectAll("*").interrupt();
      
      // Animazione di fade out
      refuelAnimation
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .on("end", () => {
          refuelAnimation.remove();
          console.log(`Animazione rifornimento rimossa per ${truckName}`);
          resolve();
        });
    });
  }
},

  },
  
};
</script>

<style scoped>
.main-title {
  font-size: 2.2em;
  font-weight: bold;
  margin-bottom: 18px;
  margin-top: 18px;
  text-align: center;
  color: #000000;
  letter-spacing: 1px;
}

.main-visualization-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  min-height: 600px;
}
.graph-container {
  flex: 1 1 0;
  min-width: 0;
  min-height: 600px;
  height: 100%;
  position: relative;
}
.play-steps-btn {
  /* Rimosso position: absolute per renderlo statico nel pannello laterale */
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-top: 12px;
  margin-bottom: 8px;
  width: 100%;
  display: block;
}
.pause-steps-btn {
  background: rgb(150, 150, 150);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-top: 12px;
  margin-bottom: 8px;
  width: 100%;
  display: block;
  opacity: 1;
  transition: opacity 0.2s;
}
.pause-steps-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.resume-steps-btn {
  background: #43a047;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-top: 12px;
  margin-bottom: 8px;
  width: 100%;
  display: block;
  opacity: 1;
  transition: opacity 0.2s;
}
.resume-steps-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.steps-visualization {
  flex: 0 0 300px;
  max-width: 340px;
  min-width: 220px;
  background: rgba(255,255,255,0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px 18px;
  max-height: 80vh;
  overflow-y: auto;
  margin-left: 16px;
  z-index: 10;
  box-sizing: border-box;
}
.steps-visualization ol {
  padding-left: 18px;
  margin: 0;
}
.steps-visualization li {
  margin-bottom: 6px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;
}
.steps-visualization li.current {
  background: #1976d2;
  color: #fff;
  font-weight: bold;
}
@media (max-width: 900px) {
  .main-visualization-layout {
    flex-direction: column;
  }
  .steps-visualization {
    margin-left: 0;
    margin-top: 12px;
    max-width: 100vw;
    width: 100%;
  }
}
</style>
