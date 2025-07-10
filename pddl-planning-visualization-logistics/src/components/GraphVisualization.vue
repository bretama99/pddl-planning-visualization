<template>
  <div>
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
      <StepPanel
        :steps="steps"
        :currentStepIndex="currentStepIndex"
        :planFormat="planFormat"
        :isPlaying="isPlaying"
        :isPaused="isPaused"
        @play-steps="playSteps"
        @pause-steps="pauseSteps"
        @resume-steps="resumeSteps"
      />
    </div>
  </div>
</template>

<script>
import StepPanel from "./StepPanel.vue";
import * as d3 from "d3";
import * as constants from "../constants.js";

export default {
  name: "MapVisualizer",
  components: {
    StepPanel,
  },
  props: {
    cities: Object,
    places: Object,
    vehicles: Object,
    packages: Object,
    steps: Array,
    distances: Array,
    fuelRates: Object, // Nuova prop
    visualizerKey: { type: Number, required: false },
    executionToken: { type: Number, required: true }, // Nuova prop
    sharedState: { type: Object, required: true },
  },
  data() {
    return {
      planFormat: null,
      width: window.innerWidth * 0.75,
      height: Math.max(500, window.innerHeight * 0.7),
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
  // Nel componente MapVisualizer
  watch: {
    visualizerKey: {
      handler(newKey, oldKey) {
        if (oldKey !== undefined && newKey !== oldKey) {
          // La chiave è cambiata, ferma tutto
          this.isPlaying = false;
          this.isPaused = false;
          this.pauseRequested = true; // Questo dovrebbe fermare il loop
          this.pausedStepIndex = null;
        }
      },
      immediate: false,
    },
  },
  mounted() {
    console.log(`🔵 COMPONENTE MONTATO con key: ${this.visualizerKey}`);
    this.resetAllInternal();
    this.initializeDistances();
    this.planFormat = this.determinePlanFormat();
    console.log("Formato del piano:", this.planFormat);
    this.initPositions();
    this.drawGraph();
  },
  created() {
    console.log(`🟢 COMPONENTE CREATO con key: ${this.visualizerKey}`);
  },
  beforeUnmount() {
    console.log(
      `🟡 COMPONENTE STA PER ESSERE DISTRUTTO con key: ${this.visualizerKey}`
    );
  },
  unmounted() {
    console.log(`🔴 COMPONENTE DISTRUTTO con key: ${this.visualizerKey}`);
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
              x: cityPos.x + constants.PLACE_RADIUS * Math.cos(angle),
              y: cityPos.y + constants.PLACE_RADIUS * Math.sin(angle),
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
            this.drawGasolineBar(
              truckGroup,
              truck,
              0,
              -constants.TRUCK_SIZE / 2
            );
          }
          if (truck.hasCapacity()) {
            this.drawCapacityBar(
              truckGroup,
              truck,
              0,
              -constants.TRUCK_SIZE / 2
            );
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

          if (airplane.hasCapacity()) {
            this.drawCapacityBar(
              airplaneGroup,
              airplane,
              0,
              -constants.TRUCK_SIZE / 2
            );
          }

          // Aggiorna posizione
          this.positions.vehicles[airplane.id] = {
            x: airplaneX,
            y: airplaneY,
          };
        });

        const dronesHere = this.getVehiclesInPlaceBySubtype(
          constants.VEHICLE_SUBTYPES.DRONE,
          place
        );
        const numDrones = dronesHere.length;

        dronesHere.forEach((drone, k) => {
          // Posizionamento identico a quello dei camion
          const { x: droneX, y: droneY } = this.getDronePositionInPlace(
            place,
            k,
            numDrones
          );

          const subtype = drone.subtype;
          const imageHref = constants.VEHICLE_IMAGE_PATHS[subtype];
          const imageSize = constants.VEHICLE_IMAGE_SIZES[subtype];

          const droneGroup = g
            .append("g")
            .attr("id", `${subtype}-${drone.name}`)
            .attr(
              "transform",
              `translate(${droneX}, ${droneY - constants.TRUCK_OFFSET_Y})`
            );

          droneGroup
            .append("image")
            .attr("x", 0)
            .attr("y", -imageSize.height / 2)
            .attr("width", imageSize.width)
            .attr("height", imageSize.height)
            .attr("href", imageHref);

          droneGroup
            .append("text")
            .attr("x", constants.TRUCK_LABEL_OFFSET_X)
            .attr("y", constants.TRUCK_LABEL_OFFSET_Y)
            .attr("text-anchor", "start")
            .attr("font-size", constants.TRUCK_LABEL_FONT_SIZE)
            .text(drone.name);

          // Aggiorna posizione
          this.positions.vehicles[drone.id] = {
            x: droneX,
            y: droneY - constants.TRUCK_OFFSET_Y,
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
      const actualAnimationDuration =
        this.calculateAnimationDuration(animationDuration);

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
        drone: this.getDronePositionInPlace.bind(this),
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
        `✈️ Moving: Airplane ${airplaneName} da ${fromPlace} a ${toPlace}`
      );

      // Muovi l'aereo come faresti con un truck, ma con subtype airplane
      await this.moveVehicleToPos(
        airplaneName,
        toPlace,
        duration,
        movementData
      );

      console.log(
        `✅ Movement completed: Airplane ${airplaneName} ora in ${toPlace}`
      );
    },
    async processFlyDroneStep(
      actionPart,
      duration = null,
      movementData = null
    ) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      const droneName = tokens[1]; // Es: drone2
      const fromPlace = tokens[2]; // Es: pos2
      const toPlace = tokens[3]; // Es: apt2
      const toCity = tokens[4]; // Es: cit2

      console.log(
        `🚁 Movement: Drone ${droneName} da ${fromPlace} a ${toPlace} nella città ${toCity}`
      );

      await this.moveVehicleToPos(droneName, toPlace, duration, movementData);

      console.log(
        `✅ Movement completed: Drone ${droneName} ora in ${toPlace} (${toCity})`
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

      console.log(
        `🚛 Moving: Truck ${truckName} da ${fromPlace} a ${toPlace}`
      );

      // Trova l'oggetto truck per gestire la benzina
      const truckObj = Object.values(this.vehicles).find(
        (v) => v.name === truckName
      );

      // Calcola il consumo di benzina se abbiamo la durata
      let gasolineConsumption = 0;
      if (duration && truckObj && truckObj.hasGasoline()) {
        gasolineConsumption = this.calculateGasolineConsumption(duration);
        console.log(
          `⛽ Consumo benzina previsto: ${gasolineConsumption} unità (durata: ${duration})`
        );

        // Verifica se il truck ha abbastanza benzina
        if (truckObj.gasoline < gasolineConsumption) {
          console.warn(
            `⚠️ ATTENZIONE: ${truckName} potrebbe rimanere senza benzina!`
          );
          console.warn(
            `   Benzina attuale: ${truckObj.gasoline}, Consumo previsto: ${gasolineConsumption}`
          );
        }
      }

      // CALCOLA LA DURATA EFFETTIVA prima di avviare le animazioni
      const animationDuration = duration !== null ? duration : 1;
      const actualDuration = this.calculateAnimationDuration(animationDuration);

      console.log(`⏱️ Durata effettiva calcolata: ${actualDuration}ms`);

      // Avvia le animazioni in PARALLELO
      const promises = [];

      // 1. Movimento del truck
      promises.push(
        this.moveVehicleToPos(truckName, toPlace, duration, movementData)
      );

      // 2. Consumo benzina (se applicabile) - IN PARALLELO con la stessa durata
      if (gasolineConsumption > 0 && truckObj) {
        promises.push(
          this.animateGasolineConsumption(
            truckObj,
            gasolineConsumption,
            actualDuration
          )
        );
      }

      // Aspetta che entrambe le animazioni finiscano
      await Promise.all(promises);

      console.log(
        `✅ Movement completed: Truck ${truckName} ora in ${toPlace}`
      );

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
      const vehicleObj = Object.values(this.vehicles).find(
        (v) => v.name === vehicleName
      );
      if (vehicleObj && vehicleObj.hasCapacity()) {
        this.updateCapacityBar(
          vehicleName,
          vehicleObj.packages.length,
          vehicleObj.capacity
        );
      }

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
      const vehicleObj = Object.values(this.vehicles).find(
        (v) => v.name === truckName
      );
      if (vehicleObj && vehicleObj.hasCapacity()) {
        this.updateCapacityBar(
          truckName,
          vehicleObj.packages.length,
          vehicleObj.capacity
        );
      }

      console.log(
        `✅ Scaricamento completato: Package ${packageName} scaricato da truck ${truckName} in ${placeName}`
      );
    },
    async processRefuelStep(actionPart, duration) {
      const tokens = actionPart.replace(/[()]/g, "").split(" ");
      const truckName = tokens[1];

      console.log(
        `⛽ Rifornimento: Truck ${truckName} per ${duration} unità di tempo`
      );

      const truckObj = Object.values(this.vehicles).find(
        (v) => v.name === truckName
      );
      if (!truckObj || !truckObj.hasGasoline()) {
        console.warn(
          `❌ Truck ${truckName} non trovato o senza sistema benzina`
        );
        return;
      }

      const initialGasoline = truckObj.gasoline;
      const refuelAmount = this.calculateRefuelAmount(duration);
      const maxPossibleRefuel = Math.min(
        refuelAmount,
        truckObj.maxGasoline - truckObj.gasoline
      );

      console.log(`⛽ Rifornimento ${truckName}:`);
      console.log(`   Benzina iniziale: ${initialGasoline}`);
      console.log(`   Rifornimento teorico: ${refuelAmount}`);
      console.log(`   Rifornimento effettivo: ${maxPossibleRefuel}`);

      // Anima il rifornimento
      const animationDurationMs = (duration || 1) * 1000; // Converti secondi in millisecondi
      const steps = Math.min(
        50,
        Math.max(10, Math.floor(animationDurationMs / 100))
      );
      const refuelPerStep = maxPossibleRefuel / steps;
      const intervalMs = animationDurationMs / steps;
      console.log(
        `   Passi di rifornimento: ${steps} (${refuelPerStep} per passo) con intervallo di ${intervalMs} ms`
      );

      return new Promise((resolve) => {
        let currentStep = 0;

        const refuelInterval = setInterval(() => {
          if (currentStep >= steps) {
            clearInterval(refuelInterval);

            // Assicurati che il valore finale sia esatto
            const finalGasoline = Math.min(
              truckObj.maxGasoline,
              initialGasoline + maxPossibleRefuel
            );
            truckObj.setGasoline(finalGasoline);
            this.updateGasolineBar(truckObj.name, truckObj.gasoline);

            console.log(
              `✅ Rifornimento completato: ${initialGasoline} → ${truckObj.gasoline}`
            );
            resolve();
            return;
          }

          truckObj.addGasoline(refuelPerStep);
          this.updateGasolineBar(truckObj.name, truckObj.gasoline);
          currentStep++;
        }, intervalMs);
      });
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
      const myToken = this.sharedState.executionToken;
      console.log(
        `Inizio esecuzione steps da indice ${startIndex} con token ${myToken}`
      );

      for (let i = startIndex; i < steps.length; i++) {
        console.log(
          `Token corrente: ${this.sharedState.executionToken}, mio token: ${myToken}, shouldStop: ${this.sharedState.shouldStop}`
        );

        // Controlla se deve fermarsi
        if (
          this.sharedState.shouldStop ||
          this.sharedState.executionToken !== myToken
        ) {
          console.log("Esecuzione interrotta");
          this.isPlaying = false;
          this.isPaused = false;
          this.pauseRequested = false;
          this.pausedStepIndex = null;
          break;
        }
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
        } else if (actionPart.startsWith("(fly-drone")) {
  await this.processFlyDroneStep(actionPart, duration);
        }
        else if (
          actionPart.startsWith("(load-truck") ||
          actionPart.startsWith("(load-airplane") ||
          actionPart.startsWith("(load-drone")
        ) {
          await this.processLoadVehicleStep(actionPart, duration);
        } else if (
          actionPart.startsWith("(unload-truck") ||
          actionPart.startsWith("(unload-airplane") ||
          actionPart.startsWith("(unload-drone")
        ) {
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
      // Log per debug
      console.log("[pauseSteps] Chiamata. Stato attuale:", {
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        pauseRequested: this.pauseRequested,
        pausedStepIndex: this.pausedStepIndex,
      });
      this.pauseRequested = true;
      this.isPaused = true; // Aggiorna subito lo stato per disabilitare il tasto Play
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
            vehicle.unloadPackage(pkg);
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

          this.positions.packages[pkg.id] = { finalX, finalY };
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
    getDronePositionInPlace(place, k, numDrones) {
      const pos = this.positions.places[place.id];
      const halfSide = constants.SIDE_LENGTH / 2;

      // Spaziatura orizzontale dei droni sotto al place
      const spacing =
        (constants.SIDE_LENGTH * constants.DRONE_SPACING_FACTOR) /
        (numDrones + 1);
      const droneX = pos.x - halfSide + (k + 1) * spacing;

      // Posizionati sotto al place
      const droneY = pos.y + halfSide + constants.DRONE_OFFSET_Y;

      return { x: droneX, y: droneY };
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
    calculateGasolineConsumption(duration) {
      const CONSUMPTION_RATE = this.fuelRates?.consumptionRate; // Fallback al valore di default
      return duration * CONSUMPTION_RATE;
    },

    calculateRefuelAmount(duration) {
      const REFUEL_RATE = this.fuelRates?.refuelRate; // Fallback al valore di default
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
    async animateGasolineConsumption(
      truckObj,
      totalConsumption,
      animationDurationMs
    ) {
      if (
        !truckObj.hasGasoline() ||
        totalConsumption <= 0 ||
        animationDurationMs <= 0
      )
        return;

      const initialGasoline = truckObj.gasoline;
      const steps = Math.min(
        50,
        Math.max(10, Math.floor(animationDurationMs / 100))
      );
      const consumptionPerStep = totalConsumption / steps;
      const intervalMs = animationDurationMs / steps;

      console.log(`🔋 Animazione consumo benzina per ${truckObj.name}:`);
      console.log(
        `   Consumo totale: ${totalConsumption}, Steps: ${steps}, Durata: ${animationDurationMs}ms`
      );

      return new Promise((resolve) => {
        let currentStep = 0;

        const consumptionInterval = setInterval(() => {
          if (currentStep >= steps) {
            clearInterval(consumptionInterval);

            // Assicurati che il valore finale sia esatto
            const finalGasoline = Math.max(
              0,
              initialGasoline - totalConsumption
            );
            truckObj.setGasoline(finalGasoline);
            this.updateGasolineBar(truckObj.name, truckObj.gasoline);

            console.log(
              `✅ Consumo completato: ${initialGasoline} → ${truckObj.gasoline}`
            );
            resolve();
            return;
          }

          truckObj.consumeGasoline(consumptionPerStep);
          this.updateGasolineBar(truckObj.name, truckObj.gasoline);
          currentStep++;
        }, intervalMs);
      });
    },
    drawCapacityBar(truckGroup, truck, offsetX, offsetY) {
      if (!truck.hasCapacity()) return;

      const barY = offsetY + constants.IMAGE_SIZES.TRUCK_SIZE; // Posiziona sotto l'immagine del truck

      // Contenitore della barra capacità
      const capacityBarGroup = truckGroup
        .append("g")
        .attr("class", "capacity-bar-group")
        .attr("transform", `translate(${offsetX}, ${barY})`);

      // Sfondo della barra
      capacityBarGroup
        .append("rect")
        .attr("class", "capacity-bar-background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", constants.CAPACITY_BAR.WIDTH)
        .attr("height", constants.CAPACITY_BAR.HEIGHT)
        .attr("fill", constants.CAPACITY_BAR.BACKGROUND_COLOR)
        .attr("stroke", constants.CAPACITY_BAR.BORDER_COLOR)
        .attr("stroke-width", 1);

      // Riempimento della barra (segmenti discreti)
      const packagesCount = truck.packages.length;
      const capacity = truck.capacity;

      this.drawCapacitySegments(capacityBarGroup, packagesCount, capacity);

      // Testo con i numeri
      capacityBarGroup
        .append("text")
        .attr("class", "capacity-text")
        .attr("x", constants.CAPACITY_BAR.WIDTH + 5)
        .attr("y", constants.CAPACITY_BAR.HEIGHT / 2)
        .attr("dy", "0.35em")
        .attr("font-size", constants.CAPACITY_BAR.FONT_SIZE)
        .attr("fill", constants.CAPACITY_BAR.TEXT_COLOR)
        .text(`${packagesCount}/${capacity}`);
    },
    drawCapacitySegments(capacityBarGroup, packagesCount, capacity) {
      // Rimuovi segmenti esistenti
      capacityBarGroup.selectAll(".capacity-segment").remove();

      if (capacity === 0) return;

      const segmentWidth =
        (constants.CAPACITY_BAR.WIDTH - (capacity - 1)) / capacity; // Sottrai spazio per i separatori

      for (let i = 0; i < capacity; i++) {
        const segmentX = i * (segmentWidth + 1); // +1 per il separatore
        const isFilled = i < packagesCount;

        capacityBarGroup
          .append("rect")
          .attr("class", "capacity-segment")
          .attr("x", segmentX)
          .attr("y", 1) // Piccolo offset dal bordo
          .attr("width", segmentWidth)
          .attr("height", constants.CAPACITY_BAR.HEIGHT - 2) // Piccolo offset dal bordo
          .attr(
            "fill",
            isFilled
              ? constants.CAPACITY_BAR.FILL_COLOR
              : constants.CAPACITY_BAR.EMPTY_COLOR
          )
          .attr("opacity", isFilled ? 1 : 0.3);
      }
    },
    updateCapacityBar(truckName, packagesCount, capacity) {
      const svg = d3.select(this.$refs.svg);
      const truck = Object.values(this.vehicles).find(
        (v) => v.name === truckName
      );
      const subtype = truck.subtype;
      const truckGroup = svg.select(`#${subtype}-${truckName}`);

      if (truckGroup.empty()) return;

      const capacityBarGroup = truckGroup.select(".capacity-bar-group");
      if (capacityBarGroup.empty()) return;

      // Ridisegna i segmenti con animazione
      this.animateCapacitySegments(capacityBarGroup, packagesCount, capacity);

      // Aggiorna il testo
      capacityBarGroup
        .select(".capacity-text")
        .transition()
        .duration(300)
        .text(`${packagesCount}/${capacity}`);
    },
    animateCapacitySegments(capacityBarGroup, packagesCount, capacity) {
      const segmentWidth =
        (constants.CAPACITY_BAR.WIDTH - (capacity - 1)) / capacity;

      // Seleziona tutti i segmenti esistenti
      const segments = capacityBarGroup.selectAll(".capacity-segment");

      segments.each(function (d, i) {
        const segment = d3.select(this);
        const isFilled = i < packagesCount;

        segment
          .transition()
          .duration(300)
          .attr(
            "fill",
            isFilled
              ? constants.CAPACITY_BAR.FILL_COLOR
              : constants.CAPACITY_BAR.EMPTY_COLOR
          )
          .attr("opacity", isFilled ? 1 : 0.3);
      });
    },
    drawGasolineBar(truckGroup, truck, x, y) {
      if (!truck.hasGasoline()) return;

      const gasolinePercentage = truck.getGasolinePercentage();
      const fillWidth =
        (constants.GASOLINE_BAR.WIDTH * gasolinePercentage) / 100;

      // Determina il colore in base al livello di benzina
      const fillColor =
        gasolinePercentage < 30
          ? constants.GASOLINE_BAR.LOW_FUEL_COLOR
          : constants.GASOLINE_BAR.FILL_COLOR;

      // Background della barra
      truckGroup
        .append("rect")
        .attr("class", "gasoline-bar-bg")
        .attr("x", x - constants.GASOLINE_BAR.WIDTH / 2)
        .attr("y", y + constants.GASOLINE_BAR.OFFSET_Y)
        .attr("width", constants.GASOLINE_BAR.WIDTH)
        .attr("height", constants.GASOLINE_BAR.HEIGHT)
        .attr("fill", constants.GASOLINE_BAR.BACKGROUND_COLOR)
        .attr("rx", constants.GASOLINE_BAR.BORDER_RADIUS);

      // Barra di riempimento
      truckGroup
        .append("rect")
        .attr("class", "gasoline-bar-fill")
        .attr("x", x - constants.GASOLINE_BAR.WIDTH / 2)
        .attr("y", y + constants.GASOLINE_BAR.OFFSET_Y)
        .attr("width", fillWidth)
        .attr("height", constants.GASOLINE_BAR.HEIGHT)
        .attr("fill", fillColor)
        .attr("rx", constants.GASOLINE_BAR.BORDER_RADIUS);

      // Testo percentuale
      truckGroup
        .append("text")
        .attr("class", "gasoline-text")
        .attr("x", x)
        .attr("y", y + constants.GASOLINE_BAR.OFFSET_Y - 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-family", "monospace")
        .attr("fill", "#666")
        .text(`${Math.round(gasolinePercentage)}%`);
    },
    clearDistanceMap() {
      if (this.distanceMap) {
        this.distanceMap.clear();
      }
    },
    resetPlanFormat() {
      this.planFormat = null;
    },
    clearPositions() {
      if (this.positions) {
        if (this.positions.cities) this.positions.cities = {};
        if (this.positions.places) this.positions.places = {};
        if (this.positions.vehicles) this.positions.vehicles = {};
        if (this.positions.packages) this.positions.packages = {};
      }
    },
    resetAllInternal() {
      this.clearDistanceMap();
      this.resetPlanFormat();
      this.clearPositions();
    },
  },
};
</script>

<style scoped>
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
  margin-left: 16px;
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
