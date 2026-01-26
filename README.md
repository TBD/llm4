# llm4 - Snapping Canvas and Guides System

A web-based canvas application that allows you to move, resize, align, and distribute interactive rectangular elements with intelligent snapping guides.

## Features

### Core Functionality
- **Drag and Move**: Move elements around the canvas with smooth interactions
- **Resize**: Resize elements using the resize handle (bottom-right corner)
- **Snapping Guides**: Automatic alignment guides snap elements to other elements and fixed guides
- **Multi-Select**: Select multiple elements simultaneously using Shift/Cmd+click
- **Marquee Selection**: Drag to create a selection box around multiple elements
- **Alignment Tools**: Align selected elements left, center, right, top, middle, or bottom
- **Distribution**: Evenly space 3+ selected elements horizontally or vertically
- **Duplication**: Clone elements using Alt+drag or Clone button
- **Deletion**: Remove selected elements with Backspace/Delete key
- **Fixed Guides**: Create permanent horizontal and vertical guides for reference

### Custom Elements

#### `<snapping-canvas>`
The main container element that manages the interactive canvas and all draggable rectangles.

**Key Properties & Methods:**
- `selectedRects`: Array of currently selected rectangle elements
- `dragging`: Reference to the element being dragged
- `resizing`: Reference to the element being resized
- `selectRect(rect)`: Add a rectangle to the selection
- `deselectRect(rect)`: Remove a rectangle from the selection
- `selectAll()`: Select all rectangles on the canvas
- `deselectAll()`: Clear all selections
- `duplicateSelection()`: Clone all selected rectangles
- `eraseSelection()`: Delete all selected rectangles
- `alignSelectionLeft/Center/Right/Top/Middle/Bottom()`: Align selected elements
- `distributeSelectionHorizontally/Vertically()`: Evenly space selected elements

#### `<snapping-guides>`
Manages visual guides and snapping behavior for elements on the canvas.

**Key Properties & Methods:**
- `snapDistance`: Threshold in pixels for snapping (default: 10px)
- `fixedHorizontals`: Array of y-coordinates for fixed horizontal guides
- `fixedVerticals`: Array of x-coordinates for fixed vertical guides
- `showVertical(x)` / `showHorizontal(y)`: Display temporary alignment guides
- `addHorizontalGuide(y)` / `addVerticalGuide(x)`: Create permanent guides
- `snapDrag(left, top, width, height, others)`: Calculate snapped position during drag
- `snapResize(rect, newW, newH, others)`: Calculate snapped size during resize
- `removeAllFixedGuides()`: Clear all permanent guides

## Keyboard Shortcuts

### Desktop
| Key | Action |
|-----|--------|
| H | Add horizontal guide at cursor position |
| V | Add vertical guide at cursor position |
| R | Remove all fixed guides |
| B | Toggle element borders and resize handles |
| Cmd+A / Ctrl+A | Select all elements |
| Shift/Cmd+click | Multi-select elements |
| Alt+drag | Duplicate selected element(s) |
| Backspace / Delete | Delete selected elements |
| Cmd+Shift+H / Ctrl+Shift+H | Distribute selected elements horizontally (3+ required) |
| Cmd+Shift+V / Ctrl+Shift+V | Distribute selected elements vertically (3+ required) |

### Mobile
- **Tap**: Select element
- **Drag**: Move selected element(s)
- **Double-tap on element**: Open HTML editor modal
- **Double-tap on empty canvas**: Open component picker
- **Clone Button**: Duplicate selected element(s)
- **Delete Button**: Remove selected element(s)
- **Help Button**: Toggle help text

## Alignment & Distribution

### Alignment
When 2+ elements are selected, an alignment toolbar appears with options:
- **Left**: Align all left edges to the leftmost element
- **Center**: Align all centers horizontally
- **Right**: Align all right edges to the rightmost element
- **Top**: Align all top edges to the topmost element
- **Middle**: Align all centers vertically
- **Bottom**: Align all bottom edges to the bottommost element

### Distribution
When 3+ elements are selected:
- **Dist H**: Evenly space elements horizontally with equal gaps
- **Dist V**: Evenly space elements vertically with equal gaps

## Snapping Behavior

### Alignment Guides
During dragging, the canvas detects when element edges come within 8 pixels of other elements and displays visual guides:
- **Vertical guides** (blue dashed lines): Indicate edge alignment
- **Horizontal guides** (blue dashed lines): Indicate edge alignment

Elements automatically snap to:
- Other element edges (left, right, top, bottom)
- Fixed guides created with H/V keys
- Selection group edges during multi-element drag

### Snap Distance
- **Default snap distance**: 10 pixels for alignment
- **Alignment guide threshold**: 8 pixels

## File Structure

### index.html
The main HTML document that:
- Defines the page structure and styling
- Creates the `<snapping-canvas>` custom element
- Includes three sample draggable rectangles (`.rect` elements)
- Sets up responsive styles for mobile and desktop viewports
- Includes scripts for snapping-guides.js and snapping-canvas.js

### snapping-guides.js
HTML Custom Element class `SnappingGuides`:
- Manages visual guide lines on the canvas
- Implements snap logic for dragging and resizing
- Maintains lists of fixed horizontal and vertical guides
- Provides methods for showing/hiding temporary alignment guides
- Handles snapping calculations for smooth alignment behavior

### snapping-canvas.js
HTML Custom Element class `SnappingCanvas`:
- Manages the main interactive canvas
- Handles pointer events (drag, resize, multi-select)
- Implements marquee selection
- Manages element selection state
- Provides alignment and distribution algorithms
- Creates and manages UI toolbars (alignment toolbar, mobile toolbar)
- Handles keyboard shortcuts
- Manages element duplication and deletion

## Styling

### Default Colors
- **Primary color**: `#19f` (cyan blue)
- **Text color**: `#333` (dark gray)
- **Selection shadow**: `0 0 100px -20px #19f` (glowing effect)
- **Marquee selection**: Orange (`#ff6b35`) with light fill

### Responsive Design
- **Desktop** (≥769px): Full feature set with alignment toolbar
- **Tablet** (768px and below): Mobile toolbar with Clone/Delete buttons visible
- **Mobile** (<480px): Larger touch targets, simplified layout

## Usage Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Canvas Editor</title>
  <style>
    snapping-canvas {
      display: block;
      width: 100%;
      height: 100vh;
      background: #fff;
    }

    .rect {
      position: absolute;
      width: 120px;
      height: 80px;
      background: #fff;
      border: 2px solid #19f;
      cursor: move;
    }
  </style>
</head>
<body>
  <snapping-canvas>
    <div class="rect" style="left: 10px; top: 10px;">
      <div class="resize-handle"></div>
    </div>
  </snapping-canvas>

  <script src="snapping-guides.js"></script>
  <script src="snapping-canvas.js"></script>
</body>
</html>
```

## Implementation Details

### Multi-Drag Architecture
- Stores initial positions of all selected elements in `dragOffsets`
- Calculates delta from primary element movement
- Applies same delta to all selected elements for coordinated movement
- Maintains relative positions during group drag operations

### Performance Optimizations
- Early exit in snapping calculations when alignment is found
- Efficient Set-based lookups for selected rectangles during alignment checks
- Cached bounding client rectangles to avoid repeated measurements
- Optimized marquee selection with intersection detection

### Event Handling
- Uses `setPointerCapture` for reliable drag tracking outside canvas bounds
- Pointer events for touch and mouse compatibility
- Document-level event listeners for drag/resize to support full-viewport movement
- Prevents text selection during drag operations

### Mobile Responsiveness
- Viewport detection via `isMobileViewport()` helper
- Conditional UI rendering based on screen size
- Touch-friendly button sizing (minimum 48px on mobile)
- Gesture-friendly multi-select on touch devices

## Architecture

### Component System

The application uses a component-based architecture with HTML Custom Elements:

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              <snapping-canvas>                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  <snapping-guides> (guide lines manager)    │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │  .rect   │ │  .rect   │ │  .rect   │  ...       │    │
│  │  │ (Button) │ │(Text Box)│ │  (Card)  │            │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  .alignment-toolbar (multi-select toolbar)  │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  .mobile-toolbar (Clone/Delete on mobile)   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  .component-picker (double-tap on canvas)   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  .editor-modal-overlay (appended to body)           │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │  .editor-modal                                 │  │    │
│  │  │  ├── .editor-modal-header (title + close)     │  │    │
│  │  │  ├── .editor-modal-body                       │  │    │
│  │  │  │   ├── .editor-section (HTML textarea)      │  │    │
│  │  │  │   └── .editor-preview-container            │  │    │
│  │  │  │       ├── .editor-preview (live preview)   │  │    │
│  │  │  │       └── .editor-error (error messages)   │  │    │
│  │  │  └── .editor-modal-footer (Cancel/Save)       │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Templates

Pre-defined component templates in `componentTemplates` array:

| Component | Default Size | Description |
|-----------|--------------|-------------|
| Button    | 120×80px     | Styled button with `#19f` background |
| Text Box  | 180×100px    | Gray background text container |
| Card      | 200×140px    | White card with title, description, shadow |

All components have:
- `width: 100%; height: 100%` to fill their `.rect` container
- `pointer-events: none` so parent container handles drag events
- `box-sizing: border-box` for consistent sizing with padding

### Double-Tap Interactions

```
Double-tap detection flow:
┌─────────────────────────────────────────────────────────┐
│  pointerdown event                                       │
│  ├── Check time since lastTapTime (< 300ms)             │
│  ├── Check distance from lastTapX/Y (< 20px)            │
│  └── Check if same target (lastTapTarget)               │
│      ├── On empty canvas → showComponentPicker()        │
│      └── On .rect element → showEditorModal()           │
└─────────────────────────────────────────────────────────┘
```

### HTML Editor Modal

The editor modal provides real-time HTML editing:

```
User Flow:
1. Double-tap .rect element
2. Modal opens with current HTML in textarea
3. User edits HTML
4. Preview updates in real-time via updatePreview()
5. validateHTML() checks for parsing errors
6. Errors displayed in .editor-error div
7. Save → applyHTMLToRect() updates element
8. Cancel/Escape/Overlay click → hideEditorModal()
```

**Key Methods:**
- `showEditorModal(rect)`: Opens modal with rect's HTML content
- `hideEditorModal()`: Closes and cleans up modal
- `validateHTML(html)`: Parses HTML and returns error string or null
- `updatePreview(html, previewEl, errorEl)`: Updates preview and error state
- `applyHTMLToRect(html)`: Replaces rect content, preserves resize handle
- `escapeHTML(str)`: Safely escapes HTML for display in textarea

### State Management

Key state properties in `SnappingCanvas`:

| Property | Type | Description |
|----------|------|-------------|
| `selectedRects` | Array | Currently selected .rect elements |
| `dragging` | Element\|null | Element being dragged |
| `resizing` | Element\|null | Element being resized |
| `dragOffsets` | Array | Initial positions for multi-drag |
| `alignmentGuides` | Array | Active alignment guide elements |
| `lastTapTime` | Number | Timestamp for double-tap detection |
| `lastTapTarget` | Element\|null | Target element for double-tap |
| `editingRect` | Element\|null | Rect being edited in modal |
| `editorModal` | Element\|null | Active modal overlay element |
| `bordersVisible` | Boolean | Toggle for element borders/handles |
| `marqueeSelecting` | Boolean | Whether marquee selection is active |

### CSS Class Hierarchy

```
.rect                    - Draggable element container
├── (component HTML)     - Button/TextBox/Card with pointer-events:none
└── .resize-handle       - Bottom-right resize grip

.editor-modal-overlay    - Full-screen dark backdrop
└── .editor-modal        - White modal container
    ├── .editor-modal-header
    │   ├── .editor-modal-title
    │   └── .editor-modal-close
    ├── .editor-modal-body
    │   ├── .editor-section
    │   │   ├── .editor-section-label
    │   │   └── .editor-textarea
    │   └── .editor-preview-container
    │       ├── .editor-section-label
    │       ├── .editor-preview
    │       └── .editor-error
    └── .editor-modal-footer
        ├── .editor-btn.editor-btn-cancel
        └── .editor-btn.editor-btn-save

.component-picker        - Double-tap menu on empty canvas
└── .component-option    - Individual template buttons

.alignment-toolbar       - Multi-select alignment buttons
└── .align-btn           - Individual alignment button
    ├── .align-icon
    └── .align-label

.mobile-toolbar          - Mobile Clone/Delete buttons
└── .mobile-btn          - Individual mobile button
```

### Z-Index Layers

| Layer | Z-Index | Element |
|-------|---------|---------|
| Editor Modal | 20000 | `.editor-modal-overlay` |
| Component Picker | 10003 | `.component-picker` |
| Toolbars | 10002 | `.alignment-toolbar`, `.mobile-toolbar`, `.marqueeElement` |
| Alignment Guides | 10001 | Dynamic guide lines |
| Guide Lines | 999 | `.guide-line` |
| Dragging Element | 10 | `.rect` while dragging |
| Normal Elements | 1 | `.rect` at rest |