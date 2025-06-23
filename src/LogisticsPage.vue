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
import extractPDDLSections, { extractSingleSection, getDistances, getPredicatesByType, parseInitLegacy, extractGasolineObjects } from './pddlParser.js';
import { parseObjects, parseInit, extractPlanRobust } from './pddlParser.js';
import MapVisualizer from './components/GraphVisualization.vue';
import {probA,planA,probb,planb,prob2ex1,plan2ex1,prob2ex2,plan2ex2,domainpddlplus,problogpddlplus,planpddlplus} from './pddlCases.js'; 

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
  }
};

const selectedCase = cases['classicA']; // Cambia qui per selezionare un altro caso

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
  const gasolineObjects = extractGasolineObjects(parsed);
  const legacyPredicates = parsed.predicates.map(p => [p.predicate, ...p.args]);
  applyPredicates(legacyPredicates, places, vehicles, packages, cities);
  applyNumericFunctions(parsed.numericFunctions, vehicles);
  const steps = parsePlanWithDurations(planString);
  const fuelRates = extractFuelRates(domainString);
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
