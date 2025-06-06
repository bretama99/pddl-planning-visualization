/* eslint-disable */
<template>
      <button @click="moveTruckToPos('tru1', 'pos2')">Sposta tru1 in pos2</button>
      <button @click="moveTruckToPos('tru1', 'pos3')">Sposta tru1 in pos3</button>
      <button @click="moveTruckToPos('tru1', 'pos4')">Sposta tru1 in pos4</button>
      <button @click="playSteps">▶️ Play Steps</button>



  <div ref="container" class="graph-container">
    <svg ref="svg" :width="width" :height="height" style="border:1px solid #ccc;" @click="handleSvgClick"
></svg>
  </div>
  
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'MapVisualizer',
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
      }
    };
  },
  mounted() {
    this.initPositions();
    this.drawGraph();
  },
  watch: {
    cities: {
      handler() { this.initPositions(); this.drawGraph(); },
      deep: true,
    },
    places: {
      handler() { this.initPositions(); this.drawGraph(); },
      deep: true,
    },
    trucks: {
      handler() { this.drawGraph(); },
      deep: true,
    },
    packages: {
      handler() { this.drawGraph(); },
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
            y: 200
          };
        }
      });

      const radius = 80;
      Object.values(this.places).forEach(place => {
        if (!this.positions.places[place.id]) {
          const cityPos = this.positions.cities[place.city.name];
          if (cityPos) {
            const placesInCity = Object.values(this.places).filter(p => p.city.name === place.city.name);
            const idx = placesInCity.findIndex(p => p.id === place.id);
            const numPlaces = placesInCity.length;
            const angle = (2 * Math.PI / numPlaces) * idx;
            this.positions.places[place.id] = {
              x: cityPos.x + radius * Math.cos(angle),
              y: cityPos.y + radius * Math.sin(angle)
            };
            console.log(`Posizione per il luogo ${place.name}:`, this.positions.places[place.id]);
          }
        }
      });
    },
    drawGraph() {
      const svg = d3.select(this.$refs.svg);
      svg.selectAll('*').remove();

      this.zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(this.zoom);
      const g = svg.append('g');

      // CITIES
      Object.entries(this.cities).forEach(([cityId, city]) => {
        const pos = this.positions.cities[city.name];
        if (!pos) return;

        const cityGroup = g.append('g')
          .attr('id', `city-${city.name}`);

        cityGroup.append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 80)
          .attr('fill', '#add8e6')
          .attr('stroke', '#333');

        cityGroup.append('text')
          .attr('x', pos.x)
          .attr('y', pos.y)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(city.name);
      });

      // PLACES
      const side = 50;
      const halfSide = side / 2;

      Object.values(this.places).forEach(place => {
        const pos = this.positions.places[place.id];
        if (!pos) return;

        const placeGroup = g.append('g')
          .attr('id', `place-${place.id}`);

        placeGroup.append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 15)
          .attr('fill', '#90ee90')
          .attr('stroke', '#333');

        placeGroup.append('text')
          .attr('x', pos.x)
          .attr('y', pos.y + 30)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .text(place.name);

        // PACKAGES (sinistra)
        const packagesHere = Object.values(this.packages).filter(p => p.location.id === place.id);
        const numPackages = packagesHere.length;
        packagesHere.forEach((pkg, k) => {
          const pkgY = pos.y - halfSide + ((k + 1) * side) / (numPackages + 1);
          const pkgX = pos.x - halfSide - 10;

          const pkgGroup = g.append('g')
            .attr('id', `package-${pkg.name}`);

          pkgGroup.append('rect')
            .attr('x', pkgX - 15)
            .attr('y', pkgY - 7)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#ffa500')
            .attr('stroke', '#333');

          pkgGroup.append('text')
            .attr('x', pkgX - 18)
            .attr('y', pkgY + 4)
            .attr('text-anchor', 'end')
            .attr('font-size', '8px')
            .text(pkg.name);

          // Salva posizione del package
          this.positions.packages[pkg.id] = { x: pkgX - 15, y: pkgY - 7 };
        });

        // TRUCKS (destra)
        const trucksHere = Object.values(this.trucks).filter(t => t.location.id === place.id);
        const numTrucks = trucksHere.length;
        trucksHere.forEach((truck, k) => {
          const truckY = pos.y - halfSide + ((k + 1) * side) / (numTrucks + 1);
          const truckX = pos.x + halfSide + 10;

          const truckGroup = g.append('g')
            .attr('id', `truck-${truck.name}`)
            .attr('transform', `translate(${truckX}, ${truckY - 7})`); 

          truckGroup.append('rect')
            .attr('x', 0)
            .attr('y', -7)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', '#ff69b4')
            .attr('stroke', '#333');

          truckGroup.append('text')
            .attr('x',  18)
            .attr('y', 4)
            .attr('text-anchor', 'start')
            .attr('font-size', '8px')
            .text(truck.name);

          // Salva posizione del truck
          this.positions.trucks[truck.id] = { x: truckX, y: truckY - 7 };
          console.log(`Posizione iniziale per il truck ${truck.name}:`, this.positions.trucks[truck.id]);
        });
      });
    },
    getPlaceIdByName(name) {
      const placeEntry = Object.values(this.places).find(p => p.name === name);
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
      console.error(`Posizione per il truck con ID ${truckId} non trovata!`);
      resolve();
      return;
    }
    
    console.log(`Animazione del truck ${truckName} da (${this.positions.trucks[truckId].x},${this.positions.trucks[truckId].y}) a (${newX}, ${newY})`);
    console.log(`I delta sono: (${newX - this.positions.trucks[truckId].x}, ${newY - this.positions.trucks[truckId].y})`);
    
    truckGroup.transition()
      .duration(1000)
      .attr('transform', `translate(${newX}, ${newY})`)
      .on('end', () => {
        // Aggiorna la posizione nello stato
        console.log('Transform finale nel DOM:', truckGroup.attr('transform'));
        this.positions.trucks[truckId].x = newX;
        this.positions.trucks[truckId].y = newY;
        console.log(`Posizione aggiornata per il truck ${truckName}:`, this.positions.trucks[truckId]);
        
        resolve(); // Risolvi la Promise quando l'animazione è completata
      });
  });
},
    getTruckIdByName(name) {
    const truckEntry = Object.values(this.trucks).find(t => t.name === name);
    return truckEntry ? truckEntry.id : null;
    },
    async moveTruckToPos(truckName, placeName) {
  const truckEntry = Object.values(this.trucks).find(t => t.name === truckName);
  if (!truckEntry) return;

  const newPlaceEntry = Object.values(this.places).find(p => p.name === placeName);
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

  const trucksHere = Object.values(this.trucks).filter(t => t.location.id === placeId);
  const numTrucks = trucksHere.length;
  const halfSide = 25;
  const side = 50;

  // Crea un array di Promise per tutte le animazioni
  const animationPromises = trucksHere.map((truck, k) => {
    const truckY = placePos.y - halfSide + ((k + 1) * side) / (numTrucks + 1);
    const truckX = placePos.x + halfSide + 10;
    
    // Restituisce la Promise dell'animazione
    return this.animateTruck(truck.name, truckX, truckY);
  });

  // Aspetta che tutte le animazioni siano completate
  await Promise.all(animationPromises);
},
    async processStepsAndMoveTrucks(steps) {
      for (const step of steps) {
        // step ad esempio: "1.0: (drive-truck tru1 pos1 pos2 cit1)"
        const actionPart = step.split(': ')[1].trim();

        if (actionPart.startsWith('(drive-truck')) {
          const tokens = actionPart.replace(/[()]/g, '').split(' ');
          const truckName = tokens[1];
          const fromPlace = tokens[2];
          const toPlace = tokens[3];

          console.log(`🚛 Spostamento: Truck ${truckName} da ${fromPlace} a ${toPlace}`);

          // Aspetta che TUTTE le animazioni di questo movimento siano completate
          await this.moveTruckToPos(truckName, toPlace);

          console.log(`✅ Movimento completato: Truck ${truckName} ora in ${toPlace}`);

          // Piccola pausa opzionale tra un movimento e l'altro
          await new Promise(resolve => setTimeout(resolve, 300));
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


  }
};

</script>

<style scoped>
.graph-container {
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
