<template>
  <div class="app">
    <h1 class="main-title">LOGISTICS PLANNING VISUALIZER</h1>
    <div class="dropdown-row">
      <label class="dropdown-label">Tipo di planner:
        <select v-model="selectedPlanner" @change="onPlannerChange" class="dropdown-select">
          <option v-for="(label, key) in plannerOptions" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label class="dropdown-label">Istanza:
        <select v-model="selectedInstanceKey" @change="onInstanceChange" class="dropdown-select">
          <option v-for="instance in filteredInstances" :key="instance.key" :value="instance.key">{{ instance.name }}</option>
        </select>
      </label>
    </div>
    <MapVisualizer
      ref="mapVisRef"
      :key="visualizerKey"
      :visualizerKey="visualizerKey"
      :execution-token="executionToken"
      :cities="cities"
      :places="places"
      :vehicles="vehicles"
      :packages="packages"
      :steps="steps"
      :distances="distances"
      :fuel-rates="fuelRates"
      :shared-state="sharedState"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import extractPDDLSections, { getDistances, parseInitLegacy, parseObjects, parseInit, extractPlanRobust, extractFuelRates, parsePlanWithDurations, extractPlanRobustPDDL2 } from './pddlParser.js';
import MapVisualizer from './components/GraphVisualization.vue';
import {
  //classic e numeric
  prob1_numeric, plan1_numeric, prob1_classic, plan1_classic,
  prob2_numeric, plan2_numeric, prob2_classic, plan2_classic,
  prob3_classic, plan3_classic, prob3_numeric, plan3_numeric,
  //temporal
  prob2ex1, plan2ex1, prob2ex2, plan2ex2, prob2ex3, plan2ex3,
  //pddl+
  domainpddlplus, prob1plus, plan1plus,
  prob2plus, plan2plus,
  prob3plus, plan3plus,
  prob4plus, plan4plus,
  probnumeric1, plannumeric1, probnumeric2, plannumeric2
} from './pddlCases.js';
import { reactive } from 'vue';

// --- CASES DEFINITION ---
const cases = {
  classic1: {
    name: "3 cities classic",
    prob: prob1_classic,
    plan: plan1_classic,
    launcher: launchpddl1
  },
  numeric1: {
    name: "3 cities numeric",
    prob: prob1_numeric,
    plan: plan1_numeric,
    launcher: launchpddl1
  },
  classic2: {
    name: "4 cities classic",
    prob: prob2_classic,
    plan: plan2_classic,
    launcher: launchpddl1
  },
  numeric2: {
    name: "4 cities numeric",
    prob: prob2_numeric,
    plan: plan2_numeric,
    launcher: launchpddl1
  },
  classic3: {
    name: "5 cities classic",
    prob: prob3_classic,
    plan: plan3_classic,
    launcher: launchpddl1
  },
    numeric3: {
    name: "5 cities numeric",
    prob: prob3_numeric,
    plan: plan3_numeric,
    launcher: launchpddl1
  },
  temporal1: {
    name: "Temporal 6 cities",
    prob: prob2ex1,
    plan: plan2ex1,
    launcher: launchpddl2
  },
  temporal2: {
    name: "Temporal 3 cities and planes",
    prob: prob2ex2,
    plan: plan2ex2,
    launcher: launchpddl2
  },
  temporal3: {
    name: "Temporal 4 cities",
    prob: prob2ex3,
    plan: plan2ex3,
    launcher: launchpddl2
  },
  pddlplus1: {
    name: "Logistics with Fuel (PDDL+)",
    prob: prob1plus,
    plan: plan1plus,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
  pddlplus2: {
    name: "Logistics with Fuel 2 refuels (PDDL+)",
    prob: prob2plus,
    plan: plan2plus,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
  pddlplus3: {
    name: "Logistics refuels back and forth (PDDL+)",
    prob: prob3plus,
    plan: plan3plus,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
  pddlplus4: {
    name: "Logistics 4 cities (PDDL+)",
    prob: prob4plus,
    plan: plan4plus,
    domain: domainpddlplus,
    launcher: launchpddlplus
  },
/*   pddlnumeric1: {
    name: "numeric capacity problem",
    prob: probnumeric1,
    plan: plannumeric1,
    launcher: launchpddl2
  },
  pddlnumeric2: {
    name: "numeric capacity problem 2",
    prob: probnumeric2,
    plan: plannumeric2,
    launcher: launchpddl2
  } */
};

const plannerOptions = {
  launchpddl1: 'PDDL 1.2 & Numerics',
  launchpddl2: 'PDDL 2.1 Temporal',
  launchpddlplus: 'PDDL+',
};

const selectedPlanner = ref('launchpddl1');
const selectedInstanceKey = ref(null);
const visualizerKey = ref(0);
const mapVisRef = ref(null);
const executionToken = ref(0);


const filteredInstances = computed(() => {
  return Object.entries(cases)
    .filter(([key, c]) => c.launcher.name === selectedPlanner.value)
    .map(([key, c]) => ({ key, name: c.name }));
});

// Aggiorna selectedInstanceKey quando cambia planner
function onPlannerChange() {
  const first = filteredInstances.value[0];
  if (first) {
    selectedInstanceKey.value = first.key;
    resetVisualizer();
  }
}

function onInstanceChange() {
  resetVisualizer();
}

const sharedState = reactive({
  executionToken: 0,
  shouldStop: false
});
function resetVisualizer() {
  // Ferma l'esecuzione corrente
  sharedState.shouldStop = true;
  sharedState.executionToken++;
  
  visualizerKey.value++;
  
  console.log(`Resetting visualizer with key: ${visualizerKey.value}, execution token: ${sharedState.executionToken}`);
  
  // Resetta il flag dopo un breve delay
  nextTick(() => {
    sharedState.shouldStop = false;
  });
}

// --- LOGICA DI LANCIO E DATI REATTIVI ---
const cities = ref({});
const places = ref({});
const vehicles = ref({});
const packages = ref({});
const steps = ref([]);
const distances = ref({});
const fuelRates = ref({});

function updateData() {
  const selectedCase = cases[selectedInstanceKey.value];
  let result;
  if (selectedCase.launcher === launchpddlplus) {
    result = selectedCase.launcher(selectedCase.prob, selectedCase.plan, selectedCase.domain);
  } else {
    result = selectedCase.launcher(selectedCase.prob, selectedCase.plan);
  }
  cities.value = result.cities || {};
  places.value = result.places || {};
  vehicles.value = result.vehicles || {};
  packages.value = result.packages || {};
  steps.value = result.steps || [];
  distances.value = result.distances || {};
  fuelRates.value = result.fuelRates || {};
}

watch([selectedInstanceKey], updateData, { immediate: true });

// Imposta la prima istanza valida all'avvio
if (!selectedInstanceKey.value) {
  const first = filteredInstances.value[0];
  if (first) selectedInstanceKey.value = first.key;
}

// --- FUNZIONI DI PARSING E LANCIO (come prima) ---
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
    if (vehicles[target]) {
      if (fn.functionName === 'gasoline') {
        vehicles[target].initializeGasoline(value);
      } else if (fn.functionName === 'capacity') {
        vehicles[target].initializeCapacity(value);
      }
    }
  }
}

function launchpddl1(probString, planString) {
  const extracted = extractPDDLSections(probString);
  const { cities, places, vehicles, packages } = parseObjects(extracted.objects);

  const parsed = parseInit(extracted.init);
  applyNumericFunctions(parsed.numericFunctions, vehicles);

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
  applyNumericFunctions(parsed.numericFunctions, vehicles);
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
.main-title {
  font-size: 2.2em;
  font-weight: bold;
  margin-bottom: 18px;
  margin-top: 18px;
  display: block;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  text-align: center !important;
  color: #000000;
  letter-spacing: 1px;
}
.dropdown-row {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}
.dropdown-label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
  font-size: 1em;
  min-width: 180px;
  align-items: flex-start;
}
.dropdown-select {
  width: 220px;
  padding: 6px 10px;
  font-size: 1em;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-top: 4px;
  box-sizing: border-box;
}
svg {
  border: 1px solid #ccc;
}
</style>
