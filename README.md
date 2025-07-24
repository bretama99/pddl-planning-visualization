# PDDL Planning Visualization

A comprehensive Vue.js web application for visualizing automated PDDL plans across Robotics, Elevator, and Logistics domains with support for Classical, Temporal, Numeric, and PDDL+ paradigms.

## Overview

This project transforms symbolic PDDL planning outputs into intuitive graphical representations, elucidating action sequences, temporal dependencies, and resource dynamics for human analysis. The system provides interactive timeline-based visualizations for complex multi-domain planning scenarios.

## Quick Start

```bash
# Clone repository
git clone https://github.com/bretama99/pddl-planning-visualization.git -b tmp-branch
cd pddl-planning-visualization

# Install dependencies
npm install

# Run development server
npm run serve
```

Open http://localhost:8080 in your browser.

## Features

- **Multi-PDDL Support**: Classical, Temporal, Numeric, and PDDL+ paradigms
- **Three Core Domains**: Robotics navigation, Elevator transportation, Logistics delivery
- **Interactive Timeline Visualization**: Real-time plan execution with animations
- **Plan Metrics Dashboard**: Real-time progress indicators and statistics
- **Mobile-Responsive Design**: Cross-platform accessibility

## Supported Domains

### Robotics Domain
Autonomous agents navigating spatial environments with tasks like movement and object manipulation.
- **Actions**: move, pickup, drop
- **Extensions**: Battery management, continuous processes, auto-recharge events

### Elevator Domain
Multi-floor transportation system managing passenger movement and elevator operations.
- **Actions**: go-up, go-down, open-door, enter, exit
- **Extensions**: Energy optimization, sensor-triggered events, time-constrained scheduling

### Logistics Domain
Transportation of goods across locations involving vehicles, routes, and resource management.
- **Actions**: load-truck, unload-truck, drive-truck, fly-airplane
- **Extensions**: Cargo capacity limits, fuel consumption, distance-based timing

## PDDL Paradigm Support

| Domain | Classical | Temporal | Numeric | PDDL+ |
|--------|-----------|----------|---------|-------|
| Robotics | ✅ Basic actions | ✅ Durative actions | ✅ Battery-level fluents | ✅ Continuous depletion, recharge |
| Elevator | ✅ Door operations | ✅ Timed movements | ✅ Energy, wait-time fluents | ✅ Sensor-driven events |
| Logistics | ✅ Load, unload, drive | ✅ Timed deliveries | ✅ Cargo fluents | ✅ Road events, fuel burn |

## Usage Workflow

1. **Upload Plan**: Drag-and-drop PDDL `.plan` or `.txt` files
2. **Automatic Detection**: System identifies domain and PDDL type
3. **Configure Settings**: Select visualization parameters
4. **Interactive Visualization**: Navigate through animated plan execution
5. **Analyze Metrics**: View real-time progress and statistics

## Tools and Technologies

- **Frontend**: Vue.js framework with D3.js for animations
- **Planners**: ENHSP (classical, numeric, events), OPTIC and LPG+ (temporal)
- **Parsing**: JavaScript-based modular parser system
- **Visualization**: HTML5/CSS3 with timeline-based rendering

## Interface Architecture

- **Left Sidebar**: File upload, plan type selector, feature highlights
- **Central Panel**: Domain-specific agents, step-by-step guide, metrics dashboard
- **Bottom Selector**: Icon-driven domain selection (Robotics, Elevator, Logistics)

## Parser Features

- **File Validation**: Integrity and size checking
- **Metadata Extraction**: Action start time, name, duration parsing
- **Timeline Rendering**: Chronological sorting with concurrency preservation
- **Real-time Feedback**: Progress indicators during parsing

## Configuration

The system automatically detects and configures based on uploaded PDDL files. Manual configuration available through the interface for:
- Animation speed and timing
- Visualization scale and layout
- Domain-specific parameters

## Build & Deploy

```bash
# Production build
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Requirements

- Node.js 16+
- Modern browser with ES6+ support
- PDDL planner (ENHSP, OPTIC, or LPG+)

## Authors

- BRHANE TEAMRAT GIDEY
- ROBEL GEBREHIWOT BRHANE  
- GETNET SHIFERAW MEKONNEN
- PASQUALE DE NISI

*Master in Computer Science and Artificial Intelligence*  
*DeMaCS, Università della Calabria*

Built for automated planning research and AI education.