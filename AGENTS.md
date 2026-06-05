# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

JSON Spotlight Editor - A React-based table editor for nested JSON data. Converts hierarchical JSON into a flat, editable spreadsheet view with virtual scrolling, filtering, and Excel export.

## Commands

```bash
# Development
pnpm dev          # Start Vite dev server (http://localhost:5173)
pnpm build        # Production build to dist/
pnpm preview      # Preview production build

# Desktop (Neutralino.js)
pnpm neu:run      # Run as desktop app
pnpm neu:build    # Build desktop app with embedded resources
```

## Architecture

### Core Data Flow

1. **JSON Import** → `flattenJSON()` converts nested JSON into `FlatRow[]`
2. **Table Display** → Virtual scrolling renders only visible rows (ROW_HEIGHT=40, OVERSCAN=5)
3. **Editing** → Cell changes update `flatRows` state and push to history stack
4. **JSON Export** → `unflattenJSON()` reconstructs original structure from modified rows

### Key Files

- **App.tsx** - Main component with all state management (~615 lines). Contains:
  - History/undo-redo logic (history stack + historyIndex)
  - Virtual scroll calculations (visibleRange, paddingTop/Bottom)
  - Filter and selection state
  - Theme persistence (localStorage)
  - Column width resizing

- **utils/jsonHelper.ts** - Core flattening logic:
  - `flattenJSON()` - Traverses nested JSON, creates rows at array boundaries
  - `unflattenJSON()` - Reconstructs JSON using stored property paths
  - `smartParseValue()` - Type coercion for cell input ("true"→true, "123"→123)

- **types.ts** - Data structures:
  - `FlatRow` - Row with `_id`, `_path`, `_propPaths`, `_propPathIds` metadata
  - `ColumnMeta` - Column definition with `isParent` flag for inherited properties

### Component Pattern

All modals follow controlled pattern: `isOpen` + `onClose` props. Components are self-contained with their own state.

### Virtual Scrolling

Table uses manual virtualization - not a library. Key constants in App.tsx:
- `ROW_HEIGHT = 40` - Fixed row height
- `OVERSCAN = 5` - Extra rows above/below viewport
- Scroll position tracked via `onScroll` handler on container

### Path Tracking System

Each cell stores its exact path in the original JSON via `_propPaths` and `_propPathIds`. This enables:
- Editing parent-level properties from any child row
- Bulk edits that update all rows sharing the same path
- Accurate reconstruction of nested structure on export

## Styling

Tailwind CSS 4 with dark mode via `dark` class on `<html>`. Theme state persisted to localStorage key `json-grid-theme`.
