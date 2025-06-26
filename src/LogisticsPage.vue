<template>
  <div class="app">
    <h1 class="main-title">LOGISTICS PLANNING VISUALIZER</h1>
    <div style="margin-bottom: 20px;">
      <label>Tipo di planner:
        <select v-model="selectedPlanner" @change="onPlannerChange">
          <option v-for="(label, key) in plannerOptions" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <label style="margin-left: 20px;">Istanza:
        <select v-model="selectedInstanceKey" @change="onInstanceChange">
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
import { probA, planA, probb, planb, prob2ex1, plan2ex1, prob2ex2, plan2ex2, domainpddlplus, problogpddlplus, planpddlplus, problogpddlplus2, planpddlplus2 } from './pddlCases.js'; 
import { reactive } from 'vue';


// --- CASES DEFINITION ---
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

const plannerOptions = {
  launchpddl1: 'PDDL classico',
  launchpddl2: 'PDDL 2.2',
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
  // console.log('🏙️ Cities:', cities);
  // console.log('📍 Places:', places);
  // console.log('🚚 Trucks:', trucks);
  // console.log('📦 Packages:', packages);
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
  text-align: center;
  color: #000000;
  letter-spacing: 1px;
}
svg {
  border: 1px solid #ccc;
}
</style>
