# Coding Guidelines

- Use HTML custom elements for all components
- Keep index.html minimal with only custom elements
- Prioritize performance and bundle size optimization
- Development server runs on localhost:8080 with hot-reload
- Design custom elements to work when nested inside other HTML elements

# Architecture Overview

## Key Files

- `snapping-canvas.js` - Main canvas component (`<snapping-canvas>`) handling rectangle creation, selection, dragging, resizing, and snapping behavior
- `snapping-guides.js` - Guide system (`SnappingGuides` class) for snap-to-grid and alignment guides
- `index.html` - Minimal entry point with custom elements
- `editor/` - Editor-related components

## Snapping System

### Guide Types

1. **Fixed Guides** - User-created guides via H/V keys, stored in `fixedHorizontals` and `fixedVerticals` arrays
2. **Alignment Guides** - Dynamic guides shown during drag/resize, created by `checkAlignmentGuides()`

### Key Methods in snapping-canvas.js

- `updateOtherRects()` (line ~806) - Builds array of rectangles to snap against, excluding all selected rects
- `checkAlignmentGuides()` (line ~989) - Generates alignment guides during drag, excludes selected rects
- `handlePointerMove()` (line ~660) - Main drag/resize handler, calls snapping logic
- `handlePointerDown()` (line ~550) - Initiates drag/resize, calls `updateOtherRects()`

### Selection Behavior

- Selected rectangles are excluded from snapping calculations (they behave like "new" rects)
- `selectedRects` array tracks all currently selected rectangles
- Multi-selection uses group bounding box for snapping
- Single selection uses individual rect dimensions

### Snapping Flow

1. On pointer down, `updateOtherRects()` builds list of non-selected rects
2. During drag, `snapDrag()` checks against other rects and fixed guides
3. `checkAlignmentGuides()` creates visual alignment guides
4. `showGuides()` displays the guide lines