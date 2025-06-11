<template>
  <div class="app">
        <MapVisualizer :cities="cities" :places="places" :trucks="trucks" :packages="packages" :steps="steps" :distances="distances" />
  </div>
</template>

<script setup>
import extractPDDLSections, { getDistances, getPredicatesByType, parseInitLegacy } from './pddlParser.js';
import { parseObjects, parseInit, extractPlanRobust } from './pddlParser.js';
import MapVisualizer from './components/GraphVisualization.vue';


const fileContent = `(define (problem logistics-4-0)
(:domain logistics)
(:objects
 pos2 pos1 pos3 pos4 pos5 pos6 pos7 - location
 cit1 cit2 cit3 cit4 - city
 tru1 tru2 - truck
 obj11 - package)

(:init (at tru1 pos1) (at tru2 pos2) (at obj11 pos1)
 (in-city pos1 cit1) (in-city pos5 cit2) (in-city pos6 cit3) (in-city pos7 cit4)  (in-city pos2 cit1) (in-city pos3 cit1) (in-city pos4 cit1)
 )

(:goal (and (at obj11 pos2)))
)`;
const extracted = extractPDDLSections(fileContent);
if (extracted.objects) {
    console.log("OBJECTS:");
    console.log(extracted.objects);
    console.log();
}

if (extracted.init) {
    console.log("INIT:");
    console.log(extracted.init);
    console.log();
}


const { cities, places, trucks, packages } = parseObjects(extracted.objects);
console.log('🏙️ Cities:', cities);
console.log('📍 Places:', places);
console.log('🚚 Trucks:', trucks);
console.log('📦 Packages:', packages);



const predicates = parseInitLegacy(extracted.init);
// Parsing e aggiornamento

for (const [predicate, arg1, arg2] of predicates) {
  if (predicate === 'at') {
    if (trucks[arg1]) {
      trucks[arg1].setLocation(places[arg2]);
    } else if (packages[arg1]) {
      packages[arg1].setLocation(places[arg2]);
    }
  } else if (predicate === 'in-city') {
    if (places[arg1] && cities[arg2]) {
      places[arg1].city = cities[arg2];
    }
  }
}
// 🔍 Controllo finale
console.log('🚚 Truck:', trucks.tru1);
console.log('📦 Package:', packages.obj11);
console.log('📍 Place pos1:', places.pos1);
console.log('📍 Place pos2:', places.pos2);

const output = `domain parsed
problem parsed
grounding..
grounding time: 28
aibr preprocessing
|f|:5
|x|:0
|a|:8
|p|:0
|e|:0
h1 setup time (msec): 9
 g(n)= 1.0 h(n)=2.0
 g(n)= 2.0 h(n)=1.0
problem solved

found plan:
0.0: (load-truck obj11 tru1 pos1)
1.0: (drive-truck tru1 pos1 pos2 cit1)
1.0: (drive-truck tru2 pos2 pos4 cit1)
1.0: (drive-truck tru1 pos2 pos4 cit1)
1.0: (drive-truck tru2 pos4 pos1 cit1)
1.0: (drive-truck tru2 pos4 pos5 cit2)
1.0: (drive-truck tru1 pos4 pos6 cit2)
2.0: (unload-truck obj11 tru1 pos2)

plan-length:3
metric (search):3.0
planning time (msec): 27
heuristic time (msec): 2
search time (msec): 22
expanded nodes:4
states evaluated:5
number of dead-ends detected:2
number of duplicates detected:3`
var steps = extractPlanRobust(output);
console.log('Extracted Steps:', steps);



// Il tuo init complesso
const initStr = `(:init (at tru1 pos1) (at obj11 pos1) (in-city pos1 cit1) (in-city pos2 cit2) (= (distance cit1 cit2) 100) (= (distance cit2 cit1) 100))`;

// Parsing completo
const parsed = parseInit(initStr);
console.log(parsed);

const distances = getDistances(parsed);
const atPredicates = getPredicatesByType(parsed, 'at');
console.log('Distances:', distances);
console.log('At Predicates:', atPredicates);

</script>


<style>
.app {
  text-align: center;
  margin-top: 20px;
}
svg {
  border: 1px solid #ccc;
}
</style>
