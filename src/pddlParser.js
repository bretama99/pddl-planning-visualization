import City from './models/City.js';
import Place from './models/Place.js';
import Truck from './models/Truck.js';
import Package from './models/Package.js';
import * as constants from "./constants.js";

export default function extractPDDLSections(fileContent) {
    /**
     * Estrae le sezioni :objects e :init da un file PDDL usando bilanciamento parentesi
     */
    
    const results = {};
    
    // Funzione helper per trovare una sezione bilanciando le parentesi
    function findSection(content, sectionName) {
        const startPattern = `(:${sectionName}`;
        const startIndex = content.indexOf(startPattern);
        
        if (startIndex === -1) {
            return null;
        }
        
        let count = 0;
        let i = startIndex;
        
        // Conta le parentesi per trovare la fine della sezione
        while (i < content.length) {
            if (content[i] === '(') {
                count++;
            } else if (content[i] === ')') {
                count--;
                if (count === 0) {
                    const section = content.substring(startIndex, i + 1);
                    // Pulisce la stringa rimuovendo spazi extra e newline
                    return section.replace(/\s+/g, ' ').trim();
                }
            }
            i++;
        }
        
        return null;
    }
    
    // Estrae :objects
    const objectsSection = findSection(fileContent, 'objects');
    if (objectsSection) {
        results.objects = objectsSection;
    }
    
    // Estrae :init
    const initSection = findSection(fileContent, 'init');
    if (initSection) {
        results.init = initSection;
    }
    
    return results;
}


/**
 * Funzione helper per estrarre espressioni bilanciate da una stringa
 * @param {string} str - La stringa da cui estrarre le espressioni
 * @returns {Array} Array di espressioni estratte
 */
function extractBalancedExpressions(str) {
    const expressions = [];
    let i = 0;
    
    while (i < str.length) {
        // Trova l'inizio di una parentesi
        if (str[i] === '(') {
            let count = 0;
            let start = i;
            
            // Bilancia le parentesi
            while (i < str.length) {
                if (str[i] === '(') {
                    count++;
                } else if (str[i] === ')') {
                    count--;
                    if (count === 0) {
                        // Estrae l'espressione completa
                        expressions.push(str.substring(start, i + 1));
                        break;
                    }
                }
                i++;
            }
        }
        i++;
    }
    
    return expressions;
}

/**
 * Parsea una singola espressione PDDL
 * @param {string} expression - L'espressione da parsare (es. "(at tru1 pos1)" o "(= (distance cit1 cit2) 100)")
 * @returns {Object} Oggetto con tipo e componenti dell'espressione
 */
function parseExpression(expression) {
    // Rimuove parentesi esterne
    const content = expression.slice(1, -1).trim();
    
    // Controlla se è un'espressione di uguaglianza numerica
    if (content.startsWith('=')) {
        // Estrae la parte dopo '='
        const afterEquals = content.substring(1).trim();
        
        // Trova la funzione (es. "(distance cit1 cit2)")
        const functionMatch = afterEquals.match(/^\(([^)]+)\)/);
        if (functionMatch) {
            const functionPart = functionMatch[1];
            const functionTokens = functionPart.split(/\s+/);
            const functionName = functionTokens[0];
            const functionArgs = functionTokens.slice(1);
            
            // Trova il valore numerico
            const valueMatch = afterEquals.match(/\)\s*(\d+(?:\.\d+)?)/);
            const value = valueMatch ? parseFloat(valueMatch[1]) : 0;
            
            return {
                type: 'numeric',
                functionName: functionName,
                args: functionArgs,
                value: value,
                raw: expression
            };
        }
    }
    
    // Espressione predicativa normale
    const tokens = content.split(/\s+/);
    return {
        type: 'predicate',
        predicate: tokens[0],
        args: tokens.slice(1),
        raw: expression
    };
}

/**
 * Parsea la sezione :init migliorata per gestire funzioni numeriche
 * @param {string} initStr - La stringa della sezione :init
 * @returns {Object} Oggetto con predicati e funzioni numeriche separate
 */
export function parseInit(initStr) {
    // Rimuove il tag :init iniziale
    const cleanStr = initStr.replace(/^\(:init\s*/, '').replace(/\)$/, '');
    
    // Estrae tutte le espressioni bilanciate
    const expressions = extractBalancedExpressions(cleanStr);
    
    const predicates = [];
    const numericFunctions = [];
    
    expressions.forEach(expr => {
        const parsed = parseExpression(expr);
        
        if (parsed.type === 'numeric') {
            numericFunctions.push({
                functionName: parsed.functionName,
                args: parsed.args,
                value: parsed.value,
                raw: parsed.raw
            });
        } else {
            predicates.push({
                predicate: parsed.predicate,
                args: parsed.args,
                raw: parsed.raw
            });
        }
    });
    
    return {
        predicates: predicates,
        numericFunctions: numericFunctions
    };
}

/**
 * Versione di compatibilità che restituisce il formato originale per i predicati
 * @param {string} initStr - La stringa della sezione :init
 * @returns {Array} Array nel formato originale [predicate, arg1, arg2, ...]
 */
export function parseInitLegacy(initStr) {
    const parsed = parseInit(initStr);
    return parsed.predicates.map(pred => [pred.predicate, ...pred.args]);
}

export function parseObjects(objectsStr) {
    // Rimuovo parentesi e tag :objects
    let result = objectsStr.replace(/[()]/g, "").replace(":objects", "");
    // Trova blocchi come "pos2 pos1 - location"
    const regex = /\s*((?:[a-zA-Z0-9]+\s*)+-\s*[a-zA-Z0-9-]+)/g;
    const matches = result.match(regex);

    const cities = {};
    const places = {};
    const vehicles = {};
    const packages = {};

    let idCounter = 1;

    matches.forEach(item => {
        const parts = item.trim().split("-");
        const names = parts[0].trim().split(/\s+/);
        const type = parts[1].trim();

        names.forEach(name => {
            switch (type) {
                case 'city':
                    cities[name] = new City(idCounter++, name);
                    break;
                case 'location':
                    places[name] = new Place(idCounter++, name, null, constants.PLACE_SUBTYPE_LOCATION);
                    break;
                case 'gasstation':
                    places[name] = new Place(idCounter++, name, null, constants.PLACE_SUBTYPE_GASSTATION);
                    break;
                case 'airport':
                    places[name] = new Place(idCounter++, name, null, constants.PLACE_SUBTYPE_AIRPORT);
                    break;
                case constants.VEHICLE_SUBTYPES.TRUCK:
                    vehicles[name] = new Truck(idCounter++, name, null, constants.VEHICLE_SUBTYPES.TRUCK);
                    break;
                case constants.VEHICLE_SUBTYPES.AIRPLANE:
                    vehicles[name] = new Truck(idCounter++, name, null, constants.VEHICLE_SUBTYPES.AIRPLANE);
                    break;
                case 'package':
                    packages[name] = new Package(idCounter++, name);
                    break;
            }
        });
    });

    return { cities, places, vehicles, packages };
}



export function extractPlanRobust(output) {
    const lines = output.split('\n');
    const planSteps = [];
    let foundPlan = false;
    
    for (const line of lines) {
        if (line.includes('found plan:')) {
            foundPlan = true;
            // Controlla se il piano inizia sulla stessa riga
            const sameLine = line.match(/found plan:\s*(\d+\.0:\s*\([^)]+\))/);
            if (sameLine) {
                planSteps.push(sameLine[1]);
            }
            continue;
        }
        
        if (foundPlan && line.includes('plan-length:')) {
            break;
        }
        
        if (foundPlan) {
            const stepMatch = line.match(/^\s*(\d+\.0:\s*\([^)]+\))/);
            if (stepMatch) {
                planSteps.push(stepMatch[1]);
            }
        }
    }
    
    return planSteps;
}

/**
 * Funzione helper per ottenere tutti i valori di distanza da un init parsato
 * @param {Object} parsedInit - Risultato di parseInit()
 * @returns {Array} Array di oggetti distanza {from, to, distance}
 */
export function getDistances(parsedInit) {
    return parsedInit.numericFunctions
        .filter(func => func.functionName === 'distance')
        .map(func => ({
            from: func.args[0],
            to: func.args[1],
            distance: func.value
        }));
}


export function extractFuelRates(pddlDomain) {
    const rates = {
        refuelRate: null,
        consumptionRate: null
    };
    const refuelPattern = /\(increase\s+\(gasoline\s+\?\w+\)\s+\(\*\s+(\d+(?:\.\d+)?)\s+#t\)\)/g;
    const refuelMatch = refuelPattern.exec(pddlDomain);
    if (refuelMatch) {
        rates.refuelRate = parseFloat(refuelMatch[1]);
    }
    const consumptionPattern = /\(decrease\s+\(gasoline\s+\?\w+\)\s+\(\*\s+(\d+(?:\.\d+)?)\s+#t\)\)/g;
    const consumptionMatch = consumptionPattern.exec(pddlDomain);
    if (consumptionMatch) {
        rates.consumptionRate = parseFloat(consumptionMatch[1]);
    }
    return rates;
}

export function parsePlanWithDurations(outputText) {
  const lines = outputText.split('\n');
  const plan = [];
  let inPlan = false;
  let lastAction = null;
  for (const line of lines) {
    if (line.includes('Found Plan:') || line.includes('found plan:')) {
      inPlan = true;
      continue;
    }
    if (inPlan) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('Plan-Length')) break;
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

export function extractPlanRobustPDDL2(output) {
    const lines = output.split('\n');
    const planSteps = [];
    let foundPlan = false;
    for (const line of lines) {
        if (line.includes('Plan computed:')) {
            foundPlan = true;
            continue;
        }
        if (foundPlan && (line.includes('Solution number:') || line.includes('Total time:'))) {
            break;
        }
        if (foundPlan) {
            const stepMatch = line.match(/^\s*(\d+\.?\d*:\s*\([^)]+\))\s*\[[^\]]+\]/);
            if (stepMatch) {
                const cleanStep = stepMatch[1].toLowerCase();
                planSteps.push(cleanStep);
            }
        }
    }
    return planSteps;
}