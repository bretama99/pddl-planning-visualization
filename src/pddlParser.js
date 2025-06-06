import City from './models/City.js';
import Place from './models/Place.js';
import Truck from './models/Truck.js';
import Package from './models/Package.js';

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

/* function extractFromFile(filePath) {
    const fs = require('fs');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return extractPDDLSections(content);
    } catch (error) {
        console.error('Errore nella lettura del file:', error.message);
        return {};
    }
} */

// Funzione per estrarre solo una sezione specifica
function extractSingleSection(fileContent, sectionName) {
    const startPattern = `(:${sectionName}`;
    const startIndex = fileContent.indexOf(startPattern);
    
    if (startIndex === -1) {
        return null;
    }
    
    let count = 0;
    let i = startIndex;
    
    while (i < fileContent.length) {
        if (fileContent[i] === '(') {
            count++;
        } else if (fileContent[i] === ')') {
            count--;
            if (count === 0) {
                const section = fileContent.substring(startIndex, i + 1);
                return section.replace(/\s+/g, ' ').trim();
            }
        }
        i++;
    }
    
    return null;
}

export function parseInit(initStr) {
  const regex = /\(([a-zA-Z0-9-]+\s*)+\)/g;
  const matches = initStr.match(regex);

  return matches.map(item => {
    const noParens = item.slice(1, -1);
    return noParens.trim().split(/\s+/);
  });
}

export function parseObjects(objectsStr) {
  // Rimuovo parentesi e tag :objects
  let result = objectsStr.replace(/[()]/g, "").replace(":objects", "");
  // Trova blocchi come "pos2 pos1 - location"
  const regex = /\s*((?:[a-zA-Z0-9]+\s*)+-\s*[a-zA-Z0-9]+)/g;
  const matches = result.match(regex);

  const cities = {};
  const places = {};
  const trucks = {};
  const packages = {};

  let idCounter = 1;

  matches.forEach(item => {
    // Esempio item = " pos2 pos1 - location"
    const parts = item.trim().split("-");
    const names = parts[0].trim().split(/\s+/); // [pos2, pos1]
    const type = parts[1].trim(); // location

    names.forEach(name => {
      if (type === 'city') {
        cities[name] = new City(idCounter++, name);
      } else if (type === 'location') {
        places[name] = new Place(idCounter++, name);
      } else if (type === 'truck') {
        trucks[name] = new Truck(idCounter++, name);
      } else if (type === 'package') {
        packages[name] = new Package(idCounter++, name);
      }
    });
  });

  return { cities, places, trucks, packages };
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