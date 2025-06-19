<template>
  <div class="app">
        <MapVisualizer :cities="cities" :places="places" :vehicles="vehicles" :packages="packages" :steps="steps" :distances="distances" :fuel-rates="fuelRates" />
  </div>
</template>

<script setup>
import extractPDDLSections, { extractSingleSection, getDistances, getPredicatesByType, parseInitLegacy, extractGasolineObjects } from './pddlParser.js';
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

const { cities, places, vehicles, packages, steps } = launchpddl1();
//const { cities, places, vehicles, packages, distances, steps } = launchpddl2();
//const { cities, places, vehicles, packages, distances, steps, fuelRates } = launchpddlplus();


function applyPredicates(predicates, places, vehicles, packages, cities) {
  for (const [predicate, arg1, arg2] of predicates) {
    if (predicate === 'at') {
      if (vehicles[arg1]) {
        vehicles[arg1].setLocation(places[arg2]);
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

function applyNumericFunctions(numericFunctions, vehicles) {
  for (const fn of numericFunctions) {
    const [target] = fn.args;
    const value = fn.value;

    if (fn.functionName === 'gasoline' && vehicles[target]) {
      vehicles[target].initializeGasoline(value);
    }
  }
}

function extractFuelRates(pddlDomain) {
    /**
     * Estrae la velocità di rifornimento e consumo di carburante dal dominio PDDL.
     * 
     * @param {string} pddlDomain - Il contenuto del dominio PDDL come stringa
     * @returns {Object} Oggetto con refuelRate e consumptionRate
     */
    const rates = {
        refuelRate: null,
        consumptionRate: null
    };
    
    // Pattern per trovare il processo di rifornimento
    // Cerca (increase (gasoline ?truck) (* 10 #t))
    const refuelPattern = /\(increase\s+\(gasoline\s+\?\w+\)\s+\(\*\s+(\d+(?:\.\d+)?)\s+#t\)\)/g;
    const refuelMatch = refuelPattern.exec(pddlDomain);
    
    if (refuelMatch) {
        rates.refuelRate = parseFloat(refuelMatch[1]);
    }
    
    // Pattern per trovare il processo di movimento (consumo)
    // Cerca (decrease (gasoline ?truck) (* 2 #t))
    const consumptionPattern = /\(decrease\s+\(gasoline\s+\?\w+\)\s+\(\*\s+(\d+(?:\.\d+)?)\s+#t\)\)/g;
    const consumptionMatch = consumptionPattern.exec(pddlDomain);
    
    if (consumptionMatch) {
        rates.consumptionRate = parseFloat(consumptionMatch[1]);
    }
    
    return rates;
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
      const waitMatch = trimmed.match(/^([\d.]+):\s+-----waiting----\s+\[([\d.]+)\]$/);
      if (waitMatch && lastAction) {
        const endTime = parseFloat(waitMatch[2]);
        const startTime = lastAction.start;
        lastAction.duration = endTime - startTime;
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
 apt1 apt2 - airport
 apn1 apn2 - airplane
 cit1 cit2 cit3 cit4 - city
 tru1 tru2 - truck
 obj11 obj14 - package)

(:init (at tru1 pos1) (at tru2 pos2) (at obj11 pos1) (at apn1 apt1) (at apn2 apt1) (at obj14 apt1)
 (in-city pos1 cit1) (in-city pos5 cit2) (in-city pos6 cit3) (in-city pos7 cit4)  (in-city pos2 cit1) (in-city pos3 cit1) (in-city pos4 cit1) (in-city apt1 cit1) 
    (in-city apt2 cit2) 
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
 (in-city pos1 cit1) (in-city pos5 cit2) (in-city pos6 cit3) (in-city pos7 cit4)  (in-city pos2 cit1) (in-city pos3 cit1) (in-city pos4 cit1) (= (distance cit1 cit2) 3) (= (distance cit3 cit1) 3) (= (distance cit2 cit4) 3)
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

const testprogpddl1 = `(define (problem logistics-4-0)
(:domain logistics)
(:objects
 pos2 pos1 pos3 pos4 pos5 pos6 pos7 - location
 cit1 cit2 cit3 cit4 - city
 tru1 tru2 - truck
 obj11 obj12 obj13 obj14 - package)
(:init 
 (at tru1 pos1) 
 (at tru2 pos2) 
 (at obj11 pos1) 
 (at obj12 pos3) 
 (at obj13 pos5) 
 (at obj14 pos6)
 (in-city pos1 cit1) 
 (in-city pos2 cit1) 
 (in-city pos3 cit1) 
 (in-city pos4 cit1)
 (in-city pos5 cit2) 
 (in-city pos6 cit3) 
 (in-city pos7 cit4)
 )
(:goal 
 (and 
  (at obj11 pos2) 
  (at obj12 pos7) 
  (at obj13 pos4) 
  (at obj14 pos1)
 )
)
)`;
const testplanpddl1 = `domain parsed
problem parsed
grounding..
grounding time: 45
aibr preprocessing
|f|:9
|x|:0
|a|:20
|p|:0
|e|:0
h1 setup time (msec): 15
 g(n)= 1.0 h(n)=7.0
 g(n)= 2.0 h(n)=6.0
 g(n)= 3.0 h(n)=5.0
 g(n)= 4.0 h(n)=4.0
 g(n)= 5.0 h(n)=3.0
 g(n)= 6.0 h(n)=2.0
 g(n)= 7.0 h(n)=1.0
 g(n)= 8.0 h(n)=0.0
 problem solved
 
 found plan:
 19.0: (load-airplane obj14 apn1 apt1)
7.0: (fly-airplane apn1 apt1 apt2)
 2.0: (unload-airplane obj14 apn1 apt2)
0.0: (load-truck obj11 tru1 pos1)
1.0: (drive-truck tru1 pos1 pos2 cit1)
2.0: (unload-truck obj11 tru1 pos2)
3.0: (drive-truck tru1 pos2 pos3 cit1)
4.0: (load-truck obj12 tru1 pos3)
5.0: (drive-truck tru1 pos3 pos4 cit1)
6.0: (drive-truck tru1 pos4 pos7 cit4)
7.0: (unload-truck obj12 tru1 pos7)
8.0: (drive-truck tru2 pos2 pos1 cit1)
9.0: (drive-truck tru2 pos1 pos4 cit1)
10.0: (drive-truck tru2 pos4 pos5 cit2)
11.0: (load-truck obj13 tru2 pos5)
12.0: (drive-truck tru2 pos5 pos4 cit1)
13.0: (unload-truck obj13 tru2 pos4)
14.0: (drive-truck tru2 pos4 pos6 cit3)
15.0: (load-truck obj14 tru2 pos6)
16.0: (drive-truck tru2 pos6 pos4 cit1)
17.0: (drive-truck tru2 pos4 pos1 cit1)
18.0: (unload-truck obj14 tru2 pos1)

plan-length:19
metric (search):19.0
planning time (msec): 78
heuristic time (msec): 12
search time (msec): 58
expanded nodes:15
states evaluated:20
number of dead-ends detected:8
number of duplicates detected:12
`;
const testprogpddl2 = `(define (problem logistics-5-0)
(:domain logistics)
(:objects
 pos2 pos1 pos3 pos4 pos5 pos6 pos7 pos8 pos9 - location
 cit1 cit2 cit3 cit4 - city
 tru1 tru2 tru3 - truck
 obj11 obj12 obj13 obj14 obj15 - package)

(:init 
 (at tru1 pos1) 
 (at tru2 pos5) 
 (at tru3 pos6)
 (at obj11 pos2) 
 (at obj12 pos3) 
 (at obj13 pos7) 
 (at obj14 pos8) 
 (at obj15 pos9)
 (in-city pos1 cit1) 
 (in-city pos2 cit1) 
 (in-city pos3 cit1) 
 (in-city pos4 cit1)
 (in-city pos5 cit2) 
 (in-city pos8 cit2)
 (in-city pos6 cit3) 
 (in-city pos9 cit3)
 (in-city pos7 cit4)
 (= (distance cit1 cit2) 4) 
 (= (distance cit2 cit1) 4)
 (= (distance cit1 cit3) 2) 
 (= (distance cit3 cit1) 2)
 (= (distance cit1 cit4) 5) 
 (= (distance cit4 cit1) 5)
 (= (distance cit2 cit3) 3) 
 (= (distance cit3 cit2) 3)
 (= (distance cit2 cit4) 2) 
 (= (distance cit4 cit2) 2)
 (= (distance cit3 cit4) 4) 
 (= (distance cit4 cit3) 4)
 )

(:goal 
 (and 
  (at obj11 pos5)
  (at obj12 pos7) 
  (at obj13 pos1) 
  (at obj14 pos6) 
  (at obj15 pos4)
 )
)
)`;
const testplanpddl2 = `domain parsed
problem parsed
grounding..
grounding time: 62
aibr preprocessing
|f|:12
|x|:0
|a|:35
|p|:0
|e|:0
h1 setup time (msec): 22
 g(n)= 1.0 h(n)=12.0
 g(n)= 2.0 h(n)=11.0
 g(n)= 3.0 h(n)=10.0
 g(n)= 4.0 h(n)=9.0
 g(n)= 5.0 h(n)=8.0
 g(n)= 6.0 h(n)=7.0
 g(n)= 7.0 h(n)=6.0
 g(n)= 8.0 h(n)=5.0
 g(n)= 9.0 h(n)=4.0
 g(n)= 10.0 h(n)=3.0
 g(n)= 11.0 h(n)=2.0
 g(n)= 12.0 h(n)=1.0
 g(n)= 13.0 h(n)=0.0
problem solved

found plan:
0.0: (load-truck obj11 tru1 pos2)
1.0: (drive-truck tru1 pos2 pos1 cit1)
2.0: (drive-truck tru1 pos1 pos4 cit1)
3.0: (drive-truck tru1 pos4 pos5 cit2)
4.0: (unload-truck obj11 tru1 pos5)
5.0: (drive-truck tru1 pos5 pos8 cit2)
6.0: (load-truck obj14 tru1 pos8)
7.0: (drive-truck tru1 pos8 pos5 cit2)
8.0: (drive-truck tru1 pos5 pos6 cit3)
9.0: (unload-truck obj14 tru1 pos6)
10.0: (load-truck obj15 tru3 pos9)
11.0: (drive-truck tru3 pos9 pos6 cit3)
12.0: (drive-truck tru3 pos6 pos1 cit1)
13.0: (drive-truck tru3 pos1 pos4 cit1)
14.0: (unload-truck obj15 tru3 pos4)
15.0: (load-truck obj12 tru2 pos3)
16.0: (drive-truck tru2 pos3 pos1 cit1)
17.0: (drive-truck tru2 pos1 pos7 cit4)
18.0: (unload-truck obj12 tru2 pos7)
19.0: (load-truck obj13 tru2 pos7)
20.0: (drive-truck tru2 pos7 pos1 cit1)
21.0: (unload-truck obj13 tru2 pos1)

plan-length:22
metric (search):22.0
planning time (msec): 125
heuristic time (msec): 18
search time (msec): 95
expanded nodes:28
states evaluated:35
number of dead-ends detected:15
number of duplicates detected:22`

const testprogpddl22=`(define (problem logistics-4-0)
(:domain logistics)
(:objects
 pos2 pos1 - location
 cit1 cit2 - city
 tru1 - truck
 obj11 - package)

(:init (at tru1 pos1) (at obj11 pos1)
 (in-city pos1 cit1)  (in-city pos2 cit2)
  (= (distance cit1 cit2) 100)
 (= (distance cit2 cit1) 100)
 )

(:goal (and (at obj11 pos2)))
)`
const testplanpddl22 = `; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-4-0' defined ... done.



Modality: Incremental Planner

Number of actions             :       8
Number of conditional actions :       0
Number of facts               :       5


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.01 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.04

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (LOAD-TRUCK OBJ11 TRU1 POS1) [D:0.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRU1 POS1 POS2 CIT1 CIT2) [D:100.00; C:1.00]
 100.0000: (UNLOAD-TRUCK OBJ11 TRU1 POS2) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.04
Search time:     0.03
Actions:         3
Duration:        100.000
Plan quality:    3.000
Total Num Flips: 3
     Plan file:       plan_prog.pddl_1.SOL`

const probA = `(define (problem logistics-multi-city)
  (:domain logistics)
  
  (:objects
    milano roma napoli - city
    malpensa fiumicino capodichino - airport
    centromilano stazionemilano - location
    centroroma terminiroma - location
    centronapoli portonapoli - location
    pacco1 pacco2 pacco3 pacco4 pacco5 - package
    truckmilano truckroma trucknapoli - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city capodichino napoli)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (at truckmilano centromilano)
    (at truckroma centroroma)
    (at trucknapoli portonapoli)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    (at pacco1 stazionemilano)
    (at pacco2 centromilano)
    (at pacco3 terminiroma)
    (at pacco4 centroroma)
    (at pacco5 centronapoli)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 centromilano)
      (at pacco4 centronapoli)
      (at pacco5 terminiroma)
    )
  )
)`
const planA = `domain parsed
problem parsed
grounding..
grounding time: 44
aibr preprocessing
|f|:85
|x|:0
|a|:195
|p|:0
|e|:0
h1 setup time (msec): 15
 g(n)= 1.0 h(n)=48.0
 g(n)= 2.0 h(n)=46.0
 g(n)= 3.0 h(n)=45.0
 g(n)= 4.0 h(n)=43.0
 g(n)= 5.0 h(n)=42.0
 g(n)= 6.0 h(n)=41.0
 g(n)= 7.0 h(n)=40.0
 g(n)= 8.0 h(n)=39.0
 g(n)= 9.0 h(n)=38.0
 g(n)= 11.0 h(n)=37.0
 g(n)= 12.0 h(n)=36.0
 g(n)= 13.0 h(n)=35.0
 g(n)= 14.0 h(n)=34.0
 g(n)= 15.0 h(n)=33.0
 g(n)= 16.0 h(n)=32.0
 g(n)= 17.0 h(n)=31.0
 g(n)= 19.0 h(n)=30.0
 g(n)= 20.0 h(n)=29.0
 g(n)= 24.0 h(n)=27.0
 g(n)= 25.0 h(n)=26.0
 g(n)= 26.0 h(n)=25.0
 g(n)= 27.0 h(n)=24.0
 g(n)= 28.0 h(n)=23.0
 g(n)= 29.0 h(n)=22.0
 g(n)= 30.0 h(n)=21.0
 g(n)= 31.0 h(n)=20.0
 g(n)= 33.0 h(n)=19.0
 g(n)= 34.0 h(n)=18.0
 g(n)= 35.0 h(n)=17.0
 g(n)= 37.0 h(n)=16.0
 g(n)= 38.0 h(n)=15.0
 g(n)= 40.0 h(n)=14.0
 g(n)= 41.0 h(n)=13.0
 g(n)= 42.0 h(n)=12.0
 g(n)= 43.0 h(n)=11.0
 g(n)= 45.0 h(n)=10.0
 g(n)= 46.0 h(n)=9.0
 g(n)= 47.0 h(n)=8.0
 g(n)= 48.0 h(n)=7.0
 g(n)= 49.0 h(n)=6.0
 g(n)= 50.0 h(n)=5.0
 g(n)= 51.0 h(n)=4.0
 g(n)= 52.0 h(n)=3.0
 g(n)= 53.0 h(n)=2.0
 g(n)= 54.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck trucknapoli portonapoli capodichino napoli)
1.0: (drive-truck truckroma centroroma fiumicino roma)
2.0: (load-truck pacco2 truckmilano centromilano)
3.0: (drive-truck truckmilano centromilano malpensa milano)
4.0: (unload-truck pacco2 truckmilano malpensa)
5.0: (load-airplane pacco2 aereo1 malpensa)
6.0: (fly-airplane aereo1 malpensa capodichino)
7.0: (unload-airplane pacco2 aereo1 capodichino)
8.0: (load-truck pacco2 trucknapoli capodichino)
9.0: (drive-truck trucknapoli capodichino centronapoli napoli)
10.0: (load-truck pacco5 trucknapoli centronapoli)
11.0: (drive-truck trucknapoli centronapoli capodichino napoli)
12.0: (unload-truck pacco5 trucknapoli capodichino)
13.0: (load-airplane pacco5 aereo1 capodichino)
14.0: (fly-airplane aereo1 capodichino fiumicino)
15.0: (unload-airplane pacco5 aereo1 fiumicino)
16.0: (load-truck pacco5 truckroma fiumicino)
17.0: (drive-truck trucknapoli capodichino portonapoli napoli)
18.0: (unload-truck pacco2 trucknapoli portonapoli)
19.0: (drive-truck trucknapoli portonapoli capodichino napoli)
20.0: (fly-airplane aereo2 fiumicino malpensa)
21.0: (drive-truck truckroma fiumicino centroroma roma)
22.0: (load-truck pacco4 truckroma centroroma)
23.0: (drive-truck truckroma centroroma fiumicino roma)
24.0: (unload-truck pacco4 truckroma fiumicino)
25.0: (load-airplane pacco4 aereo1 fiumicino)
26.0: (fly-airplane aereo1 fiumicino capodichino)
27.0: (unload-airplane pacco4 aereo1 capodichino)
28.0: (load-truck pacco4 trucknapoli capodichino)
29.0: (drive-truck trucknapoli capodichino centronapoli napoli)
30.0: (unload-truck pacco4 trucknapoli centronapoli)
31.0: (drive-truck truckroma fiumicino terminiroma roma)
32.0: (load-truck pacco3 truckroma terminiroma)
33.0: (drive-truck truckroma terminiroma fiumicino roma)
34.0: (unload-truck pacco3 truckroma fiumicino)
35.0: (drive-truck truckroma fiumicino terminiroma roma)
36.0: (unload-truck pacco5 truckroma terminiroma)
37.0: (drive-truck truckroma terminiroma fiumicino roma)
38.0: (fly-airplane aereo2 malpensa fiumicino)
39.0: (load-airplane pacco3 aereo2 fiumicino)
40.0: (fly-airplane aereo2 fiumicino malpensa)
41.0: (unload-airplane pacco3 aereo2 malpensa)
42.0: (load-truck pacco3 truckmilano malpensa)
43.0: (drive-truck truckmilano malpensa stazionemilano milano)
44.0: (load-truck pacco1 truckmilano stazionemilano)
45.0: (drive-truck truckmilano stazionemilano malpensa milano)
46.0: (unload-truck pacco1 truckmilano malpensa)
47.0: (drive-truck truckmilano malpensa centromilano milano)
48.0: (load-airplane pacco1 aereo2 malpensa)
49.0: (fly-airplane aereo2 malpensa fiumicino)
50.0: (unload-airplane pacco1 aereo2 fiumicino)
51.0: (load-truck pacco1 truckroma fiumicino)
52.0: (drive-truck truckroma fiumicino centroroma roma)
53.0: (unload-truck pacco3 truckmilano centromilano)
54.0: (unload-truck pacco1 truckroma centroroma)

plan-length:55
metric (search):55.0
planning time (msec): 186
heuristic time (msec): 142
search time (msec): 179
expanded nodes:84
states evaluated:874
number of dead-ends detected:176
number of duplicates detected:341`
const probb = `(define (problem logistics-delivery)
  (:domain logistics)
  
  (:objects
    torino bologna firenze - city
    caselle marconi peretola - airport
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    pacco1 pacco2 pacco3 pacco4 - package
    trucktorino truckbologna truckfirenze - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city marconi bologna)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city peretola firenze)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)
    (at trucktorino lingotto)
    (at truckbologna mercato)
    (at truckfirenze duomo)
    (at aereo1 caselle)
    (at aereo2 marconi)
    (at pacco1 piazzacastello)
    (at pacco2 stazionebologna)
    (at pacco3 lingotto)
    (at pacco4 pontevecchio)
  )
  
  (:goal
    (and
      (at pacco1 mercato)
      (at pacco2 duomo)
      (at pacco3 stazionebologna)
      (at pacco4 piazzacastello)
    )
  )
)`;
const planb = `domain parsed
problem parsed
grounding..
grounding time: 57
aibr preprocessing
|f|:71
|x|:0
|a|:165
|p|:0
|e|:0
h1 setup time (msec): 17
 g(n)= 1.0 h(n)=39.0
 g(n)= 2.0 h(n)=37.0
 g(n)= 3.0 h(n)=36.0
 g(n)= 6.0 h(n)=34.0
 g(n)= 7.0 h(n)=33.0
 g(n)= 8.0 h(n)=32.0
 g(n)= 10.0 h(n)=31.0
 g(n)= 11.0 h(n)=30.0
 g(n)= 12.0 h(n)=29.0
 g(n)= 14.0 h(n)=28.0
 g(n)= 15.0 h(n)=27.0
 g(n)= 16.0 h(n)=26.0
 g(n)= 17.0 h(n)=25.0
 g(n)= 19.0 h(n)=24.0
 g(n)= 20.0 h(n)=23.0
 g(n)= 22.0 h(n)=22.0
 g(n)= 23.0 h(n)=21.0
 g(n)= 24.0 h(n)=20.0
 g(n)= 26.0 h(n)=19.0
 g(n)= 27.0 h(n)=18.0
 g(n)= 28.0 h(n)=17.0
 g(n)= 29.0 h(n)=16.0
 g(n)= 30.0 h(n)=15.0
 g(n)= 31.0 h(n)=14.0
 g(n)= 32.0 h(n)=13.0
 g(n)= 33.0 h(n)=12.0
 g(n)= 34.0 h(n)=11.0
 g(n)= 37.0 h(n)=10.0
 g(n)= 38.0 h(n)=9.0
 g(n)= 39.0 h(n)=8.0
 g(n)= 40.0 h(n)=7.0
 g(n)= 41.0 h(n)=6.0
 g(n)= 42.0 h(n)=5.0
 g(n)= 43.0 h(n)=4.0
 g(n)= 44.0 h(n)=3.0
 g(n)= 45.0 h(n)=2.0
 g(n)= 46.0 h(n)=1.0
problem solved

found plan:
0.0: (drive-truck trucktorino lingotto caselle torino)
1.0: (drive-truck truckbologna mercato marconi bologna)
2.0: (drive-truck truckfirenze duomo peretola firenze)
3.0: (drive-truck trucktorino caselle piazzacastello torino)
4.0: (load-truck pacco1 trucktorino piazzacastello)
5.0: (drive-truck trucktorino piazzacastello caselle torino)
6.0: (unload-truck pacco1 trucktorino caselle)
7.0: (load-airplane pacco1 aereo1 caselle)
8.0: (fly-airplane aereo2 marconi peretola)
9.0: (fly-airplane aereo1 caselle marconi)
10.0: (unload-airplane pacco1 aereo1 marconi)
11.0: (load-truck pacco1 truckbologna marconi)
12.0: (drive-truck truckbologna marconi stazionebologna bologna)
13.0: (load-truck pacco2 truckbologna stazionebologna)
14.0: (drive-truck truckbologna stazionebologna marconi bologna)
15.0: (unload-truck pacco2 truckbologna marconi)
16.0: (load-airplane pacco2 aereo1 marconi)
17.0: (drive-truck truckbologna marconi mercato bologna)
18.0: (unload-truck pacco1 truckbologna mercato)
19.0: (drive-truck truckbologna mercato stazionebologna bologna)
20.0: (fly-airplane aereo1 marconi peretola)
21.0: (fly-airplane aereo2 peretola caselle)
22.0: (unload-airplane pacco2 aereo1 peretola)
23.0: (load-truck pacco2 truckfirenze peretola)
24.0: (drive-truck truckfirenze peretola duomo firenze)
25.0: (unload-truck pacco2 truckfirenze duomo)
26.0: (drive-truck truckfirenze duomo pontevecchio firenze)
27.0: (load-truck pacco4 truckfirenze pontevecchio)
28.0: (drive-truck truckfirenze pontevecchio peretola firenze)
29.0: (unload-truck pacco4 truckfirenze peretola)
30.0: (load-airplane pacco4 aereo1 peretola)
31.0: (fly-airplane aereo1 peretola caselle)
32.0: (unload-airplane pacco4 aereo1 caselle)
33.0: (load-truck pacco4 trucktorino caselle)
34.0: (drive-truck truckbologna stazionebologna marconi bologna)
35.0: (drive-truck trucktorino caselle lingotto torino)
36.0: (load-truck pacco3 trucktorino lingotto)
37.0: (drive-truck trucktorino lingotto caselle torino)
38.0: (unload-truck pacco3 trucktorino caselle)
39.0: (drive-truck trucktorino caselle piazzacastello torino)
40.0: (load-airplane pacco3 aereo2 caselle)
41.0: (fly-airplane aereo2 caselle marconi)
42.0: (unload-airplane pacco3 aereo2 marconi)
43.0: (load-truck pacco3 truckbologna marconi)
44.0: (drive-truck truckbologna marconi stazionebologna bologna)
45.0: (unload-truck pacco3 truckbologna stazionebologna)
46.0: (unload-truck pacco4 trucktorino piazzacastello)

plan-length:47
metric (search):47.0
planning time (msec): 164
heuristic time (msec): 118
search time (msec): 157
expanded nodes:69
states evaluated:704
number of dead-ends detected:188
number of duplicates detected:206`
const prob2ex1 = `(define (problem logistics-temporal)
  (:domain logistics)
  
  (:objects
    milano roma napoli torino bologna firenze - city
    centromilano stazionemilano - location
    centroroma terminiroma - location
    centronapoli portonapoli - location
    piazzacastello lingotto - location
    stazionebologna mercato - location
    duomo pontevecchio - location
    pacco1 pacco2 pacco3 pacco4 pacco5 pacco6 - package
    truck1 truck2 truck3 truck4 - truck
  )
  
  (:init
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city centronapoli napoli)
    (in-city portonapoli napoli)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    (in-city stazionebologna bologna)
    (in-city mercato bologna)
    (in-city duomo firenze)
    (in-city pontevecchio firenze)
    
    (at truck1 centromilano)
    (at truck2 centroroma)
    (at truck3 piazzacastello)
    (at truck4 duomo)
    
    (at pacco1 stazionemilano)
    (at pacco2 terminiroma)
    (at pacco3 centronapoli)
    (at pacco4 lingotto)
    (at pacco5 mercato)
    (at pacco6 pontevecchio)
    
    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance milano napoli) 8)
    (= (distance milano torino) 2)
    (= (distance milano bologna) 3)
    (= (distance milano firenze) 4)
    
    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    (= (distance roma napoli) 2)
    (= (distance roma torino) 7)
    (= (distance roma bologna) 4)
    (= (distance roma firenze) 3)
    
    (= (distance napoli milano) 8)
    (= (distance napoli roma) 2)
    (= (distance napoli napoli) 0)
    (= (distance napoli torino) 10)
    (= (distance napoli bologna) 6)
    (= (distance napoli firenze) 5)
    
    (= (distance torino milano) 2)
    (= (distance torino roma) 7)
    (= (distance torino napoli) 10)
    (= (distance torino torino) 0)
    (= (distance torino bologna) 4)
    (= (distance torino firenze) 6)
    
    (= (distance bologna milano) 3)
    (= (distance bologna roma) 4)
    (= (distance bologna napoli) 6)
    (= (distance bologna torino) 4)
    (= (distance bologna bologna) 0)
    (= (distance bologna firenze) 2)
    
    (= (distance firenze milano) 4)
    (= (distance firenze roma) 3)
    (= (distance firenze napoli) 5)
    (= (distance firenze torino) 6)
    (= (distance firenze bologna) 2)
    (= (distance firenze firenze) 0)
  )
  
  (:goal
    (and
      (at pacco1 centroroma)
      (at pacco2 portonapoli)
      (at pacco3 piazzacastello)
      (at pacco4 mercato)
      (at pacco5 duomo)
      (at pacco6 centromilano)
    )
  )
)`;
const plan2ex1 = `

NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL' defined ... done.



Modality: Incremental Planner

Number of actions             :    1152
Number of conditional actions :       0
Number of facts               :     144


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.00 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.02

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CENTRONAPOLI TORINO NAPOLI) [D:10.00; C:1.00]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA STAZIONEMILANO ROMA MILANO) [D:5.00; C:1.00]
 5.0000: (LOAD-TRUCK PACCO1 TRUCK2 STAZIONEMILANO) [D:0.00; C:1.00]
 5.0000: (DRIVE-TRUCK TRUCK2 STAZIONEMILANO CENTROROMA MILANO ROMA) [D:5.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO3 TRUCK3 CENTRONAPOLI) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK3 CENTRONAPOLI PIAZZACASTELLO NAPOLI TORINO) [D:10.00; C:1.00]
 10.0000: (UNLOAD-TRUCK PACCO1 TRUCK2 CENTROROMA) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA TERMINIROMA ROMA ROMA) [D:0.00; C:1.00]
 10.0000: (LOAD-TRUCK PACCO2 TRUCK2 TERMINIROMA) [D:0.00; C:1.00]
 10.0000: (DRIVE-TRUCK TRUCK2 TERMINIROMA PORTONAPOLI ROMA NAPOLI) [D:2.00; C:1.00]
 12.0000: (UNLOAD-TRUCK PACCO2 TRUCK2 PORTONAPOLI) [D:0.00; C:1.00]
 12.0000: (DRIVE-TRUCK TRUCK2 PORTONAPOLI LINGOTTO NAPOLI TORINO) [D:10.00; C:1.00]
 20.0000: (UNLOAD-TRUCK PACCO3 TRUCK3 PIAZZACASTELLO) [D:0.00; C:1.00]
 20.0000: (DRIVE-TRUCK TRUCK3 PIAZZACASTELLO CENTROROMA TORINO ROMA) [D:7.00; C:1.00]
 22.0000: (LOAD-TRUCK PACCO4 TRUCK2 LINGOTTO) [D:0.00; C:1.00]
 22.0000: (DRIVE-TRUCK TRUCK2 LINGOTTO MERCATO TORINO BOLOGNA) [D:4.00; C:1.00]
 26.0000: (UNLOAD-TRUCK PACCO4 TRUCK2 MERCATO) [D:0.00; C:1.00]
 26.0000: (LOAD-TRUCK PACCO5 TRUCK2 MERCATO) [D:0.00; C:1.00]
 26.0000: (DRIVE-TRUCK TRUCK2 MERCATO PIAZZACASTELLO BOLOGNA TORINO) [D:4.00; C:1.00]
 27.0000: (LOAD-TRUCK PACCO1 TRUCK3 CENTROROMA) [D:0.00; C:1.00]
 27.0000: (UNLOAD-TRUCK PACCO1 TRUCK3 CENTROROMA) [D:0.00; C:1.00]
 30.0000: (DRIVE-TRUCK TRUCK2 PIAZZACASTELLO DUOMO TORINO FIRENZE) [D:6.00; C:1.00]
 36.0000: (UNLOAD-TRUCK PACCO5 TRUCK2 DUOMO) [D:0.00; C:1.00]
 36.0000: (LOAD-TRUCK PACCO5 TRUCK4 DUOMO) [D:0.00; C:1.00]
 36.0000: (UNLOAD-TRUCK PACCO5 TRUCK4 DUOMO) [D:0.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK2 DUOMO PONTEVECCHIO FIRENZE FIRENZE) [D:0.00; C:1.00]
 36.0000: (LOAD-TRUCK PACCO6 TRUCK2 PONTEVECCHIO) [D:0.00; C:1.00]
 36.0000: (DRIVE-TRUCK TRUCK2 PONTEVECCHIO CENTROMILANO FIRENZE MILANO) [D:4.00; C:1.00]
 40.0000: (UNLOAD-TRUCK PACCO6 TRUCK2 CENTROMILANO) [D:0.00; C:1.00]
 40.0000: (LOAD-TRUCK PACCO6 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 40.0000: (UNLOAD-TRUCK PACCO6 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.02
Search time:     0.02
Actions:         31
Duration:        40.000
Plan quality:    31.000
Total Num Flips: 36
     Plan file:       plan_prog.pddl_1.SOL`;
const prob2ex2 = `(define (problem logistics-temporal-air)
  (:domain logistics)
  
  (:objects
    milano roma torino - city
    malpensa fiumicino caselle - airport
    centromilano stazionemilano - location
    centroroma terminiroma - location
    piazzacastello lingotto - location
    pacco1 pacco2 pacco3 pacco4 - package
    truck1 truck2 truck3 - truck
    aereo1 aereo2 - airplane
  )
  
  (:init
    (in-city malpensa milano)
    (in-city centromilano milano)
    (in-city stazionemilano milano)
    (in-city fiumicino roma)
    (in-city centroroma roma)
    (in-city terminiroma roma)
    (in-city caselle torino)
    (in-city piazzacastello torino)
    (in-city lingotto torino)
    
    (at truck1 centromilano)
    (at truck2 centroroma)
    (at truck3 piazzacastello)
    (at aereo1 malpensa)
    (at aereo2 fiumicino)
    
    (at pacco1 malpensa)
    (at pacco2 fiumicino)
    (at pacco3 lingotto)
    (at pacco4 caselle)
    
    (= (distance milano milano) 0)
    (= (distance milano roma) 5)
    (= (distance milano torino) 2)
    
    (= (distance roma milano) 5)
    (= (distance roma roma) 0)
    (= (distance roma torino) 7)
    
    (= (distance torino milano) 2)
    (= (distance torino roma) 7)
    (= (distance torino torino) 0)
  )
  
  (:goal
    (and
      (at pacco1 caselle)
      (at pacco2 malpensa)
      (at pacco3 centromilano)
      (at pacco4 fiumicino)
    )
  )
)`;
const plan2ex2 = `

NUMERIC_THREATS_MODE: 0

; Command line: ./lpg-td -o dom2.pddl -f prog.pddl -n 1


Parsing domain file:  domain 'LOGISTICS' defined ... done.
Parsing problem file:  problem 'LOGISTICS-TEMPORAL-AIR' defined ... done.



Modality: Incremental Planner

Number of actions             :     525
Number of conditional actions :       0
Number of facts               :      89


Analyzing Planning Problem:
        Temporal Planning Problem: NO
        Numeric Planning Problem: YES
        Problem with Timed Initial Literals: NO
        Problem with Derived Predicates: NO

Evaluation function weights:
     Action duration 0.00; Action cost 1.00


Computing mutex... done

Preprocessing total time: 0.00 seconds

Searching ('.' = every 50 search steps):
 solution found:
 Recompute start times

 first_solution_cpu_time: 0.03

Plan computed:
   Time: (ACTION) [action Duration; action Cost]
 0.0000: (DRIVE-TRUCK TRUCK2 CENTROROMA LINGOTTO ROMA TORINO) [D:7.00; C:1.00]
 0.0000: (LOAD-AIRPLANE PACCO2 AEREO2 FIUMICINO) [D:0.00; C:1.00]
 0.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:1.00]
 7.0000: (LOAD-TRUCK PACCO3 TRUCK2 LINGOTTO) [D:0.00; C:1.00]
 7.0000: (DRIVE-TRUCK TRUCK2 LINGOTTO CENTROMILANO TORINO MILANO) [D:2.00; C:1.00]
 7.0000: (FLY-AIRPLANE AEREO2 CASELLE MALPENSA TORINO MILANO) [D:2.00; C:1.00]
 9.0000: (UNLOAD-TRUCK PACCO3 TRUCK2 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (LOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (UNLOAD-TRUCK PACCO3 TRUCK1 CENTROMILANO) [D:0.00; C:1.00]
 9.0000: (UNLOAD-AIRPLANE PACCO2 AEREO2 MALPENSA) [D:0.00; C:1.00]
 9.0000: (LOAD-AIRPLANE PACCO1 AEREO2 MALPENSA) [D:0.00; C:1.00]
 9.0000: (FLY-AIRPLANE AEREO2 MALPENSA FIUMICINO MILANO ROMA) [D:5.00; C:1.00]
 14.0000: (FLY-AIRPLANE AEREO2 FIUMICINO CASELLE ROMA TORINO) [D:7.00; C:1.00]
 21.0000: (UNLOAD-AIRPLANE PACCO1 AEREO2 CASELLE) [D:0.00; C:1.00]
 21.0000: (LOAD-AIRPLANE PACCO4 AEREO2 CASELLE) [D:0.00; C:1.00]
 21.0000: (FLY-AIRPLANE AEREO2 CASELLE MALPENSA TORINO MILANO) [D:2.00; C:1.00]
 23.0000: (FLY-AIRPLANE AEREO2 MALPENSA FIUMICINO MILANO ROMA) [D:5.00; C:1.00]
 28.0000: (UNLOAD-AIRPLANE PACCO4 AEREO2 FIUMICINO) [D:0.00; C:1.00]


Solution number: 1
Total time:      0.03
Search time:     0.03
Actions:         18
Duration:        28.000
Plan quality:    18.000
Total Num Flips: 20
     Plan file:       plan_prog.pddl_1.SOL
`
const domainpddlplus = `(define (domain logistics)
  (:requirements :strips :typing :fluents :time :processes :events)
  (:types
    truck - vehicle
    package vehicle - physobj
    location - place
    city place physobj - object
  )

  (:predicates
    (in-city ?loc - place ?city - city)
    (at ?obj - physobj ?loc - place)
    (in ?pkg - package ?veh - vehicle)
    (moving ?truck - truck)
    (refueling ?truck - truck)
    (moving-path ?truck - truck ?from - place ?to - place)
  )

  (:functions
    (distance ?c1 - city ?c2 - city)
    (gasoline ?truck - truck)
    (moved-distance ?truck - truck)
    (speed ?truck - truck)
  )

  (:action load-truck
    :parameters (?pkg - package ?truck - truck ?loc - place)
    :precondition (and
      (at ?truck ?loc)
      (at ?pkg ?loc)
    )
    :effect (and
      (not (at ?pkg ?loc))
      (in ?pkg ?truck)
    )
  )

  (:action unload-truck
    :parameters (?pkg - package ?truck - truck ?loc - place)
    :precondition (and
      (at ?truck ?loc)
      (in ?pkg ?truck)
    )
    :effect (and
      (not (in ?pkg ?truck))
      (at ?pkg ?loc)
    )
  )

  (:action start-move
    :parameters (?truck - truck ?loc-from - place ?loc-to - place ?city-from - city ?city-to - city)
    :precondition (and 
      (at ?truck ?loc-from)
      (in-city ?loc-from ?city-from)
      (in-city ?loc-to ?city-to)
      (not (refueling ?truck))
      (not (moving ?truck))
      (> (gasoline ?truck) 0)
    )
    :effect (and
      (not (at ?truck ?loc-from))
      (moving ?truck) 
      (moving-path ?truck ?loc-from ?loc-to)
      (assign (moved-distance ?truck) 0)
    )
  )

  (:process moving-process
    :parameters (?truck - truck)
    :precondition (and 
      (moving ?truck)
      (> (gasoline ?truck) 0)
    )
    :effect (and
      (increase (moved-distance ?truck) (* (speed ?truck) #t))
      (decrease (gasoline ?truck) (* 2 #t))
    )
  )

  (:event arrived
    :parameters (?truck - truck ?loc-from - place ?loc-to - place ?city-from - city ?city-to - city)
    :precondition (and 
      (moving ?truck) 
      (moving-path ?truck ?loc-from ?loc-to)
      (in-city ?loc-from ?city-from)
      (in-city ?loc-to ?city-to)
      (>= (moved-distance ?truck) (distance ?city-from ?city-to))
    )
    :effect (and
      (at ?truck ?loc-to) 
      (not (moving ?truck))
      (not (moving-path ?truck ?loc-from ?loc-to))
    )
  )

  (:event out-of-gas
    :parameters (?truck - truck)
    :precondition (and
      (moving ?truck)
      (<= (gasoline ?truck) 0)
    )
    :effect (and
      (not (moving ?truck))
    )
  )

  (:action start-refuel
    :parameters (?truck - truck)
    :precondition (and
      (not (moving ?truck))
      (not (refueling ?truck))
      (< (gasoline ?truck) 100)
    )
    :effect (and
      (refueling ?truck)
    )
  )

  (:action stop-refuel
    :parameters (?truck - truck)
    :precondition (and
      (refueling ?truck)
      (>= (gasoline ?truck) 90)
    )
    :effect (and
      (not (refueling ?truck))
    )
  )

  (:process refueling-process
    :parameters (?truck - truck)
    :precondition (and
      (refueling ?truck)
      (< (gasoline ?truck) 100)
    )
    :effect (and
      (increase (gasoline ?truck) (* 10 #t))
    )
  )
)`;


function launchpddl1() {
  const extracted = extractPDDLSections(probb);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const predicates = parseInitLegacy(extracted.init);
  applyPredicates(predicates, places, vehicles, packages, cities);
  const steps = extractPlanRobust(planb);
  console.log('Extracted Steps:', steps);
  logWorldState(cities, places, vehicles, packages);
  return { cities, places, vehicles, packages, steps };
}

function launchpddl2() {
  const extracted = extractPDDLSections(prob2ex2);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  const distances = getDistances(parsed);
  console.log('Distances:', distances);
  
  // Converti i predicates nel formato legacy
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);
  
  applyPredicates(legacyPredicates, places, vehicles, packages, cities);
  const steps = extractPlanRobustPDDL2(plan2ex2);
  console.log('Extracted Steps:', steps);
  logWorldState(cities, places, vehicles, packages);
  return { cities, places, vehicles, packages, distances, steps };
}

function launchpddlplus() {
  const extracted = extractPDDLSections(problogpddlplus);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  const distances = getDistances(parsed);
  const gasolineObjects = extractGasolineObjects(parsed);
  console.log('gasolineObjects:', gasolineObjects);
  
  // Converti i predicates nel formato legacy
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);

  applyPredicates(legacyPredicates, places, vehicles, packages, cities);
  applyNumericFunctions(parsed.numericFunctions, vehicles);
  const steps = parsePlanWithDurations(planpddlplus);
  console.log('Extracted Steps:', steps);
  const fuelRates = extractFuelRates(domainpddlplus);
  logWorldState(cities, places, vehicles, packages, cities);
  return { cities, places, vehicles, packages, distances, steps, fuelRates };
}


  function extractPlanRobustPDDL2(output) {
    const lines = output.split('\n');
    const planSteps = [];
    let foundPlan = false;
    
    for (const line of lines) {
        // Cerca l'inizio del piano
        if (line.includes('Plan computed:')) {
            foundPlan = true;
            continue;
        }
        
        // Cerca la fine del piano
        if (foundPlan && (line.includes('Solution number:') || line.includes('Total time:'))) {
            break;
        }
        
        if (foundPlan) {
            // Match per le righe del piano nel formato LPG-TD
            // Formato: numero: (AZIONE PARAMETRI) [D:durata; C:costo]
            const stepMatch = line.match(/^\s*(\d+\.?\d*:\s*\([^)]+\))\s*\[[^\]]+\]/);
            if (stepMatch) {
                // Rimuove le parentesi quadre e converte l'azione in lowercase
                const cleanStep = stepMatch[1].toLowerCase();
                planSteps.push(cleanStep);
            }
        }
    }
    
    return planSteps;
}

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
