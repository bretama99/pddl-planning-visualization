/**
 * PDDL Parser Module
 * Comprehensive parser for PDDL domain and problem files
 */

import {
  PDDLDomain,
  PDDLProblem,
  PDDLType,
  PDDLPredicate,
  PDDLFunction,
  PDDLAction,
  PDDLProcess,
  PDDLEvent,
  PDDLObject,
  PDDLFact,
  PDDLNumericExpression
} from '../types/pddl';

import { PDDLDomainType } from './plannerOutputParser';

export class PDDLParser {
  private static tokenize(text: string): string[] {
    return text
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Classify PDDL domain type based on requirements and constructs
   * Following expert PDDL classification guidelines
   */
  static classifyDomainType(domain: PDDLDomain): PDDLDomainType {
    const requirements = new Set(domain.requirements || []);
    
    // Step 1: Check requirements line first
    const hasNumericFluents = requirements.has(':numeric-fluents') || requirements.has(':fluents');
    const hasDurativeActions = requirements.has(':durative-actions');
    const hasTime = requirements.has(':time');
    const hasProcesses = requirements.has(':process');
    const hasEvents = requirements.has(':event');
    
    // Step 2: Check for key constructs in order of precedence
    
    // PDDL+ indicators - highest precedence
    if (hasProcesses || hasEvents || domain.processes?.length > 0 || domain.events?.length > 0) {
      return PDDLDomainType.PDDL_PLUS;
    }
    
    // Check for #t time variable in actions (PDDL+ indicator)
    if (domain.actions?.some(action => 
      JSON.stringify(action).includes('#t') || 
      JSON.stringify(action).includes('continuous')
    )) {
      return PDDLDomainType.PDDL_PLUS;
    }
    
    // Temporal indicators
    if (hasDurativeActions || hasTime) {
      // Check if actions have durative constructs
      const hasDurativeConstructs = domain.actions?.some(action => 
        action.duration !== undefined || 
        JSON.stringify(action).includes(':duration') ||
        JSON.stringify(action).includes('at start') ||
        JSON.stringify(action).includes('at end') ||
        JSON.stringify(action).includes('over all')
      );
      
      if (hasDurativeConstructs) {
        // Check for numeric effects in durative actions
        const hasNumericEffects = domain.actions?.some(action =>
          JSON.stringify(action).includes('increase') ||
          JSON.stringify(action).includes('decrease') ||
          JSON.stringify(action).includes('assign')
        );
        
        if (hasNumericEffects || hasNumericFluents) {
          return PDDLDomainType.METRIC_TEMPORAL;
        } else {
          return PDDLDomainType.TEMPORAL;
        }
      }
    }
    
    // Numeric PDDL indicators
    if (hasNumericFluents || domain.functions?.length > 0) {
      const hasNumericOperations = domain.actions?.some(action =>
        JSON.stringify(action).includes('increase') ||
        JSON.stringify(action).includes('decrease') ||
        JSON.stringify(action).includes('assign') ||
        JSON.stringify(action).includes('*') ||
        JSON.stringify(action).includes('+') ||
        JSON.stringify(action).includes('-') ||
        JSON.stringify(action).includes('/')
      );
      
      if (hasNumericOperations) {
        return PDDLDomainType.NUMERIC;
      }
    }
    
    // Classical PDDL - default case
    // Only :strips, :typing, with Boolean predicates and instantaneous actions
    if (requirements.has(':strips') || requirements.has(':typing') || requirements.size === 0) {
      return PDDLDomainType.CLASSICAL;
    }
    
    return PDDLDomainType.UNKNOWN;
  }

  /**
   * Get domain classification summary
   */
  static getDomainClassificationSummary(domain: PDDLDomain): {
    type: PDDLDomainType;
    confidence: number;
    indicators: string[];
    requirements: string[];
  } {
    const type = this.classifyDomainType(domain);
    const requirements = domain.requirements || [];
    const indicators: string[] = [];
    let confidence = 0.9; // Default high confidence
    
    // Add specific indicators based on classification
    switch (type) {
      case PDDLDomainType.CLASSICAL:
        indicators.push('Only :strips and :typing requirements');
        indicators.push('Boolean predicates only');
        indicators.push('Instantaneous actions');
        if (requirements.length <= 2) confidence = 0.95;
        break;
        
      case PDDLDomainType.NUMERIC:
        indicators.push('Numeric fluents or :functions');
        indicators.push('Numeric operations (increase/decrease)');
        if (domain.functions?.length > 0) confidence = 0.95;
        break;
        
      case PDDLDomainType.TEMPORAL:
        indicators.push('Durative actions');
        indicators.push('Temporal requirements');
        indicators.push('No numeric effects');
        break;
        
      case PDDLDomainType.METRIC_TEMPORAL:
        indicators.push('Durative actions');
        indicators.push('Numeric fluents');
        indicators.push('Temporal + numeric operations');
        break;
        
      case PDDLDomainType.PDDL_PLUS:
        indicators.push('Processes or events');
        indicators.push('Continuous time (#t)');
        indicators.push('Differential effects');
        break;
        
      default:
        confidence = 0.3;
        indicators.push('Unable to classify clearly');
    }
    
    return {
      type,
      confidence,
      indicators,
      requirements
    };
  }

  private static parseList(tokens: string[], start: number): { result: any[]; nextIndex: number } {
    const result: any[] = [];
    let i = start + 1; // Skip opening paren

    while (i < tokens.length && tokens[i] !== ')') {
      if (tokens[i] === '(') {
        const nested = this.parseList(tokens, i);
        result.push(nested.result);
        i = nested.nextIndex;
      } else {
        result.push(tokens[i]);
        i++;
      }
    }

    return { result, nextIndex: i + 1 }; // Skip closing paren
  }

  private static parseExpression(tokens: string[], start: number): { result: any; nextIndex: number } {
    if (tokens[start] === '(') {
      return this.parseList(tokens, start);
    } else {
      return { result: tokens[start], nextIndex: start + 1 };
    }
  }

  /**
   * Parse PDDL domain file
   */
  static parseDomain(domainText: string): PDDLDomain {
    const tokens = this.tokenize(domainText.toLowerCase());
    const domain: Partial<PDDLDomain> = {
      requirements: [],
      types: [],
      predicates: [],
      functions: [],
      actions: [],
      processes: [],
      events: []
    };

    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '(' && tokens[i + 1] === 'define') {
        const defExpr = this.parseList(tokens, i);
        const defList = defExpr.result;
        
        // Parse domain definition
        if (defList[1] && Array.isArray(defList[1]) && defList[1][0] === 'domain') {
          domain.name = defList[1][1];
        }

        // Parse sections
        for (let j = 2; j < defList.length; j++) {
          const section = defList[j];
          if (Array.isArray(section)) {
            this.parseDomainSection(section, domain);
          }
        }

        i = defExpr.nextIndex;
      } else {
        i++;
      }
    }

    return domain as PDDLDomain;
  }

  private static parseDomainSection(section: any[], domain: Partial<PDDLDomain>): void {
    const sectionType = section[0];

    switch (sectionType) {
      case ':requirements':
        domain.requirements = section.slice(1);
        break;

      case ':types':
        domain.types = this.parseTypes(section.slice(1));
        break;

      case ':predicates':
        domain.predicates = this.parsePredicates(section.slice(1));
        break;

      case ':functions':
        domain.functions = this.parseFunctions(section.slice(1));
        break;

      case ':action':
        if (domain.actions) {
          domain.actions.push(this.parseAction(section));
        }
        break;

      case ':process':
        if (domain.processes) {
          domain.processes.push(this.parseProcess(section));
        }
        break;

      case ':event':
        if (domain.events) {
          domain.events.push(this.parseEvent(section));
        }
        break;
    }
  }

  private static parseTypes(typeList: any[]): PDDLType[] {
    const types: PDDLType[] = [];
    let i = 0;

    while (i < typeList.length) {
      if (typeList[i] === '-') {
        // Handle typed list: type1 type2 - parent_type
        const parentType = typeList[i + 1];
        // Go back and set parent for previous types
        let j = i - 1;
        while (j >= 0 && typeList[j] !== '-') {
          const existingType = types.find(t => t.name === typeList[j]);
          if (existingType) {
            existingType.parent = parentType;
          } else {
            types.push({ name: typeList[j], parent: parentType });
          }
          j--;
        }
        i += 2;
      } else {
        types.push({ name: typeList[i] });
        i++;
      }
    }

    return types;
  }

  private static parsePredicates(predicateList: any[]): PDDLPredicate[] {
    return predicateList
      .filter(item => Array.isArray(item))
      .map(pred => ({
        name: pred[0],
        parameters: this.parseParameterList(pred.slice(1))
      }));
  }

  private static parseFunctions(functionList: any[]): PDDLFunction[] {
    return functionList
      .filter(item => Array.isArray(item))
      .map(func => ({
        name: func[0],
        parameters: this.parseParameterList(func.slice(1)),
        returnType: 'number' // PDDL functions return numbers
      }));
  }

  private static parseParameterList(params: any[]): Array<{ name: string; type: string }> {
    const parameters: Array<{ name: string; type: string }> = [];
    let i = 0;

    while (i < params.length) {
      if (params[i] === '-') {
        // Handle typed parameters: ?x ?y - type
        const type = params[i + 1];
        let j = i - 1;
        while (j >= 0 && params[j] !== '-') {
          parameters.push({
            name: params[j].startsWith('?') ? params[j] : `?${params[j]}`,
            type: type
          });
          j--;
        }
        i += 2;
      } else {
        parameters.push({
          name: params[i].startsWith('?') ? params[i] : `?${params[i]}`,
          type: 'object' // default type
        });
        i++;
      }
    }

    return parameters;
  }

  private static parseAction(actionDef: any[]): PDDLAction {
    const action: Partial<PDDLAction> = {
      name: '',
      parameters: [],
      preconditions: [],
      effects: [],
      numericEffects: []
    };

    let i = 1; // Skip ':action'
    action.name = actionDef[i++];

    while (i < actionDef.length) {
      const section = actionDef[i];
      
      if (section === ':parameters') {
        action.parameters = this.parseParameterList(actionDef[i + 1]);
        i += 2;
      } else if (section === ':precondition') {
        action.preconditions = this.parseCondition(actionDef[i + 1]);
        i += 2;
      } else if (section === ':effect') {
        const effects = this.parseEffect(actionDef[i + 1]);
        action.effects = effects.facts;
        action.numericEffects = effects.numeric;
        i += 2;
      } else if (section === ':duration') {
        action.duration = this.parseNumericExpression(actionDef[i + 1]);
        i += 2;
      } else {
        i++;
      }
    }

    return action as PDDLAction;
  }

  private static parseProcess(processDef: any[]): PDDLProcess {
    const process: Partial<PDDLProcess> = {
      name: '',
      parameters: [],
      preconditions: [],
      effects: []
    };

    let i = 1; // Skip ':process'
    process.name = processDef[i++];

    while (i < processDef.length) {
      const section = processDef[i];
      
      if (section === ':parameters') {
        process.parameters = this.parseParameterList(processDef[i + 1]);
        i += 2;
      } else if (section === ':precondition') {
        process.preconditions = this.parseCondition(processDef[i + 1]);
        i += 2;
      } else if (section === ':effect') {
        process.effects = this.parseProcessEffect(processDef[i + 1]);
        i += 2;
      } else {
        i++;
      }
    }

    return process as PDDLProcess;
  }

  private static parseEvent(eventDef: any[]): PDDLEvent {
    const event: Partial<PDDLEvent> = {
      name: '',
      parameters: [],
      preconditions: [],
      effects: []
    };

    let i = 1; // Skip ':event'
    event.name = eventDef[i++];

    while (i < eventDef.length) {
      const section = eventDef[i];
      
      if (section === ':parameters') {
        event.parameters = this.parseParameterList(eventDef[i + 1]);
        i += 2;
      } else if (section === ':precondition') {
        event.preconditions = this.parseCondition(eventDef[i + 1]);
        i += 2;
      } else if (section === ':effect') {
        event.effects = this.parseCondition(eventDef[i + 1]);
        i += 2;
      } else {
        i++;
      }
    }

    return event as PDDLEvent;
  }

  private static parseCondition(condition: any): PDDLFact[] {
    if (!Array.isArray(condition)) {
      return [];
    }

    if (condition[0] === 'and') {
      return condition.slice(1).flatMap((cond: any) => this.parseCondition(cond));
    }

    if (typeof condition[0] === 'string' && !condition[0].startsWith(':')) {
      return [{
        predicate: condition[0],
        args: condition.slice(1)
      }];
    }

    return [];
  }

  private static parseEffect(effect: any): { facts: PDDLFact[]; numeric: any[] } {
    const facts: PDDLFact[] = [];
    const numeric: any[] = [];

    if (!Array.isArray(effect)) {
      return { facts, numeric };
    }

    if (effect[0] === 'and') {
      effect.slice(1).forEach((eff: any) => {
        const parsed = this.parseEffect(eff);
        facts.push(...parsed.facts);
        numeric.push(...parsed.numeric);
      });
    } else if (effect[0] === 'not') {
      facts.push({
        predicate: `not-${effect[1][0]}`,
        args: effect[1].slice(1)
      });
    } else if (['increase', 'decrease', 'assign'].includes(effect[0])) {
      numeric.push({
        function: Array.isArray(effect[1]) ? effect[1][0] : effect[1],
        operation: effect[0],
        value: this.parseNumericExpression(effect[2])
      });
    } else if (typeof effect[0] === 'string') {
      facts.push({
        predicate: effect[0],
        args: effect.slice(1)
      });
    }

    return { facts, numeric };
  }

  private static parseProcessEffect(effect: any): Array<{ function: string; rate: PDDLNumericExpression }> {
    const effects: Array<{ function: string; rate: PDDLNumericExpression }> = [];

    if (!Array.isArray(effect)) {
      return effects;
    }

    if (effect[0] === 'and') {
      effect.slice(1).forEach((eff: any) => {
        effects.push(...this.parseProcessEffect(eff));
      });
    } else if (effect[0] === 'increase') {
      effects.push({
        function: Array.isArray(effect[1]) ? effect[1][0] : effect[1],
        rate: this.parseNumericExpression(effect[2])
      });
    }

    return effects;
  }

  private static parseNumericExpression(expr: any): PDDLNumericExpression | number {
    if (typeof expr === 'number') {
      return expr;
    }

    if (typeof expr === 'string') {
      const num = parseFloat(expr);
      return isNaN(num) ? expr as any : num;
    }

    if (Array.isArray(expr)) {
      return {
        operator: expr[0],
        operands: expr.slice(1).map(op => this.parseNumericExpression(op))
      };
    }

    return 0;
  }

  /**
   * Parse PDDL problem file
   */
  static parseProblem(problemText: string): PDDLProblem {
    const tokens = this.tokenize(problemText.toLowerCase());
    const problem: Partial<PDDLProblem> = {
      objects: [],
      init: [],
      goal: [],
      numericInit: []
    };

    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '(' && tokens[i + 1] === 'define') {
        const defExpr = this.parseList(tokens, i);
        const defList = defExpr.result;
        
        // Parse problem definition
        if (defList[1] && Array.isArray(defList[1]) && defList[1][0] === 'problem') {
          problem.name = defList[1][1];
        }

        // Parse sections
        for (let j = 2; j < defList.length; j++) {
          const section = defList[j];
          if (Array.isArray(section)) {
            this.parseProblemSection(section, problem);
          }
        }

        i = defExpr.nextIndex;
      } else {
        i++;
      }
    }

    return problem as PDDLProblem;
  }

  private static parseProblemSection(section: any[], problem: Partial<PDDLProblem>): void {
    const sectionType = section[0];

    switch (sectionType) {
      case ':domain':
        problem.domain = section[1];
        break;

      case ':objects':
        problem.objects = this.parseObjects(section.slice(1));
        break;

      case ':init':
        const initData = this.parseInit(section.slice(1));
        problem.init = initData.facts;
        problem.numericInit = initData.numeric;
        break;

      case ':goal':
        problem.goal = this.parseCondition(section[1]);
        break;

      case ':metric':
        problem.metric = {
          optimization: section[1] as 'minimize' | 'maximize',
          expression: this.parseNumericExpression(section[2])
        };
        break;
    }
  }

  private static parseObjects(objectList: any[]): PDDLObject[] {
    const objects: PDDLObject[] = [];
    const objectNames = new Set<string>();
    
    console.log('Parsing objects from list:', objectList);
    
    let i = 0;
    while (i < objectList.length) {
      // Look for pattern: name1 name2 ... - type
      if (typeof objectList[i] === 'string' && objectList[i] !== '-') {
        const currentNames: string[] = [];
        
        // Collect object names until we hit '-'
        while (i < objectList.length && objectList[i] !== '-') {
          if (typeof objectList[i] === 'string') {
            currentNames.push(objectList[i]);
          }
          i++;
        }
        
        // Skip the '-' and get the type
        if (i < objectList.length && objectList[i] === '-') {
          i++; // Skip '-'
          if (i < objectList.length) {
            const type = objectList[i];
            
            // Create objects with the specified type
            currentNames.forEach(name => {
              if (!objectNames.has(name)) {
                objects.push({
                  name: name,
                  type: type,
                  properties: {}
                });
                objectNames.add(name);
                console.log(`Created object: ${name} (${type})`);
              }
            });
            i++; // Move past the type
          }
        }
      } else {
        i++;
      }
    }
    
    console.log(`Total objects created: ${objects.length}`);
    return objects;
  }

  private static parseInit(initList: any[]): { facts: PDDLFact[]; numeric: any[] } {
    const facts: PDDLFact[] = [];
    const numeric: any[] = [];

    initList.forEach(item => {
      if (Array.isArray(item)) {
        if (item[0] === '=') {
          // Numeric initialization: (= (function obj) value)
          const funcDef = item[1];
          const value = parseFloat(item[2]) || 0;
          
          let functionName = '';
          let objectId = '';
          
          if (Array.isArray(funcDef)) {
            functionName = funcDef[0];
            objectId = funcDef[1] || '';
          } else {
            functionName = funcDef;
          }
          
          // Determine fluent type based on function name
          let fluentType: 'battery' | 'fuel' | 'capacity' | 'time' | 'distance' | 'other' = 'other';
          if (functionName.toLowerCase().includes('battery')) {
            fluentType = 'battery';
          } else if (functionName.toLowerCase().includes('fuel')) {
            fluentType = 'fuel';
          } else if (functionName.toLowerCase().includes('time')) {
            fluentType = 'time';
          } else if (functionName.toLowerCase().includes('distance')) {
            fluentType = 'distance';
          } else if (functionName.toLowerCase().includes('capacity')) {
            fluentType = 'capacity';
          }
          
          numeric.push({
            function: funcDef,
            functionName: functionName,
            objectId: objectId,
            value: value,
            type: fluentType
          });
        } else {
          // Predicate fact
          facts.push({
            predicate: item[0],
            args: item.slice(1)
          });
        }
      }
    });

    return { facts, numeric };
  }

  /**
   * Validate parsed domain and problem compatibility
   */
  static validateDomainProblem(domain: PDDLDomain, problem: PDDLProblem): string[] {
    const errors: string[] = [];

    // Check domain reference
    if (problem.domain !== domain.name) {
      errors.push(`Problem domain "${problem.domain}" does not match domain name "${domain.name}"`);
    }

    // Check object types
    const domainTypes = new Set(domain.types.map(t => t.name));
    domainTypes.add('object'); // Built-in type

    problem.objects.forEach(obj => {
      if (!domainTypes.has(obj.type)) {
        errors.push(`Object "${obj.name}" has unknown type "${obj.type}"`);
      }
    });

    // Check predicates in init and goal
    const domainPredicates = new Set(domain.predicates.map(p => p.name));

    [...problem.init, ...problem.goal].forEach(fact => {
      if (!domainPredicates.has(fact.predicate) && !fact.predicate.startsWith('not-')) {
        errors.push(`Unknown predicate "${fact.predicate}" used in problem`);
      }
    });

    return errors;
  }
}
