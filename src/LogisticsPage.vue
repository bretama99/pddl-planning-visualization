<template>
  <div class="app">
        <MapVisualizer :cities="cities" :places="places" :trucks="trucks" :packages="packages" :steps="steps" :distances="distances" />
  </div>
</template>

<script setup>
import extractPDDLSections, { extractSingleSection, getDistances, getPredicatesByType, parseInitLegacy } from './pddlParser.js';
import { parseObjects, parseInit, extractPlanRobust } from './pddlParser.js';
import MapVisualizer from './components/GraphVisualization.vue';


/* PDDL1
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
applyPredicates(predicates, places, trucks, packages, cities);

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
 */
/* const problemfilecontent = `(define (problem logistics-fuel-test)
  (:domain logistics)
  (:objects
    pos1 pos2 pos3 - location
    gs1 gs2 - gasstation
    cit1 cit2 - city
    tru1 - truck
    obj11 - package
  )

  (:init 
    (at tru1 pos1) 
    (at obj11 pos1)
    
    (in-city pos1 cit1)
    (in-city pos2 cit1)
    (in-city pos3 cit2)
    (in-city gs1 cit1)
    (in-city gs2 cit2)
    
    (can-refuel gs1)
    (can-refuel gs2)

    (= (distance cit1 cit1) 5)
    (= (distance cit1 cit2) 40)
    (= (distance cit2 cit1) 40)
    (= (distance cit2 cit2) 5)

    (= (gasoline tru1) 30)
    (= (speed tru1) 1)
    (= (moved-distance tru1) 0)
  )

  (:goal (and
    (at obj11 pos3)
  ))
)`;
const extractedplus = extractPDDLSections(problemfilecontent);
console.log("Extracted PLUSPLUS Objects:", extractedplus);
var fluents = parseInit(extractedplus.init);
console.log("Fluents:", fluents); 
var objects = extractedplus.objects;
console.log("Objects:", objects);
const { cities, places, trucks, packages } = parseObjects(extractedplus.objects);
const predicatespl = parseInitLegacy(extractedplus.init);
applyPredicates(predicatespl, places, trucks, packages, cities);
console.log('🏙️ Cities:', cities);
console.log('📍 Places:', places);
console.log('🚚 Trucks:', trucks);
console.log('📦 Packages:', packages);
console.log("Predicatespl:", predicatespl);
console.log('🚚 Truckpl:', trucks.tru1); */



/* const fileContent = `(define (problem logistics-4-0)
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
 const predicates = parseInitLegacy(extracted.init);
// Parsing e aggiornamento
applyPredicates(predicates, places, trucks, packages, cities);
// Il tuo init complesso PDDL2
const initStr = `(:init (at tru1 pos1) (at obj11 pos1) (in-city pos1 cit1) (in-city pos2 cit2) (= (distance cit1 cit2) 3) (= (distance cit2 cit1) 3))`;

// Parsing completo
const parsed = parseInit(initStr);
console.log(parsed);

const distances = getDistances(parsed);
const atPredicates = getPredicatesByType(parsed, 'at');
console.log('Distances:', distances);
console.log('At Predicates:', atPredicates);
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
var steps = extractPlanRobust(output); */
/* 
const outputplus = `
Domain parsed
Problem parsed
Grounding..
Grounding Time: 50
Aibr Preprocessing
|F|:38
|X|:2
Aibr Preprocessing
|A|:38
|P|:2
|E|:26
Delta time heuristic model:1.0
Delta time planning model:1.0
Delta time search-execution model:1.0
Delta time validation model:1
H1 Setup Time (msec): 24
Setting horizon to:NaN
Running Greedy Best First Search
h(n = s_0)=6.0
 g(n)= 1.0 h(n)=5.0
 g(n)= 56.0 h(n)=4.0
 g(n)= 57.0 h(n)=3.0
 g(n)= 58.0 h(n)=1.0
 g(n)= 59.0 h(n)=0.0
Extracting plan with execution delta: 1.0
Problem Solved

Found Plan:
0: (load-truck obj11 tru1 pos1)
0: (start-move tru1 pos1 gs1 cit1 cit1)
0: -----waiting---- [5.0]
5.0: (start-refuel tru1 gs1)
5.0: -----waiting---- [13.0]
13.0: (stop-refuel tru1)
13.0: (start-move tru1 gs1 pos3 cit1 cit2)
13.0: -----waiting---- [53.0]
53.0: (unload-truck obj11 tru1 pos3)

Plan-Length:61
Elapsed Time: 53.0
Metric (Search):59.0
Planning Time (msec): 465
Heuristic Time (msec): 54
Search Time (msec): 114
Expanded Nodes:836
States Evaluated:1028
Fixed constraint violations during search (zero-crossing):0
Number of Dead-Ends detected:18
Number of Duplicates detected:156
`;

function parsePlanWithDurations(outputText) {
  const lines = outputText.split('\n');
  const plan = [];
  let inPlan = false;
  let lastAction = null;

  for (const line of lines) {
    if (line.includes('Found Plan:')) {
      inPlan = true;
      continue;
    }

    if (inPlan) {
      const trimmed = line.trim();

      // Uscita dal blocco piano
      if (trimmed === '' || trimmed.startsWith('Plan-Length')) break;

      // Righe di azione: es. "13.0: (start-move tru1 gs1 pos3 cit1 cit2)"
      const actionMatch = trimmed.match(/^([\d.]+):\s+(\(.*\))$/);
      if (actionMatch) {
        const [_, timestamp, action] = actionMatch;
        lastAction = {
          start: parseFloat(timestamp),
          action: action,
          duration: null
        };
        plan.push(lastAction);
        continue;
      }

      // Righe di waiting: es. "13.0: -----waiting---- [53.0]"
      const waitMatch = trimmed.match(/\[([\d.]+)\]$/);
      if (waitMatch && lastAction) {
        const duration = parseFloat(waitMatch[1]);
        lastAction.duration = duration;
      }
    }
  }

  return plan;
}
 */

//const { cities, places, trucks, packages, steps } = launchpddl1();
const { cities, places, trucks, packages, distances, steps } = launchpddl2();
//const { cities, places, trucks, packages, distances, steps } = launchpddlplus();


function applyPredicates(predicates, places, trucks, packages, cities) {
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
}

function parsePlanWithDurations(outputText) {
  const lines = outputText.split('\n');
  const plan = [];
  let inPlan = false;
  let lastAction = null;

  for (const line of lines) {
    if (line.includes('Found Plan:')) {
      inPlan = true;
      continue;
    }

    if (inPlan) {
      const trimmed = line.trim();

      // Uscita dal blocco piano
      if (trimmed === '' || trimmed.startsWith('Plan-Length')) break;

      // Righe di azione: es. "13.0: (start-move tru1 gs1 pos3 cit1 cit2)"
      const actionMatch = trimmed.match(/^([\d.]+):\s+(\(.*\))$/);
      if (actionMatch) {
        const [_, timestamp, action] = actionMatch;
        lastAction = {
          start: parseFloat(timestamp),
          action: action,
          duration: null
        };
        plan.push(lastAction);
        continue;
      }

      // Righe di waiting: es. "13.0: -----waiting---- [53.0]"
      const waitMatch = trimmed.match(/\[([\d.]+)\]$/);
      if (waitMatch && lastAction) {
        const duration = parseFloat(waitMatch[1]);
        lastAction.duration = duration;
      }
    }
  }

  return plan;
}

function logWorldState(cities, places, trucks, packages) {
  console.log('🏙️ Cities:', cities);
  console.log('📍 Places:', places);
  console.log('🚚 Trucks:', trucks);
  console.log('📦 Packages:', packages);
}


const problogpddl1 = `(define (problem logistics-4-0)
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
const problogpddl2 = `(define (problem logistics-4-0)
(:domain logistics)
(:objects
 pos2 pos1 pos3 pos4 pos5 pos6 pos7 - location
 cit1 cit2 cit3 cit4 - city
 tru1 tru2 - truck
 obj11 - package)

(:init (at tru1 pos1) (at tru2 pos2) (at obj11 pos1)
 (in-city pos1 cit1) (in-city pos5 cit2) (in-city pos6 cit3) (in-city pos7 cit4)  (in-city pos2 cit1) (in-city pos3 cit1) (in-city pos4 cit1) (= (distance cit1 cit2) 3) (= (distance cit2 cit1) 3)
 )

(:goal (and (at obj11 pos2)))
)`;
const problogpddlplus = `(define (problem logistics-fuel-test)
  (:domain logistics)
  (:objects
    pos1 pos2 pos3 - location
    gs1 gs2 - gasstation
    cit1 cit2 - city
    tru1 - truck
    obj11 - package
  )

  (:init 
    (at tru1 pos1) 
    (at obj11 pos1)
    
    (in-city pos1 cit1)
    (in-city pos2 cit1)
    (in-city pos3 cit2)
    (in-city gs1 cit1)
    (in-city gs2 cit2)
    
    (can-refuel gs1)
    (can-refuel gs2)

    (= (distance cit1 cit1) 5)
    (= (distance cit1 cit2) 40)
    (= (distance cit2 cit1) 40)
    (= (distance cit2 cit2) 5)

    (= (gasoline tru1) 30)
    (= (speed tru1) 1)
    (= (moved-distance tru1) 0)
  )

  (:goal (and
    (at obj11 pos3)
  ))
)`;

const planpddl2 = `domain parsed
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
number of duplicates detected:3`;
const planpddl1 = `domain parsed
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
number of duplicates detected:3`;
const planpddlplus = `
Domain parsed
Problem parsed
Grounding..
Grounding Time: 50
Aibr Preprocessing
|F|:38
|X|:2
Aibr Preprocessing
|A|:38
|P|:2
|E|:26
Delta time heuristic model:1.0
Delta time planning model:1.0
Delta time search-execution model:1.0
Delta time validation model:1
H1 Setup Time (msec): 24
Setting horizon to:NaN
Running Greedy Best First Search
h(n = s_0)=6.0
 g(n)= 1.0 h(n)=5.0
 g(n)= 56.0 h(n)=4.0
 g(n)= 57.0 h(n)=3.0
 g(n)= 58.0 h(n)=1.0
 g(n)= 59.0 h(n)=0.0
Extracting plan with execution delta: 1.0
Problem Solved

Found Plan:
0: (load-truck obj11 tru1 pos1)
0: (start-move tru1 pos1 gs1 cit1 cit1)
0: -----waiting---- [5.0]
5.0: (start-refuel tru1 gs1)
5.0: -----waiting---- [13.0]
13.0: (stop-refuel tru1)
13.0: (start-move tru1 gs1 pos3 cit1 cit2)
13.0: -----waiting---- [53.0]
53.0: (unload-truck obj11 tru1 pos3)

Plan-Length:61
Elapsed Time: 53.0
Metric (Search):59.0
Planning Time (msec): 465
Heuristic Time (msec): 54
Search Time (msec): 114
Expanded Nodes:836
States Evaluated:1028
Fixed constraint violations during search (zero-crossing):0
Number of Dead-Ends detected:18
Number of Duplicates detected:156
`;


/* const extracted = extractPDDLSections(problogpddlplus);
  var { cities, places, trucks, packages } = parseObjects(extracted.objects);
  const predicates = parseInitLegacy(extracted.init);
  applyPredicates(predicates, places, trucks, packages, cities);
 */
  
/*   //per pddl2 const 
  const initStr = `(:init (at tru1 pos1) (at obj11 pos1) (in-city pos1 cit1) (in-city pos2 cit2) (= (distance cit1 cit2) 3) (= (distance cit2 cit1) 3))`;
  const parsed = parseInit(initStr);
const distances = getDistances(parsed);  */
  
  //const fluents = parseInit(extracted.init); //per pddl3
 // inserisci qui l'planpddl1 completo del planner
  /* const steps = extractPlanRobust(planpddl2);
  console.log('Extracted Steps:', steps); */

function launchpddl1() {
  const extracted = extractPDDLSections(problogpddl1);
  const { cities, places, trucks, packages } = parseObjects(extracted.objects);
  const predicates = parseInitLegacy(extracted.init);
  applyPredicates(predicates, places, trucks, packages, cities);
  const steps = extractPlanRobust(planpddl1);
  console.log('Extracted Steps:', steps);
  logWorldState(cities, places, trucks, packages);
  return { cities, places, trucks, packages, steps };
}

function launchpddl2() {
  const extracted = extractPDDLSections(problogpddl2);
  const { cities, places, trucks, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  const distances = getDistances(parsed);
  console.log('Distances:', distances);
  
  // Converti i predicates nel formato legacy
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);
  
  applyPredicates(legacyPredicates, places, trucks, packages, cities);
  const steps = extractPlanRobust(planpddl2);
  console.log('Extracted Steps:', steps);
  logWorldState(cities, places, trucks, packages);
  return { cities, places, trucks, packages, distances, steps };
}

function launchpddlplus() {
  const extracted = extractPDDLSections(problogpddlplus);
  const { cities, places, trucks, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  
  // Converti i predicates nel formato legacy
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);

  applyPredicates(legacyPredicates, places, trucks, packages, cities);
  const steps = parsePlanWithDurations(planpddlplus);
  console.log('Extracted Steps:', steps);
  logWorldState(cities, places, trucks, packages, cities);
  return { cities, places, trucks, packages, steps };
}

// Esempio di utilizzo:
 /* const plan = parsePlanWithDurations(planpddlplus);
console.log('eaaleeeerraaaa cazzooo' ,plan); */



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
