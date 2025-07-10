# Dynamic PDDL Plan Visualizer

A comprehensive Vue.js + Three.js application that dynamically loads PDDL domain/problem files and LPG++ `.SOL` plans, generates realistic 3D scenes, and animates plan execution with precise timing synchronization.

## Features

### 🚀 Runtime File Loading
- **Drag-and-drop interface** for PDDL domain, problem, and LPG++ plan files
- **No code changes required** - supports arbitrary planning domains
- **Real-time validation** with detailed error reporting
- **Multi-format support** for classical, temporal, numerical, and PDDL+ planning

### 🧠 Intelligent PDDL Parsing
- **Complete domain extraction**: types, predicates, functions, actions, processes, events
- **Problem analysis**: objects, initial state, goals, numeric fluents
- **Plan interpretation**: action sequences, timing, numeric effects, continuous processes
- **Validation**: domain-problem compatibility checking

### 🎨 Realistic 3D Scene Generation
- **Type-aware object modeling**: robots as humanoid figures, rooms as architectural spaces
- **Automatic asset selection**: configurable model library with fallbacks
- **Intelligent positioning**: grid layouts with initial fact-based placement
- **Dynamic scaling**: context-appropriate object sizing and orientation

### 🎬 Precise Animation System
- **Timeline synchronization**: animations fire exactly at plan-specified times
- **Action-to-visual mapping**: move (path animation), pick/drop (object attachment), numeric effects (floating text)
- **Process visualization**: continuous animations with pulsing effects
- **Performance optimized**: mesh reuse, batched animations, throttled rendering

### 🎮 Interactive Timeline Controls
- **Play/pause/seek**: full playback control with speed adjustment
- **Action highlighting**: real-time sidebar updates with progress indicators
- **Scrubber interface**: precise time navigation with action markers
- **Event synchronization**: camera and object states update on seek

### 📊 Real-time Visualization
- **Numeric fluent displays**: live gauge updates with color-coded thresholds
- **Process indicators**: continuous visual cues for active processes
- **Status overlays**: object states, action progress, system information
- **Camera controls**: multiple view modes, orbit controls, scene framing

## Architecture

### Frontend Components
