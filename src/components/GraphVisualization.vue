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
          <li
            v-for="(step, idx) in steps"
            :key="idx"
            :class="{ current: idx === currentStepIndex }"
          >
            <span v-if="planFormat === 'PDDL+'">
              {{ step.action }}
              <span v-if="step.duration">({{ step.duration }})</span>
            </span>
            <span v-else>
              {{ step }}
            </span>
          </li>
        </ol>
        <div style="display: flex; gap: 8px">
          <button
            class="play-steps-btn"
            @click="playSteps"
            :disabled="isPlaying"
          >
            ▶️
          </button>
          <button
            class="pause-steps-btn"
            @click="pauseSteps"
            :disabled="!isPlaying || isPaused"
          >
            ⏸️
          </button>
          <button
            class="resume-steps-btn"
            @click="resumeSteps"
            :disabled="!isPaused"
          >
            ⏯️
          </button>
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
    vehicles: Object,
    packages: Object,
    steps: Array,
    distances: Array,
    fuelRates: Object, // Nuova prop
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
        vehicles: {},
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
      immediate: true,
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
    vehicles: {
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
      console.log("Distanze ricevute:", this.distances);

      // Crea una mappa delle distanze per accesso rapido
      this.distanceMap = new Map();
      this.hasDistances = false;

      // Controlla se ci sono distanze valide
      if (
        this.distances &&
        Array.isArray(this.distances) &&
        this.distances.length > 0
      ) {
        this.hasDistances = true;
        this.distances.forEach((dist) => {
          this.distanceMap.set(`${dist.from}-${dist.to}`, dist.distance);
          // Aggiungi anche la direzione opposta se non esiste
          if (!this.distanceMap.has(`${dist.to}-${dist.from}`)) {
            this.distanceMap.set(`${dist.to}-${dist.from}`, dist.distance);
          }
        });
        console.log(
          "Distanze inizializzate:",
          this.distanceMap.size,
          "connessioni"
        );
      } else {
        console.log(
          "Nessuna distanza trovata, usando durata fissa per le animazioni"
        );
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
        this.distances.forEach((dist) => {
          if (
            dist.from &&
            dist.to &&
            cityPos[dist.from] &&
            cityPos[dist.to] &&
            dist.from !== dist.to
          ) {
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
          .attr("xlink:href", constants.IMAGE_PATHS.CITY)
          .attr("x", pos.x - constants.CITY_RADIUS)
          .attr("y", pos.y - constants.CITY_RADIUS)
          .attr("width", constants.CITY_RADIUS * 2)
          .attr("height", constants.CITY_RADIUS * 2)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice");
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
        let imageHref = constants.IMAGE_PATHS.PLACE; // default
        if (place.subtype === constants.PLACE_SUBTYPE_GASSTATION) {
          imageHref = constants.IMAGE_PATHS.GAS_STATION;
        } else if (place.subtype === constants.PLACE_SUBTYPE_AIRPORT) {
          imageHref = constants.IMAGE_PATHS.AIRPORT; // aggiungilo in constants.js se manca
        }

        placeGroup
          .append("image")
          .attr("x", pos.x - constants.PLACE_IMAGE_WIDTH / 2) // centra l'immagine
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
          const { x: pkgX, y: pkgY } = this.getPackagePositionInPlace(
            place,
            k,
            numPackages
          );

          const pkgGroup = g
            .append("g")
            .attr("id", `package-${pkg.name}`)
            .attr(
              "transform",
              `translate(${pkgX - constants.PACKAGE_SIZE}, ${
                pkgY - constants.PACKAGE_SIZE / 2
              })`
            ); // ← AGGIUNGI QUESTO

          pkgGroup
            .append("image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", constants.IMAGE_SIZES.PACKAGE_SIZE)
            .attr("height", constants.IMAGE_SIZES.PACKAGE_SIZE)
            .attr("href", constants.IMAGE_PATHS.PACKAGE);

          pkgGroup
            .append("text")
            .attr("x", -constants.PACKAGE_LABEL_OFFSET_X) // ← CAMBIA: relativo al gruppo
            .attr(
              "y",
              constants.PACKAGE_SIZE / 2 + constants.PACKAGE_LABEL_OFFSET_Y
            ) // ← CAMBIA: relativo al gruppo
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
        const trucksHere = this.getVehiclesInPlaceBySubtype(
          constants.VEHICLE_SUBTYPES.TRUCK,
          place
        );
        const numTrucks = trucksHere.length;
        trucksHere.forEach((truck, k) => {
          const { x: truckX, y: truckY } = this.getTruckPositionInPlace(
            place,
            k,
            numTrucks
          );

          console.log(`${truckY - constants.TRUCK_OFFSET_Y}`);
          const subtype = truck.subtype;
          const imageHref = constants.VEHICLE_IMAGE_PATHS[subtype];
          const imageSize = constants.VEHICLE_IMAGE_SIZES[subtype];
          const truckGroup = g
            .append("g")
            .attr("id", `${subtype}-${truck.name}`)
            .attr(
              "transform",
              `translate(${truckX}, ${truckY - constants.TRUCK_OFFSET_Y})`
            );

          truckGroup
            .append("image")
            .attr("x", 0)
            .attr("y", -constants.TRUCK_SIZE / 2)
            .attr("width", imageSize.width)
            .attr("height", imageSize.height)
            .attr("href", imageHref);

          truckGroup
            .append("text")
            .attr("x", constants.TRUCK_LABEL_OFFSET_X)
            .attr("y", constants.TRUCK_LABEL_OFFSET_Y)
            .attr("text-anchor", "start")
            .attr("font-size", constants.TRUCK_LABEL_FONT_SIZE)
            .text(truck.name);

            if (truck.hasGasoline()) {
    this.drawGasolineBar(truckGroup, truck, 0, -constants.TRUCK_SIZE / 2);
  }

          // Aggiorna posizione
          this.positions.vehicles[truck.id] = {
            x: truckX,
            y: truckY - constants.TRUCK_OFFSET_Y,
          };
        });

        const airplanesHere = this.getVehiclesInPlaceBySubtype(
          constants.VEHICLE_SUBTYPES.AIRPLANE,
          place
        );

        const numAirplanes = airplanesHere.length;
        airplanesHere.forEach((airplane, i) => {
          const { x: airplaneX, y: airplaneY } =
            this.getAirplanePositionInPlace(place, i, numAirplanes);

          const imageHref = constants.VEHICLE_IMAGE_PATHS[airplane.subtype];
          const imageSize = constants.VEHICLE_IMAGE_SIZES[airplane.subtype];

          const airplaneGroup = g
            .append("g")
            .attr("id", `${airplane.subtype}-${airplane.name}`)
            .attr("transform", `translate(${airplaneX}, ${airplaneY})`);

          airplaneGroup
            .append("image")
            .attr("x", -imageSize.width / 2)
            .attr("y", -imageSize.height / 2)
            .attr("width", imageSize.width)
            .attr("height", imageSize.height)
            .attr("href", imageHref);

          airplaneGroup
            .append("text")
            .attr("x", 0)
            .attr("y", imageSize.height / 2 + 10)
            .attr("text-anchor", "middle")
            .attr("font-size", constants.TRUCK_LABEL_FONT_SIZE)
            .text(airplane.name);

          // Aggiorna posizione
          this.positions.vehicles[airplane.id] = {
            x: airplaneX,
            y: airplaneY,
          };
        });
      });
    },
    getVehiclesInPlaceBySubtype(subtype, place) {
      return this.getTrucksInPlace(place).filter(
        (vehicle) => vehicle.subtype === subtype
      );
    },
    getPlaceIdByName(name) {
      const placeEntry = Object.values(this.places).find(
        (p) => p.name === name
      );
      return placeEntry ? placeEntry.id : null;
    },
    animateTruck(truck, newX, newY, duration = 0, gasolineConsumption = 0) {
      return new Promise((resolve) => {
        const truckGroup = d3.select(`#${truck.subtype}-${truck.name}`);
        if (truckGroup.empty()) {
          resolve();
          return;
        }

        const truckId = this.getTruckIdByName(truck.name);
        if (!this.positions.vehicles[truckId]) {
          console.error(
            `Posizione per il truck con ID ${truckId} non trovata!`
          );
          resolve();
          return;
        }

        const animationDuration = this.calculateAnimationDuration(duration);

        // Salva la benzina iniziale per l'animazione
        const initialGasoline = truck.hasGasoline() ? truck.gasoline : 0;
        const finalGasoline = Math.max(
          0,
          initialGasoline - gasolineConsumption
        );

        console.log(
          `Animazione del truck ${truck.name} da (${this.positions.vehicles[truckId].x},${this.positions.vehicles[truckId].y}) a (${newX}, ${newY}) con durata ${animationDuration}ms`
        );

        if (truck.hasGasoline() && gasolineConsumption > 0) {
          console.log(
            `Benzina: ${initialGasoline} -> ${finalGasoline} (consumo: ${gasolineConsumption})`
          );
        }

        // Animazione della posizione
        truckGroup
          .transition()
          .duration(animationDuration)
          .attr("transform", `translate(${newX}, ${newY})`)
          .on("end", () => {
            this.positions.vehicles[truckId].x = newX;
            this.positions.vehicles[truckId].y = newY;
            this.syncPackagePositionsOnTruck(truck.name);
            resolve();
          });

        // Animazione parallela del consumo benzina (se applicabile)
        if (truck.hasGasoline() && gasolineConsumption > 0) {
          this.animateGasolineConsumption(
            truck,
            initialGasoline,
            finalGasoline,
            animationDuration
          );
        }
      });
    },
    
    getTruckIdByName(name) {
      const truckEntry = Object.values(this.vehicles).find(
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
      if (
        fromPlace.city &&
        toPlace.city &&
        fromPlace.city.id === toPlace.city.id
      ) {
        return 0;
      }

      // Se i places non hanno città definite, usa durata fissa
      if (!fromPlace.city || !toPlace.city) {
        return 0;
      }

      const fromCityName = fromPlace.city.name;
      const toCityName = toPlace.city.name;

      // Usa la mappa delle distanze per accesso rapido
      const distance =
        this.distanceMap.get(`${fromCityName}-${toCityName}`) ||
        this.distanceMap.get(`${toCityName}-${fromCityName}`);

      return distance || 0; // Restituisce 0 se non trovata (durata fissa)
    },
    async moveVehicleToPos(
  truckName,
  placeName,
  duration = null,
  preCalculatedData = null,
  gasolineConsumption = 0
) {
  let truckEntry, newPlaceEntry, oldPlace, distance;

  if (preCalculatedData) {
    truckEntry = preCalculatedData.truckEntry;
    newPlaceEntry = preCalculatedData.toPlaceEntry;
    oldPlace = preCalculatedData.fromPlaceEntry;
    distance = preCalculatedData.distance;
  } else {
    truckEntry = Object.values(this.vehicles).find(
      (t) => t.name === truckName
    );
    if (!truckEntry) return { actualDuration: 0 };

    newPlaceEntry = Object.values(this.places).find(
      (p) => p.name === placeName
    );
    if (!newPlaceEntry) return { actualDuration: 0 };

    oldPlace = truckEntry.location;
    distance = this.calculateDistanceBetweenPlaces(oldPlace, newPlaceEntry);
  }

  const oldPlaceId = truckEntry.location.id;
  truckEntry.location = newPlaceEntry;

  const promises = [];

  if (oldPlaceId !== newPlaceEntry.id) {
    promises.push(this.repositionVehiclesInPlace(oldPlaceId));
  }

  const animationDuration = duration !== null ? duration : distance;
  
  // CALCOLA LA DURATA EFFETTIVA che sarà usata dall'animazione
  const actualAnimationDuration = this.calculateAnimationDuration(animationDuration);

  // Passa il consumo di benzina al riposizionamento
  promises.push(
    this.repositionVehiclesInPlace(
      newPlaceEntry.id,
      animationDuration,
      truckName,
      gasolineConsumption
    )
  );

  await Promise.all(promises);
  
  // RESTITUISCI LA DURATA EFFETTIVA
  return { actualDuration: actualAnimationDuration };
},
    async repositionVehiclesInPlace(
      placeId,
      duration = 0,
      movingVehicleName = null,
      gasolineConsumption = 0
    ) {
      const place = this.getPlaceById(placeId);
      const placePos = this.positions.places[placeId];
      if (!placePos) return;

      const vehiclesHere = this.getTrucksInPlace(place);
      const numVehicles = vehiclesHere.length;

      const positionStrategy = {
        truck: this.getTruckPositionInPlace.bind(this),
        airplane: this.getAirplanePositionInPlace.bind(this),
      };

      const animationPromises = vehiclesHere.map((vehicle, k) => {
        const subtype = vehicle.subtype;
        const getPosition =
          positionStrategy[subtype] || this.getTruckPositionInPlace.bind(this);
        const { x, y } = getPosition(place, k, numVehicles);

        const animationDuration =
          vehicle.name === movingVehicleName ? duration : 0;
        const vehicleGasolineConsumption =
          vehicle.name === movingVehicleName ? gasolineConsumption : 0;

        return this.animateTruck(
          vehicle,
          x,
          y,
          animationDuration,
          vehicleGasolineConsumption
        );
      });

      await Promise.all(animationPromises);
    },

    async processFlyAirplaneStep(
      actionPart,
      duration = null,
      movementData = null
    ) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      const airplaneName = tokens[1]; // Es: apn1
      const fromPlace = tokens[2]; // Es: apt2
      const toPlace = tokens[3]; // Es: apt1

      console.log(
        `✈️ Spostamento: Airplane ${airplaneName} da ${fromPlace} a ${toPlace}`
      );

      // Muovi l'aereo come faresti con un truck, ma con subtype airplane
      await this.moveVehicleToPos(
        airplaneName,
        toPlace,
        duration,
        movementData
      );

      console.log(
        `✅ Movimento completato: Airplane ${airplaneName} ora in ${toPlace}`
      );
    },
    async processDriveTruckStep(
  actionPart,
  duration = null,
  movementData = null
) {
  const tokens = actionPart.replace(/[()]/g, "").split(" ");
  const truckName = tokens[1];
  const fromPlace = tokens[2];
  const toPlace = tokens[3];

  console.log(`🚛 Spostamento: Truck ${truckName} da ${fromPlace} a ${toPlace}`);

  // Trova l'oggetto truck per gestire la benzina
  const truckObj = Object.values(this.vehicles).find(v => v.name === truckName);
  
  // Calcola il consumo di benzina se abbiamo la durata
  let gasolineConsumption = 0;
  if (duration && truckObj && truckObj.hasGasoline()) {
    gasolineConsumption = this.calculateGasolineConsumption(duration);
    console.log(`⛽ Consumo benzina previsto: ${gasolineConsumption} unità (durata: ${duration})`);
    
    // Verifica se il truck ha abbastanza benzina
    if (truckObj.gasoline < gasolineConsumption) {
      console.warn(`⚠️ ATTENZIONE: ${truckName} potrebbe rimanere senza benzina!`);
      console.warn(`   Benzina attuale: ${truckObj.gasoline}, Consumo previsto: ${gasolineConsumption}`);
    }
  }

  // CALCOLA LA DURATA EFFETTIVA prima di avviare le animazioni
  const animationDuration = duration !== null ? duration : 1;
  const actualDuration = this.calculateAnimationDuration(animationDuration);
  
  console.log(`⏱️ Durata effettiva calcolata: ${actualDuration}ms`);

  // Avvia le animazioni in PARALLELO
  const promises = [];
  
  // 1. Movimento del truck
  promises.push(this.moveVehicleToPos(truckName, toPlace, duration, movementData));
  
  // 2. Consumo benzina (se applicabile) - IN PARALLELO con la stessa durata
  if (gasolineConsumption > 0 && truckObj) {
    promises.push(this.animateGasolineConsumption(truckObj, gasolineConsumption, actualDuration));
  }
  
  // Aspetta che entrambe le animazioni finiscano
  await Promise.all(promises);

  console.log(`✅ Movimento completato: Truck ${truckName} ora in ${toPlace}`);
  
  // Log finale dello stato benzina
  if (truckObj && truckObj.hasGasoline()) {
    console.log(`⛽ Benzina finale ${truckName}: ${truckObj.gasoline}%`);
  }
},

    async processLoadVehicleStep(actionPart) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      const packageName = tokens[1]; // secondo parametro
      const vehicleName = tokens[2]; // terzo parametro
      const placeName = tokens[3]; // quarto parametro

      console.log(
        `📦⬆️ Caricamento: Package ${packageName} su Vehicle ${vehicleName} in ${placeName}`
      );

      await this.loadPackageToVehicle(packageName, vehicleName);

      console.log(
        `✅ Caricamento completato: Package ${packageName} caricato su Vehicle ${vehicleName}`
      );
    },
    async processUnloadVehicleStep(actionPart) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      const packageName = tokens[1]; // secondo parametro
      const truckName = tokens[2]; // terzo parametro
      const placeName = tokens[3]; // quarto parametro

      console.log(
        `📦⬇️ Scaricamento: Package ${packageName} da truck ${truckName} in ${placeName}`
      );

      await this.unloadPackageFromVehicle(packageName, truckName);

      console.log(
        `✅ Scaricamento completato: Package ${packageName} scaricato da truck ${truckName} in ${placeName}`
      );
    },
    async processRefuelStep(actionPart, duration) {
  const tokens = actionPart.replace(/[()]/g, "").split(" ");
  const truckName = tokens[1];
  
  console.log(`⛽ Rifornimento: Truck ${truckName} per ${duration} unità di tempo`);
  
  const truckObj = Object.values(this.vehicles).find(v => v.name === truckName);
  if (!truckObj || !truckObj.hasGasoline()) {
    console.warn(`❌ Truck ${truckName} non trovato o senza sistema benzina`);
    return;
  }
  
  const initialGasoline = truckObj.gasoline;
  const refuelAmount = this.calculateRefuelAmount(duration);
  const maxPossibleRefuel = Math.min(refuelAmount, truckObj.maxGasoline - truckObj.gasoline);
  
  console.log(`⛽ Rifornimento ${truckName}:`);
  console.log(`   Benzina iniziale: ${initialGasoline}`);
  console.log(`   Rifornimento teorico: ${refuelAmount}`);
  console.log(`   Rifornimento effettivo: ${maxPossibleRefuel}`);
  
  // Anima il rifornimento
  const animationDurationMs = (duration || 1) * 1000; // Converti secondi in millisecondi
  const steps = Math.min(50, Math.max(10, Math.floor(animationDurationMs / 100)));
  const refuelPerStep = maxPossibleRefuel / steps;
      const intervalMs = animationDurationMs / steps;
  console.log(`   Passi di rifornimento: ${steps} (${refuelPerStep} per passo) con intervallo di ${intervalMs} ms`);
  
  return new Promise((resolve) => {
    let currentStep = 0;
    
    const refuelInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(refuelInterval);
        
        // Assicurati che il valore finale sia esatto
        const finalGasoline = Math.min(truckObj.maxGasoline, initialGasoline + maxPossibleRefuel);
        truckObj.setGasoline(finalGasoline);
        this.updateGasolineBar(truckObj.name, truckObj.gasoline);
        
        console.log(`✅ Rifornimento completato: ${initialGasoline} → ${truckObj.gasoline}`);
        resolve();
        return;
      }
      
      truckObj.addGasoline(refuelPerStep);
      this.updateGasolineBar(truckObj.name, truckObj.gasoline);
      currentStep++;
    }, intervalMs);
  });
}
,
    animateRefueling(truck, startGasoline, endGasoline, duration) {
      if (!truck.hasGasoline()) return;

      const svg = d3.select(this.$refs.svg);
      const progressBarWidth = 40;
      const gasolineInterpolator = d3.interpolate(startGasoline, endGasoline);

      svg
        .select(`.gasoline-bar-${truck.name}`)
        .transition()
        .duration(duration)
        .tween("refuel", () => {
          return (t) => {
            const currentGasoline = gasolineInterpolator(t);
            truck.gasoline = currentGasoline;

            const percentage = (currentGasoline / truck.maxGasoline) * 100;
            const fillWidth = (progressBarWidth - 2) * (percentage / 100);

            let fillColor = "#4CAF50";
            if (percentage <= 25) {
              fillColor = "#F44336";
            } else if (percentage <= 50) {
              fillColor = "#FF9800";
            }

            d3.select(this).attr("width", fillWidth).attr("fill", fillColor);
          };
        });

      // Anima anche il testo
      svg
        .select(`.gasoline-text-${truck.name}`)
        .transition()
        .duration(duration)
        .tween("refuel-text", () => {
          return (t) => {
            const currentGasoline = gasolineInterpolator(t);
            const percentage = (currentGasoline / truck.maxGasoline) * 100;
            d3.select(this).text(`${Math.round(percentage)}%`);
          };
        });
    },
    showRefuelingAnimation(truck, isRefueling) {
      const svg = d3.select(this.$refs.svg);
      const truckGroup = svg.select(`#${truck.subtype}-${truck.name}`);

      if (isRefueling) {
        // Aggiungi un'icona pulsante o un effetto per indicare il rifornimento
        truckGroup.select(".refuel-indicator").remove(); // Rimuovi se esiste già

        truckGroup
          .append("text")
          .attr("class", "refuel-indicator")
          .attr("x", 0)
          .attr("y", -30)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "#FF6B35")
          .text("⛽")
          .style("animation", "pulse 1s infinite"); // CSS animation se disponibile
      } else {
        // Rimuovi l'indicatore
        truckGroup.select(".refuel-indicator").remove();
      }
    },

    calculateMovementDistance(actionPart) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      let truckName, fromPlace, toPlace;

      if (actionPart.startsWith("(drive-truck")) {
        truckName = tokens[1]; // secondo parametro
        fromPlace = tokens[2]; // terzo parametro
        toPlace = tokens[3]; // quarto parametro
      } else if (actionPart.startsWith("(start-move")) {
        truckName = tokens[1]; // secondo parametro
        fromPlace = tokens[2]; // terzo parametro
        toPlace = tokens[3]; // quarto parametro
      }

      if (!truckName || !fromPlace || !toPlace) return null;

      const truckEntry = Object.values(this.vehicles).find(
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
      const distance = this.calculateDistanceBetweenPlaces(
        fromPlaceEntry,
        toPlaceEntry
      );

      return {
        truckName,
        fromPlace,
        toPlace,
        distance,
        truckEntry,
        fromPlaceEntry,
        toPlaceEntry,
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
        if (this.planFormat === "PDDL+") {
          // Formato PDDL+ - step è un oggetto con proprietà action e duration
          actionPart = step.action.trim();
          duration = step.duration;
        } else {
          // Formato PDDL1/PDDL2 - step è una stringa con formato "timestamp: action"
          actionPart = step.split(": ")[1].trim();
          if (
            actionPart.startsWith("(drive-truck") ||
            actionPart.startsWith("(start-move")
          ) {
            const movementData = this.calculateMovementDistance(actionPart);
            if (movementData) {
              duration = movementData.distance; // Usa la distanza come durata
            }
          }
        }

        // Processa l'azione in base al tipo
        if (
  actionPart.startsWith("(drive-truck") ||
  actionPart.startsWith("(start-move")
) {
  await this.processDriveTruckStep(actionPart, duration);
} else if (actionPart.startsWith("(start-refuel")) {
  await this.processRefuelStep(actionPart, duration);
} else if (actionPart.startsWith("(stop-refuel")) {
  // Il rifornimento si ferma automaticamente, nessuna azione speciale
  console.log(`🛑 Fine rifornimento: ${actionPart}`);
} else if (actionPart.startsWith("(fly-airplane")) {
  await this.processFlyAirplaneStep(actionPart, duration);
} else if (actionPart.startsWith("(load-truck") || actionPart.startsWith("(load-airplane")) {
  await this.processLoadVehicleStep(actionPart, duration);
} else if (actionPart.startsWith("(unload-truck") || actionPart.startsWith("(unload-airplane")) {
  await this.processUnloadVehicleStep(actionPart, duration);
} else {
  console.warn(`Tipo di step non riconosciuto: ${actionPart}`);
}
        let delay = 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
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
    async loadPackageToVehicle(packageName, truckName) {
      return new Promise((resolve) => {
        const pkg = Object.values(this.packages).find(
          (p) => p.name === packageName
        );
        const truck = Object.values(this.vehicles).find(
          (t) => t.name === truckName
        );

        if (!pkg || !truck) {
          console.warn("Pacco o truck non trovato!");
          resolve();
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
      const truckPos = this.positions.vehicles[truckId];
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
        .duration(constants.MIN_ANIMATION_DURATION)
        .attr("transform", `translate(${truckPos.x}, ${truckPos.y})`)
        .on("end", () => {
          // Alla fine dell'animazione: rimuovi pacchetto dalla mappa
          pkgGroup.style("display", "none");
          console.log(
            `Il pacchetto ${packageName} è stato caricato nel truck ${truckName}.`
          );

          if (callback) callback();
        });
    },
    async unloadPackageFromVehicle(packageName, vehicleName) {
      return new Promise((resolve) => {
        const vehicle = Object.values(this.vehicles).find(
          (t) => t.name === vehicleName
        );
        const pkg = Object.values(this.packages).find(
          (p) => p.name === packageName
        );

        if (!vehicle || !pkg) {
          console.warn("Vehicle o package non trovato!");
          resolve();
          return;
        }

        if (vehicle.packages && vehicle.packages.includes(pkg)) {
          // Prima fai l'animazione
          this.animatePackageUnloadAsync(packageName, vehicleName, () => {
            // Poi aggiorna la logica nel callback dell'animazione
            //truck.unloadPackage(pkg);
            pkg.setLocation(vehicle.location);

            console.log(
              `Pacco ${packageName} scaricato da ${vehicleName} in ${vehicle.location.name}`
            );
            resolve();
          });
        } else {
          console.log(
            `Errore: Il pacco ${packageName} non si trova nel veicolo ${vehicleName}`
          );
          resolve();
        }
      });
    },
    animatePackageUnloadAsync(packageName, vehicleName, callback) {
      const pkgId = this.getPackageIdByName(packageName);

      // Il luogo di scarico è la location del veicolo
      const vehicle = Object.values(this.vehicles).find(
        (v) => v.name === vehicleName
      );
      const placeId = vehicle.location.id;

      // Calcola la posizione finale del package nel place
      const place = Object.values(this.places).find((p) => p.id === placeId);
      const packagesInPlace = Object.values(this.packages).filter(
        (p) => p.location && p.location.id === placeId
      );
      const packageIndex = packagesInPlace.length; // Sarà l'ultimo
      const { x: finalX, y: finalY } = this.getPackagePositionInPlace(
        place,
        packageIndex,
        packageIndex + 1
      );

      const pkgGroup = d3.select(`#package-${packageName}`);
      if (!pkgGroup.empty()) {
        pkgGroup.style("display", "block");
        pkgGroup
          .transition()
          .duration(constants.MIN_ANIMATION_DURATION)
          .attr(
            "transform",
            `translate(${finalX - constants.PACKAGE_SIZE}, ${
              finalY - constants.PACKAGE_SIZE / 2
            })`
          )
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

      const calculatedDuration = distance * MIN_DURATION;
      return Math.min(Math.max(calculatedDuration, MIN_DURATION), MAX_DURATION);
    },
    repositionPackagesInPlace(placeId) {
      const place = Object.values(this.places).find((p) => p.id === placeId);
      const packagesHere = Object.values(this.packages).filter(
        (p) => p.location && p.location.id === placeId
      );

      packagesHere.forEach((pkg, k) => {
        const { x: pkgX, y: pkgY } = this.getPackagePositionInPlace(
          place,
          k,
          packagesHere.length
        );
        const finalX = pkgX - constants.PACKAGE_SIZE;
        const finalY = pkgY - constants.PACKAGE_SIZE / 2;

        const pkgGroup = d3.select(`#package-${pkg.name}`);
        if (!pkgGroup.empty()) {
          pkgGroup
            .transition()
            .duration(constants.MIN_ANIMATION_DURATION / 2)
            .attr("transform", `translate(${finalX}, ${finalY})`);

          this.positions.packages[pkg.id] = { x: finalX, y: finalY };
        }
      });
    },
    unloadPackage(packageName, truckName) {
      this.unloadPackageFromVehicle(packageName, truckName);
      this.animatePackageUnload(packageName, truckName);
    },
    getTrucksInPlace(place) {
      return Object.values(this.vehicles).filter(
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
        pos.y -
        halfSide +
        ((k + 1) * constants.SIDE_LENGTH) / (numPackages + 1);
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
    getAirplanePositionInPlace(place, k, numAirplanes) {
      const pos = this.positions.places[place.id];
      const halfSide = constants.SIDE_LENGTH / 2;

      const spacing =
        (constants.SIDE_LENGTH * constants.AIRPLANE_SPACING_FACTOR) /
        (numAirplanes + 1);
      const airplaneX = pos.x - halfSide + (k + 1) * spacing;
      const airplaneY = pos.y - halfSide - constants.AIRPLANE_OFFSET_Y;

      return { x: airplaneX, y: airplaneY };
    },
    syncPackagePositionsOnTruck(truckName) {
      const truck = Object.values(this.vehicles).find(
        (t) => t.name === truckName
      );
      const truckId = this.getTruckIdByName(truckName);
      const truckPos = this.positions.vehicles[truckId];

      truck.packages.forEach((pkg) => {
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
      if (!this.steps || this.steps.length === 0) return "UNKNOWN";

      const firstStep = this.steps[0];

      // Formato PDDL+ (oggetti con start, action, duration)
      if (
        typeof firstStep === "object" &&
        firstStep.hasOwnProperty("start") &&
        firstStep.hasOwnProperty("action")
      ) {
        return "PDDL+";
      }

      // Formato PDDL1/PDDL2 - step è una stringa con formato "timestamp: action"
      if (typeof firstStep === "string") {
        return this.distances ? "PDDL2" : "PDDL1";
      }

      return "UNKNOWN";
    },
    async startRefuelAnimation(
      truckId,
      truckName,
      stationName,
      duration = 3000
    ) {
      const truckGroup = d3.select(`#truck-${truckName}`);

      if (truckGroup.empty()) {
        console.warn(`Truck ${truckId} non trovato nel DOM`);
        return;
      }

      console.log(
        `Iniziando rifornimento per ${truckName} alla stazione ${stationName}`
      );

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
          .duration(duration * constants.MIN_ANIMATION_DURATION || 3000)
          .attr("width", 50)
          .on("end", () => {
            statusText.text("");

            // Aggiorna lo stato del carburante
            /* if (this.vehicles[truckName]) {
          this.vehicles[truckName].fuel = 100;
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
    updateGasolineProgressBar(truck) {
      const svg = d3.select(this.$refs.svg);
      const gasolinePercentage = truck.getGasolinePercentage();
      const progressBarWidth = 40;
      const fillWidth = (progressBarWidth - 2) * (gasolinePercentage / 100);

      // Colore in base al livello di gasoline
      let fillColor = "#4CAF50"; // Verde per > 50%
      if (gasolinePercentage <= 25) {
        fillColor = "#F44336"; // Rosso per <= 25%
      } else if (gasolinePercentage <= 50) {
        fillColor = "#FF9800"; // Arancione per <= 50%
      }

      // Aggiorna la barra
      svg
        .select(`.gasoline-bar-${truck.name}`)
        .transition()
        .duration(200)
        .attr("width", fillWidth)
        .attr("fill", fillColor);

      // Aggiorna il testo percentuale
      svg
        .select(`.gasoline-text-${truck.name}`)
        .text(`${Math.round(gasolinePercentage)}%`);
    },

    // Processa le azioni che modificano la gasoline
   /*  async processRefuelStep(actionPart, duration) {
  const tokens = actionPart.replace(/[()]/g, "").split(" ");
  const truckName = tokens[1];
  
  console.log(`⛽ Rifornimento: Truck ${truckName} per ${duration} unità di tempo`);
  
  const truckObj = Object.values(this.vehicles).find(v => v.name === truckName);
  if (!truckObj || !truckObj.hasGasoline()) {
    console.warn(`❌ Truck ${truckName} non trovato o senza sistema benzina`);
    return;
  }
  
  const initialGasoline = truckObj.gasoline;
  const refuelAmount = this.calculateRefuelAmount(duration);
  const maxPossibleRefuel = Math.min(refuelAmount, truckObj.maxGasoline - truckObj.gasoline);
  
  console.log(`⛽ Rifornimento ${truckName}:`);
  console.log(`   Benzina iniziale: ${initialGasoline}`);
  console.log(`   Rifornimento teorico: ${refuelAmount}`);
  console.log(`   Rifornimento effettivo: ${maxPossibleRefuel}`);
  
  // Anima il rifornimento
  const ANIMATION_SCALE_FACTOR = 100;
  const animationDurationMs = (duration || 1) * ANIMATION_SCALE_FACTOR;
  const steps = Math.min(50, Math.max(10, Math.floor(animationDurationMs / 100)));
  const refuelPerStep = maxPossibleRefuel / steps;
  const intervalMs = animationDurationMs / steps;
  
  return new Promise((resolve) => {
    let currentStep = 0;
    
    const refuelInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(refuelInterval);
        
        // Assicurati che il valore finale sia esatto
        const finalGasoline = Math.min(truckObj.maxGasoline, initialGasoline + maxPossibleRefuel);
        truckObj.setGasoline(finalGasoline);
        this.updateGasolineBar(truckObj.name, truckObj.gasoline);
        
        console.log(`✅ Rifornimento completato: ${initialGasoline} → ${truckObj.gasoline}`);
        resolve();
        return;
      }
      
      truckObj.addGasoline(refuelPerStep);
      this.updateGasolineBar(truckObj.name, truckObj.gasoline);
      currentStep++;
    }, intervalMs);
  });
}, */
    calculateGasolineConsumption(duration) {
      const CONSUMPTION_RATE = this.fuelRates?.consumptionRate; // Fallback al valore di default
      return duration * CONSUMPTION_RATE;
    },

    calculateRefuelAmount(duration) {
      const REFUEL_RATE = this.fuelRates?.refuelRate ; // Fallback al valore di default
      return duration * REFUEL_RATE;
    },
    updateGasolineBar(truckName, newGasolineLevel) {
      const svg = d3.select(this.$refs.svg);
      const truckGroup = svg.select(`#truck-${truckName}`);

      if (truckGroup.empty()) return;

      const gasolinePercentage = Math.min(100, Math.max(0, newGasolineLevel));
      const fillWidth =
        (constants.GASOLINE_BAR.WIDTH * gasolinePercentage) / 100;

      // Determina il colore
      const fillColor =
        gasolinePercentage < 30
          ? constants.GASOLINE_BAR.LOW_FUEL_COLOR
          : constants.GASOLINE_BAR.FILL_COLOR;

      // Anima la larghezza della barra
      truckGroup
        .select(".gasoline-bar-fill")
        .transition()
        .duration(100)
        .attr("width", fillWidth)
        .attr("fill", fillColor);

      // Aggiorna il testo percentuale
      truckGroup
        .select(".gasoline-text")
        .transition()
        .duration(100)
        .text(`${Math.round(gasolinePercentage)}%`);
    },
    async animateGasolineConsumption(truckObj, totalConsumption, animationDurationMs) {
  if (!truckObj.hasGasoline() || totalConsumption <= 0 || animationDurationMs <= 0) return;
  
  const initialGasoline = truckObj.gasoline;
  const steps = Math.min(50, Math.max(10, Math.floor(animationDurationMs / 100)));
  const consumptionPerStep = totalConsumption / steps;
  const intervalMs = animationDurationMs / steps;
  
  console.log(`🔋 Animazione consumo benzina per ${truckObj.name}:`);
  console.log(`   Consumo totale: ${totalConsumption}, Steps: ${steps}, Durata: ${animationDurationMs}ms`);
  
  return new Promise((resolve) => {
    let currentStep = 0;
    
    const consumptionInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(consumptionInterval);
        
        // Assicurati che il valore finale sia esatto
        const finalGasoline = Math.max(0, initialGasoline - totalConsumption);
        truckObj.setGasoline(finalGasoline);
        this.updateGasolineBar(truckObj.name, truckObj.gasoline);
        
        console.log(`✅ Consumo completato: ${initialGasoline} → ${truckObj.gasoline}`);
        resolve();
        return;
      }
      
      truckObj.consumeGasoline(consumptionPerStep);
      this.updateGasolineBar(truckObj.name, truckObj.gasoline);
      currentStep++;
    }, intervalMs);
  });
},
    drawGasolineBar(truckGroup, truck, x, y) {
  if (!truck.hasGasoline()) return;
  
  const gasolinePercentage = truck.getGasolinePercentage();
  const fillWidth = (constants.GASOLINE_BAR.WIDTH * gasolinePercentage) / 100;
  
  // Determina il colore in base al livello di benzina
  const fillColor = gasolinePercentage < 30 ? 
    constants.GASOLINE_BAR.LOW_FUEL_COLOR : 
    constants.GASOLINE_BAR.FILL_COLOR;

  // Background della barra
  truckGroup
    .append('rect')
    .attr('class', 'gasoline-bar-bg')
    .attr('x', x - constants.GASOLINE_BAR.WIDTH / 2)
    .attr('y', y + constants.GASOLINE_BAR.OFFSET_Y)
    .attr('width', constants.GASOLINE_BAR.WIDTH)
    .attr('height', constants.GASOLINE_BAR.HEIGHT)
    .attr('fill', constants.GASOLINE_BAR.BACKGROUND_COLOR)
    .attr('rx', constants.GASOLINE_BAR.BORDER_RADIUS);

  // Barra di riempimento
  truckGroup
    .append('rect')
    .attr('class', 'gasoline-bar-fill')
    .attr('x', x - constants.GASOLINE_BAR.WIDTH / 2)
    .attr('y', y + constants.GASOLINE_BAR.OFFSET_Y)
    .attr('width', fillWidth)
    .attr('height', constants.GASOLINE_BAR.HEIGHT)
    .attr('fill', fillColor)
    .attr('rx', constants.GASOLINE_BAR.BORDER_RADIUS);

  // Testo percentuale
  truckGroup
    .append('text')
    .attr('class', 'gasoline-text')
    .attr('x', x)
    .attr('y', y + constants.GASOLINE_BAR.OFFSET_Y - 2)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px')
    .attr('font-family', 'monospace')
    .attr('fill', '#666')
    .text(`${Math.round(gasolinePercentage)}%`);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  background: rgba(255, 255, 255, 0.95);
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
