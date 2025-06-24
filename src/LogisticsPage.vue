<template>
  <div class="app">
    <MapVisualizer
      :cities="cities"
      :places="places"
      :vehicles="vehicles"
      :packages="packages"
      :steps="steps"
      :distances="distances"
      :fuel-rates="fuelRates"
    />
  </div>
</template>


<script setup>
import extractPDDLSections, { getDistances, parseInitLegacy, parseObjects, parseInit, extractPlanRobust, extractFuelRates, parsePlanWithDurations, extractPlanRobustPDDL2 } from './pddlParser.js';
import MapVisualizer from './components/GraphVisualization.vue';
import {probA,planA,probb,planb,prob2ex1,plan2ex1,prob2ex2,plan2ex2,domainpddlplus,problogpddlplus,planpddlplus, problogpddlplus2, planpddlplus2} from './pddlCases.js'; 

const cases = {
  classicA: {
    name: "Logistics Multi-City A",
    prob: probA,
    plan: planA,
    launcher: launchpddl1
  },
  classicB: {
    name: "Logistics Delivery B",
    prob: probb,
    plan: planb,
    launcher: launchpddl1
  },
  temporal1: {
    name: "Temporal Trucks Only",
    prob: prob2ex1,
    plan: plan2ex1,
    launcher: launchpddl2
  },
  temporal2: {
    name: "Temporal with Airplanes",
    prob: prob2ex2,
    plan: plan2ex2,
    launcher: launchpddl2
  },
  pddlplus: {
    name: "Logistics with Fuel (PDDL+)",
    prob: problogpddlplus,
    plan: planpddlplus,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
  pddlplus2: {
    name: "Logistics with Fuel 2 refuels (PDDL+)",
    prob: problogpddlplus2,
    plan: planpddlplus2,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
};

const selectedCase = cases['temporal1']; // Cambia qui per selezionare un altro caso

let result;
if (selectedCase.launcher === launchpddlplus) {
  result = selectedCase.launcher(selectedCase.prob, selectedCase.plan, selectedCase.domain);
} else {
  result = selectedCase.launcher(selectedCase.prob, selectedCase.plan);
}

const { cities, places, vehicles, packages, steps, distances, fuelRates } = result;

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

function launchpddl1(probString, planString) {
  const extracted = extractPDDLSections(probString);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const predicates = parseInitLegacy(extracted.init);
  applyPredicates(predicates, places, vehicles, packages, cities);
  const steps = extractPlanRobust(planString);
  logWorldState(cities, places, vehicles, packages);
  return { cities, places, vehicles, packages, steps };
}

function launchpddl2(probString, planString) {
  const extracted = extractPDDLSections(probString);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  const distances = getDistances(parsed);
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);
  applyPredicates(legacyPredicates, places, vehicles, packages, cities);
  const steps = extractPlanRobustPDDL2(planString);
  logWorldState(cities, places, vehicles, packages);
  return { cities, places, vehicles, packages, distances, steps };
}


function launchpddlplus(probString, planString, domainString) {
  const extracted = extractPDDLSections(probString);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);
  const parsed = parseInit(extracted.init);
  const distances = getDistances(parsed);
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);
  applyPredicates(legacyPredicates, places, vehicles, packages, cities);
  applyNumericFunctions(parsed.numericFunctions, vehicles);
  const steps = parsePlanWithDurations(planString);
  const fuelRates = extractFuelRates(domainString);
  logWorldState(cities, places, vehicles, packages, cities);
  return { cities, places, vehicles, packages, distances, steps, fuelRates };
}

function logWorldState(cities, places, trucks, packages) {
  console.log('🏙️ Cities:', cities);
  console.log('📍 Places:', places);
  console.log('🚚 Trucks:', trucks);
  console.log('📦 Packages:', packages);
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
