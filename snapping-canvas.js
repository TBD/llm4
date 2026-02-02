class SnappingCanvas extends HTMLElement {
  static STORAGE_KEY = 'snapping-canvas-state';

  constructor() {
    super();
    this.guides = null;
    this.dragging = null;
    this.resizing = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.startW = 0;
    this.startH = 0;
    this.startX = 0;
    this.startY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.otherRects = [];
    this.bordersVisible = true;
    this.selectedRects = [];
    this.marqueeSelecting = false;
    this.marqueeStartX = 0;
    this.marqueeStartY = 0;
    this.marqueeElement = null;
    this.dragOffsets = []; // Store relative positions for multi-drag
    this.alignmentGuides = []; // Store active alignment guides
    this.lastTapTime = 0;
    this.lastTapX = 0;
    this.lastTapY = 0;
    this.lastTapTarget = null;
    this.tapCount = 0; // Track consecutive taps for triple-tap detection
    this.editingRect = null;
    this.editorModal = null;
    this.previewMode = false;
    this.toolbarVisible = false;
    this.componentTemplates = [
      {
        name: 'Button',
        icon: '▢',
        html: '<button style="width: 100%; height: 100%; background: #19f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; pointer-events: none;">Click me</button>',
        width: 120,
        height: 50
      },
      {
        name: 'Text',
        icon: 'T',
        html: '<div style="width: 100%; height: 100%; box-sizing: border-box; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 14px; color: #333; pointer-events: none;">Text content here</div>',
        width: 180,
        height: 60
      },
      {
        name: 'Card',
        icon: '▭',
        html: '<div style="width: 100%; height: 100%; box-sizing: border-box; padding: 20px; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); pointer-events: none;"><h3 style="margin: 0 0 10px 0; font-size: 16px;">Card Title</h3><p style="margin: 0; font-size: 13px; color: #666;">Card content goes here</p></div>',
        width: 200,
        height: 140
      },
      {
        name: 'Input',
        icon: '⎕',
        html: '<input type="text" placeholder="Enter text..." style="width: 100%; height: 100%; box-sizing: border-box; padding: 10px 15px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; outline: none; pointer-events: none;">',
        width: 200,
        height: 44
      },
      {
        name: 'Image',
        icon: '🖼',
        html: '<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #e0e0e0 25%, #f5f5f5 25%, #f5f5f5 50%, #e0e0e0 50%, #e0e0e0 75%, #f5f5f5 75%); background-size: 20px 20px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px; border-radius: 4px; pointer-events: none;">Image</div>',
        width: 150,
        height: 100
      },
      {
        name: 'Icon Button',
        icon: '●',
        html: '<button style="width: 100%; height: 100%; background: #333; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; pointer-events: none;">+</button>',
        width: 50,
        height: 50
      }
    ];
  }

  // Helper method to check if we're on a mobile-sized viewport
  isMobileViewport() {
    return window.innerWidth < 768;
  }

  connectedCallback() {
    // Create guides
    this.guides = document.createElement('snapping-guides');
    this.appendChild(this.guides);

    // Create and append styles for alignment toolbar and component picker
    const style = document.createElement('style');
    style.textContent = `
      /* Top drag zone for revealing toolbar */
      .top-drag-zone {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 20px;
        z-index: 10005;
        cursor: ns-resize;
      }

      .top-drag-zone::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .top-drag-zone:hover::after,
      .top-drag-zone.dragging::after {
        opacity: 1;
      }

      /* Quick Elements Toolbar */
      .quick-elements-toolbar {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        display: flex;
        gap: 8px;
        padding: 10px 14px;
        padding-bottom: 14px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10004;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        touch-action: manipulation;
        transition: transform 0.3s ease;
      }

      .quick-elements-toolbar.visible {
        transform: translateX(-50%) translateY(0);
      }

      .quick-elements-toolbar .drag-handle {
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
        cursor: ns-resize;
      }

      .quick-element-btn {
        width: 44px;
        height: 44px;
        border: 1px solid #e0e0e0;
        background: #fff;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: #333;
        transition: all 0.15s ease;
        padding: 4px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
      }

      .quick-element-btn:hover {
        background: #f0f7ff;
        border-color: #19f;
        transform: translateY(-2px);
      }

      .quick-element-btn:active {
        transform: scale(0.95);
        background: #e0f0ff;
      }

      .quick-element-btn .icon {
        font-size: 18px;
        line-height: 1;
      }

      .quick-element-btn .label {
        font-size: 8px;
        margin-top: 2px;
        color: #666;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .quick-elements-toolbar {
          padding: 8px 10px;
          padding-bottom: 12px;
          gap: 6px;
          border-radius: 0 0 10px 10px;
        }

        .quick-element-btn {
          width: 48px;
          height: 48px;
          border-radius: 10px;
        }

        .quick-element-btn .icon {
          font-size: 20px;
        }

        .quick-element-btn .label {
          font-size: 9px;
        }
      }

      @media (max-width: 480px) {
        .quick-elements-toolbar {
          padding: 6px 8px;
          padding-bottom: 10px;
          gap: 4px;
        }

        .quick-element-btn {
          width: 44px;
          height: 44px;
        }
      }

      /* Floating alignment trigger button */
      .alignment-trigger {
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        transition: background-color 0.2s, transform 0.2s;
        font-size: 14px;
        color: #333;
      }

      .alignment-trigger:hover {
        background: #19f;
        color: white;
        transform: scale(1.1);
      }

      .alignment-trigger:active {
        transform: scale(0.95);
      }

      .alignment-trigger.active {
        background: #19f;
        color: white;
      }

      /* Alignment dropdown menu */
      .alignment-dropdown {
        position: absolute;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 8px;
        display: none;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 10003;
        min-width: 140px;
      }

      .alignment-dropdown.visible {
        display: flex;
      }

      .align-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .align-group-label {
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 8px 2px;
        user-select: none;
      }

      .align-group-buttons {
        display: flex;
        gap: 2px;
      }

      .align-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border: none;
        background: none;
        border-radius: 4px;
        cursor: pointer;
        color: #333;
        transition: background-color 0.2s;
        min-width: 36px;
        min-height: 36px;
        font-size: 14px;
      }

      .align-btn:hover {
        background: rgba(25, 159, 255, 0.15);
        color: #19f;
      }

      .align-btn:active {
        background: rgba(25, 159, 255, 0.25);
      }

      .align-btn[title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        margin-bottom: 4px;
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .alignment-trigger {
          width: 40px;
          height: 40px;
          font-size: 18px;
        }

        .alignment-dropdown {
          min-width: 160px;
        }

        .align-btn {
          min-width: 44px;
          min-height: 44px;
          font-size: 16px;
        }
      }

      /* HTML Editor Modal */
      .editor-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }

      .editor-modal {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 800px;
        height: 90vh;
        max-height: 700px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }

      .editor-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f8f8;
      }

      .editor-modal-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }

      .editor-modal-close {
        width: 36px;
        height: 36px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .editor-modal-close:hover {
        background: #e0e0e0;
        color: #333;
      }

      .editor-modal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .editor-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .editor-section:last-child {
        border-bottom: none;
      }

      .editor-section-label {
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        color: #666;
        background: #f5f5f5;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .editor-textarea {
        flex: 1;
        width: 100%;
        border: none;
        padding: 16px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
        resize: none;
        outline: none;
        box-sizing: border-box;
      }

      .editor-textarea:focus {
        background: #fafafa;
      }

      .editor-preview-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      .editor-preview {
        flex: 1;
        padding: 16px;
        overflow: auto;
        background: #fff;
        border: 2px dashed #e0e0e0;
        margin: 0 16px 16px 16px;
        border-radius: 8px;
      }

      .editor-error {
        padding: 12px 16px;
        background: #fee;
        color: #c00;
        font-size: 13px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        border-top: 1px solid #fcc;
        display: none;
      }

      .editor-error.visible {
        display: block;
      }

      .editor-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #e0e0e0;
        background: #f8f8f8;
      }

      .editor-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        min-height: 44px;
      }

      .editor-btn-cancel {
        background: white;
        border: 1px solid #ddd;
        color: #333;
      }

      .editor-btn-cancel:hover {
        background: #f5f5f5;
      }

      .editor-btn-save {
        background: #19f;
        border: none;
        color: white;
      }

      .editor-btn-save:hover {
        background: #007acc;
      }

      @media (max-width: 768px) {
        .editor-modal-overlay {
          padding: 0;
        }

        .editor-modal {
          height: 100%;
          max-height: none;
          border-radius: 0;
        }

        .editor-textarea {
          font-size: 16px; /* Prevent zoom on iOS */
        }
      }
    `;
    this.appendChild(style);

    // Create top drag zone for revealing toolbar
    this.topDragZone = document.createElement('div');
    this.topDragZone.className = 'top-drag-zone';
    document.body.appendChild(this.topDragZone);

    // Create quick elements toolbar (slides down from top)
    this.quickElementsToolbar = document.createElement('div');
    this.quickElementsToolbar.className = 'quick-elements-toolbar';
    this.componentTemplates.forEach((template, index) => {
      const btn = document.createElement('button');
      btn.className = 'quick-element-btn';
      btn.title = template.name;
      btn.innerHTML = `
        <span class="icon">${template.icon || '▢'}</span>
        <span class="label">${template.name}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.addComponentAtCenter(index);
        this.hideQuickToolbar();
      });
      // Prevent double-tap zoom on iOS
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.addComponentAtCenter(index);
        this.hideQuickToolbar();
      }, { passive: false });
      this.quickElementsToolbar.appendChild(btn);
    });

    // Add drag handle to toolbar
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    this.quickElementsToolbar.appendChild(dragHandle);

    document.body.appendChild(this.quickElementsToolbar);

    // Setup drag-from-top interaction
    this.setupTopDragInteraction();

    // Create floating alignment trigger button
    this.alignmentTrigger = document.createElement('button');
    this.alignmentTrigger.className = 'alignment-trigger';
    this.alignmentTrigger.innerHTML = '⊞'; // Grid/align icon
    this.alignmentTrigger.title = 'Alignment options';
    this.appendChild(this.alignmentTrigger);

    // Create alignment dropdown menu
    this.alignmentDropdown = document.createElement('div');
    this.alignmentDropdown.className = 'alignment-dropdown';
    this.alignmentDropdown.innerHTML = `
      <div class="align-group align-group-horizontal">
        <div class="align-group-label">Horizontal</div>
        <div class="align-group-buttons">
          <button class="align-btn" data-action="align-left" title="Align Left">←</button>
          <button class="align-btn" data-action="align-center" title="Align Center">↔</button>
          <button class="align-btn" data-action="align-right" title="Align Right">→</button>
        </div>
      </div>
      <div class="align-group align-group-vertical">
        <div class="align-group-label">Vertical</div>
        <div class="align-group-buttons">
          <button class="align-btn" data-action="align-top" title="Align Top">↑</button>
          <button class="align-btn" data-action="align-middle" title="Align Middle">↕</button>
          <button class="align-btn" data-action="align-bottom" title="Align Bottom">↓</button>
        </div>
      </div>
      <div class="align-group align-group-distribute">
        <div class="align-group-label">Distribute</div>
        <div class="align-group-buttons">
          <button class="align-btn" data-action="distribute-h" title="Distribute Horizontally">⇄</button>
          <button class="align-btn" data-action="distribute-v" title="Distribute Vertically">⇅</button>
        </div>
      </div>
      <div class="align-group align-group-actions">
        <div class="align-group-label">Actions</div>
        <div class="align-group-buttons">
          <button class="align-btn" data-action="clone" title="Clone">⧉</button>
          <button class="align-btn" data-action="delete" title="Delete">✕</button>
          <button class="align-btn" data-action="preview" title="Preview">👁</button>
        </div>
      </div>
    `;
    this.appendChild(this.alignmentDropdown);

    // For backwards compatibility, keep toolbar reference pointing to trigger
    this.toolbar = this.alignmentTrigger;



    // Prevent iOS double-tap zoom on the entire canvas
    this.addEventListener('touchstart', (e) => {
      // Allow default for input elements
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // Prevent double-tap zoom by using passive: false
    }, { passive: true });

    // Prevent double-tap zoom more aggressively on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Only prevent if not on input elements
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Attach events
    this.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Alignment trigger button click handler
    this.alignmentTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleAlignmentDropdown();
    });

    // Dropdown button events
    this.alignmentDropdown.addEventListener('click', this.handleToolbarClick.bind(this));

    // Close dropdown when clicking outside
    document.addEventListener('pointerdown', (e) => {
      if (!this.alignmentDropdown.contains(e.target) &&
          !this.alignmentTrigger.contains(e.target) &&
          this.alignmentDropdown.classList.contains('visible')) {
        this.hideAlignmentDropdown();
      }
    });

    // Initialize toolbar visibility
    this.updateToolbarVisibility();

    // Load saved state from localStorage
    this.loadFromLocalStorage();
  }

  handlePointerDown(e) {
    // Only handle primary pointer (left mouse or touch)
    if (e.button !== 0) return;

    // Ignore clicks on UI elements
    if (this.alignmentTrigger && this.alignmentTrigger.contains(e.target)) return;
    if (this.alignmentDropdown && this.alignmentDropdown.contains(e.target)) return;
    if (this.quickElementsToolbar && this.quickElementsToolbar.contains(e.target)) return;
    if (this.topDragZone && this.topDragZone.contains(e.target)) return;

    // In preview mode, check for triple tap to exit
    if (this.previewMode) {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastTapTime;
      const distX = Math.abs(e.clientX - this.lastTapX);
      const distY = Math.abs(e.clientY - this.lastTapY);

      if (timeDiff < 300 && distX < 30 && distY < 30) {
        this.tapCount++;
        if (this.tapCount >= 2) { // Third tap (started at 0, now 2 means 3 taps)
          e.preventDefault();
          this.tapCount = 0;
          this.togglePreviewMode();
          return;
        }
      } else {
        this.tapCount = 0;
      }

      this.lastTapTime = currentTime;
      this.lastTapX = e.clientX;
      this.lastTapY = e.clientY;
      return;
    }

    // Capture the pointer for dragging outside bounds
    this.setPointerCapture(e.pointerId);


    if (e.target.classList.contains('resize-handle')) {
      // Resizing
      const rect = e.target.parentElement;
      this.resizing = rect;
      this.startX = e.pageX;
      this.startY = e.pageY;
      this.startW = rect.offsetWidth;
      this.startH = rect.offsetHeight;
      this.updateOtherRects();
    } else if (e.target.classList.contains('rect')) {
      // Check for double tap on rect element
      const rect = e.target;
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastTapTime;
      const distX = Math.abs(e.clientX - this.lastTapX);
      const distY = Math.abs(e.clientY - this.lastTapY);

      if (timeDiff < 300 && distX < 20 && distY < 20 && this.lastTapTarget === rect) {
        // Double tap on rect detected - open editor
        e.preventDefault();
        this.showEditorModal(rect);
        this.lastTapTime = 0;
        this.lastTapTarget = null;
        return;
      }

      this.lastTapTime = currentTime;
      this.lastTapX = e.clientX;
      this.lastTapY = e.clientY;
      this.lastTapTarget = rect;

      // Dragging or selecting
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        // Multi-select: toggle selection
        if (this.selectedRects.includes(rect)) {
          this.deselectRect(rect);
        } else {
          this.selectRect(rect);
        }
      } else {
        // Check for Alt+drag duplication
        if (e.altKey) {
          if (this.selectedRects.length > 0) {
            // Duplicate the selection
            this.duplicateSelection();
            this.dragging = this.selectedRects[0];
          } else {
            // Duplicate the clicked rect
            const duplicate = this.duplicateRect(rect);
            this.deselectAll();
            this.selectRect(duplicate);
            this.dragging = duplicate;
            // Keep at original position, no mouse repositioning
          }
        } else {
          // Single select or start dragging
          if (!this.selectedRects.includes(rect)) {
            this.deselectAll();
            this.selectRect(rect);
          }
          // Start dragging all selected rectangles
          this.dragging = rect;
        }
        const canvasBounds = this.getBoundingClientRect();
        const rectBounds = this.dragging.getBoundingClientRect();
        this.offsetX = e.clientX - (rectBounds.left - canvasBounds.left);
        this.offsetY = e.clientY - (rectBounds.top - canvasBounds.top);

        // Clear any existing guides before starting multi-drag
        this.guides.hide();
        this.clearAlignmentGuides();

        // Store initial positions for all selected rectangles
        this.dragOffsets = this.selectedRects.map(selectedRect => {
          const bounds = selectedRect.getBoundingClientRect();
          return {
            rect: selectedRect,
            initialLeft: bounds.left - canvasBounds.left,
            initialTop: bounds.top - canvasBounds.top
          };
        });

        // Bring all selected to front
        this.selectedRects.forEach(selectedRect => {
          selectedRect.style.zIndex = 10;
        });

        this.updateOtherRects();
      }
    } else if (this.isEmptyClick(e.target)) {
      // Empty click: start marquee selection or deselect
      this.deselectAll();
      this.marqueeSelecting = true;
      this.marqueeStartX = e.offsetX;
      this.marqueeStartY = e.offsetY;
      this.createMarqueeElement();
    }
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }

  handlePointerMove(e) {

    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.marqueeSelecting) {
      this.updateMarquee(e.offsetX, e.offsetY);
    } else if (this.dragging) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);

      // Hide alignment dropdown while dragging
      this.hideAlignmentDropdown();

      // Cache frequently accessed values
      const canvasBounds = this.getBoundingClientRect();
      let newLeft = e.clientX - this.offsetX;
      let newTop = e.clientY - this.offsetY;

      if (this.selectedRects.length > 1 && this.dragOffsets.length > 0) {
        // Multi-drag
        // Calculate initial bounding box from stored dragOffsets (not current positions)
        let initMinX = Infinity, initMinY = Infinity, initMaxX = -Infinity, initMaxY = -Infinity;
        this.dragOffsets.forEach(offset => {
          const right = offset.initialLeft + offset.rect.offsetWidth;
          const bottom = offset.initialTop + offset.rect.offsetHeight;
          initMinX = Math.min(initMinX, offset.initialLeft);
          initMinY = Math.min(initMinY, offset.initialTop);
          initMaxX = Math.max(initMaxX, right);
          initMaxY = Math.max(initMaxY, bottom);
        });
        const groupWidth = initMaxX - initMinX;
        const groupHeight = initMaxY - initMinY;

        // Calculate the delta from the primary rect's initial position
        const primaryOffset = this.dragOffsets.find(offset => offset.rect === this.dragging);
        if (!primaryOffset) return;
        const deltaX = newLeft - primaryOffset.initialLeft;
        const deltaY = newTop - primaryOffset.initialTop;

        // Calculate the group bounding box's new position
        let groupLeft = initMinX + deltaX;
        let groupTop = initMinY + deltaY;

        // First apply existing snapping guides using the group's bounding box
        const snapResult = this.guides.snapDrag(groupLeft, groupTop, groupWidth, groupHeight, this.otherRects);
        groupLeft = snapResult.left;
        groupTop = snapResult.top;

        // Then check for alignment guides and potentially snap using group's bounding box
        const alignmentResult = this.checkAlignmentGuides(this.dragging, groupLeft, groupTop, groupWidth, groupHeight);
        if (alignmentResult.aligned) {
          groupLeft = alignmentResult.left;
          groupTop = alignmentResult.top;
        }

        // Calculate final delta based on group's snapped position vs initial position
        const finalDeltaX = groupLeft - initMinX;
        const finalDeltaY = groupTop - initMinY;

        // Apply final delta to all rectangles
        this.dragOffsets.forEach(otherOffset => {
          otherOffset.rect.style.left = (otherOffset.initialLeft + finalDeltaX) + 'px';
          otherOffset.rect.style.top = (otherOffset.initialTop + finalDeltaY) + 'px';
        });

        // Update trigger position while dragging
        this.positionAlignmentTrigger();
      } else {
        // Single drag
        // First apply existing snapping guides
        const snapResult = this.guides.snapDrag(newLeft, newTop, this.dragging.offsetWidth, this.dragging.offsetHeight, this.otherRects);
        newLeft = snapResult.left;
        newTop = snapResult.top;

        // Then check for alignment guides and potentially snap
        const alignmentResult = this.checkAlignmentGuides(this.dragging, newLeft, newTop);
        if (alignmentResult.aligned) {
          newLeft = alignmentResult.left;
          newTop = alignmentResult.top;
        }

        this.dragging.style.left = newLeft + 'px';
        this.dragging.style.top = newTop + 'px';

        // Update trigger position while dragging (single selection)
        this.positionAlignmentTrigger();
      }

      this.showGuides();
    } else if (this.resizing) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);
      let newW = Math.max(50, this.startW + (e.pageX - this.startX));
      let newH = Math.max(50, this.startH + (e.pageY - this.startY));
      const rectPos = this.resizing.getBoundingClientRect();
      const canvasRect = this.getBoundingClientRect();
      const result = this.guides.snapResize({left: rectPos.left - canvasRect.left, top: rectPos.top - canvasRect.top}, newW, newH, this.otherRects);
      newW = result.newW;
      newH = result.newH;
      this.showGuides();
      this.resizing.style.width = newW + 'px';
      this.resizing.style.height = newH + 'px';
    }
  }

  handlePointerUp() {
    const wasDragging = this.dragging;
    const wasResizing = this.resizing;

    if (this.marqueeSelecting) {
      this.marqueeSelecting = false;
      this.removeMarquee();
    }
    if (this.dragging) {
      // Reset z-index for all selected rectangles
      this.selectedRects.forEach(rect => {
        rect.style.zIndex = 1;
      });
    }
    this.clearGuides();
    this.clearAlignmentGuides();
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    this.dragging = null;
    this.resizing = null;
    this.dragOffsets = [];

    // Save after drag or resize completes
    if (wasDragging || wasResizing) {
      this.saveToLocalStorage();
    }
  }

  handleKeyDown(e) {
    // Don't handle shortcuts when typing in input fields or when editor modal is open
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    if (isTyping || this.editorModal) return;

    // Calculate current mouse position relative to canvas
    const canvasBounds = this.getBoundingClientRect();
    const mouseX = e.clientX - canvasBounds.left;
    const mouseY = e.clientY - canvasBounds.top;

    if ((e.key === 'a' || e.key === 'A') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.selectAll();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
      // Distribution (Ctrl/Cmd + Shift + H/V)
      if (this.selectedRects.length < 3) return;
      switch (e.key.toLowerCase()) {
        case 'h':
          e.preventDefault();
          this.distributeSelectionHorizontally();
          break;
        case 'v':
          e.preventDefault();
          this.distributeSelectionVertically();
          break;
      }
    } else if (e.key === 'h' || e.key === 'H') {
      this.guides.addHorizontalGuide(mouseY);
      this.saveToLocalStorage();
    } else if (e.key === 'v' || e.key === 'V') {
      this.guides.addVerticalGuide(mouseX);
      this.saveToLocalStorage();
    } else if (e.key === 'r' || e.key === 'R') {
      this.guides.removeAllFixedGuides();
      this.saveToLocalStorage();
    } else if (e.key === 'b' || e.key === 'B') {
      this.bordersVisible = !this.bordersVisible;
      const borderStyle = this.bordersVisible ? '2px solid #19f' : 'none';
      const handleDisplay = this.bordersVisible ? 'block' : 'none';
      this.querySelectorAll('.rect').forEach(rect => {
        rect.style.border = borderStyle;
        const handle = rect.querySelector('.resize-handle');
        if (handle) handle.style.display = handleDisplay;
      });
      this.updateSelectionVisuals(); // Update selection visuals too
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      this.eraseSelection();
    } else if (e.key === 'p' || e.key === 'P') {
      this.togglePreviewMode();
    }
  }

  updateOtherRects() {
    const current = this.dragging || this.resizing;
    // Always exclude all selected rectangles from snapping (selected rects should behave like new rects)
    const excludeRects = this.selectedRects.length > 0 ? this.selectedRects : [current];
    const excludeSet = new Set(excludeRects);
    
    // Optimize: Use a more efficient filtering approach with Set lookup
    this.otherRects = [];
    const allRects = this.querySelectorAll('.rect');
    for (let i = 0; i < allRects.length; i++) {
      const r = allRects[i];
      if (!excludeSet.has(r)) {
        this.otherRects.push({
          left: parseFloat(r.style.left),
          top: parseFloat(r.style.top),
          width: r.offsetWidth,
          height: r.offsetHeight
        });
      }
    }
  }

  showGuides() {
    if (this.guides.getGuideX() !== null) {
      this.guides.showVertical(this.guides.getGuideX());
    } else {
      this.guides.hideVertical();
    }
    if (this.guides.getGuideY() !== null) {
      this.guides.showHorizontal(this.guides.getGuideY());
    } else {
      this.guides.hideHorizontal();
    }
  }

  clearGuides() {
    this.guides.setGuideX(null);
    this.guides.setGuideY(null);
    this.guides.hide();
  }

  selectRect(rect) {
    if (!this.selectedRects.includes(rect)) {
      this.selectedRects.push(rect);
      this.updateSelectionVisuals();
      this.updateToolbarVisibility();
    }
  }

  deselectRect(rect) {
    const index = this.selectedRects.indexOf(rect);
    if (index > -1) {
      this.selectedRects.splice(index, 1);
      this.updateSelectionVisuals();
      this.updateToolbarVisibility();
    }
  }

  selectAll() {
    this.selectedRects = Array.from(this.querySelectorAll('.rect'));
    this.updateSelectionVisuals();
    this.updateToolbarVisibility();
  }

  deselectAll() {
    this.selectedRects = [];
    this.updateSelectionVisuals();
    this.updateToolbarVisibility();
  }

  togglePreviewMode() {
    this.previewMode = !this.previewMode;

    // Update preview button icon in dropdown
    const previewBtn = this.alignmentDropdown?.querySelector('[data-action="preview"]');
    if (previewBtn) {
      previewBtn.innerHTML = this.previewMode ? '✎' : '👁';
      previewBtn.title = this.previewMode ? 'Editor' : 'Preview';
    }

    if (this.previewMode) {
      // Enter preview mode
      // Deselect all
      this.deselectAll();

      // Hide all editing UI
      if (this.alignmentTrigger) this.alignmentTrigger.style.display = 'none';
      if (this.quickElementsToolbar) this.quickElementsToolbar.style.display = 'none';
      this.hideAlignmentDropdown();
      this.guides.style.display = 'none';

      // Update rects for preview mode
      this.querySelectorAll('.rect').forEach(rect => {
        rect.style.border = 'none';
        rect.style.cursor = 'default';
        rect.style.boxShadow = 'none';
        const handle = rect.querySelector('.resize-handle');
        if (handle) handle.style.display = 'none';

        // Enable pointer events on inner content
        Array.from(rect.children).forEach(child => {
          if (!child.classList.contains('resize-handle')) {
            child.style.pointerEvents = 'auto';
          }
        });
      });
    } else {
      // Exit preview mode
      // Show guides
      this.guides.style.display = '';

      // Show quick elements toolbar
      if (this.quickElementsToolbar) this.quickElementsToolbar.style.display = 'flex';

      // Update rects for editor mode
      this.querySelectorAll('.rect').forEach(rect => {
        rect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';
        rect.style.cursor = 'move';
        const handle = rect.querySelector('.resize-handle');
        if (handle) handle.style.display = this.bordersVisible ? 'block' : 'none';

        // Disable pointer events on inner content
        Array.from(rect.children).forEach(child => {
          if (!child.classList.contains('resize-handle')) {
            child.style.pointerEvents = 'none';
          }
        });
      });

      // Restore toolbar visibility
      this.updateToolbarVisibility();
    }
  }

  updateToolbarVisibility() {
    // Show toolbar whenever there's at least 1 selection (for clone/delete)
    const showToolbar = this.selectedRects.length > 0;
    const showAlignmentOptions = this.selectedRects.length > 1;
    const showDistributeOptions = this.selectedRects.length >= 3;

    if (this.alignmentTrigger) {
      if (showToolbar) {
        this.alignmentTrigger.style.display = 'flex';
        this.positionAlignmentTrigger();
      } else {
        this.alignmentTrigger.style.display = 'none';
        this.hideAlignmentDropdown();
      }
    }

    // Update visibility of alignment/distribute groups based on selection count
    if (this.alignmentDropdown) {
      const horizontalGroup = this.alignmentDropdown.querySelector('.align-group-horizontal');
      const verticalGroup = this.alignmentDropdown.querySelector('.align-group-vertical');
      const distributeGroup = this.alignmentDropdown.querySelector('.align-group-distribute');

      if (horizontalGroup) horizontalGroup.style.display = showAlignmentOptions ? '' : 'none';
      if (verticalGroup) verticalGroup.style.display = showAlignmentOptions ? '' : 'none';
      if (distributeGroup) distributeGroup.style.display = showDistributeOptions ? '' : 'none';
    }
  }

  positionAlignmentTrigger() {
    if (!this.alignmentTrigger || this.selectedRects.length === 0) return;

    const bounds = this.getSelectionBounds();
    if (!bounds) return;

    const canvasBounds = this.getBoundingClientRect();
    const triggerSize = this.isMobileViewport() ? 40 : 32;
    const offset = 8; // Distance from selection bounds

    // Position at top-right of selection bounds
    let left = bounds.maxX + offset;
    let top = bounds.minY - triggerSize / 2;

    // Keep within viewport bounds
    const maxLeft = canvasBounds.width - triggerSize - 10;
    const maxTop = canvasBounds.height - triggerSize - 10;

    // If trigger would go off right edge, position at top-left instead
    if (left > maxLeft) {
      left = bounds.minX - triggerSize - offset;
      // If still off-screen, position inside the selection
      if (left < 10) {
        left = Math.min(bounds.maxX - triggerSize - offset, maxLeft);
      }
    }

    // Clamp vertical position
    top = Math.max(10, Math.min(top, maxTop));

    this.alignmentTrigger.style.left = left + 'px';
    this.alignmentTrigger.style.top = top + 'px';
  }

  toggleAlignmentDropdown() {
    if (this.alignmentDropdown.classList.contains('visible')) {
      this.hideAlignmentDropdown();
    } else {
      this.showAlignmentDropdown();
    }
  }

  showAlignmentDropdown() {
    if (!this.alignmentDropdown || !this.alignmentTrigger) return;

    this.alignmentDropdown.classList.add('visible');
    this.alignmentTrigger.classList.add('active');

    // Position dropdown below the trigger
    const triggerRect = this.alignmentTrigger.getBoundingClientRect();
    const canvasRect = this.getBoundingClientRect();
    const dropdownWidth = 160; // Approximate width
    const dropdownHeight = 180; // Approximate height

    let left = parseFloat(this.alignmentTrigger.style.left);
    let top = parseFloat(this.alignmentTrigger.style.top) + (this.isMobileViewport() ? 48 : 40);

    // Keep dropdown within viewport
    if (left + dropdownWidth > canvasRect.width - 10) {
      left = canvasRect.width - dropdownWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }
    if (top + dropdownHeight > canvasRect.height - 10) {
      // Position above the trigger instead
      top = parseFloat(this.alignmentTrigger.style.top) - dropdownHeight - 8;
    }

    this.alignmentDropdown.style.left = left + 'px';
    this.alignmentDropdown.style.top = top + 'px';
  }

  hideAlignmentDropdown() {
    if (this.alignmentDropdown) {
      this.alignmentDropdown.classList.remove('visible');
    }
    if (this.alignmentTrigger) {
      this.alignmentTrigger.classList.remove('active');
    }
  }

  updateSelectionVisuals() {
    const shadow = this.isMobileViewport() ? '0 0 20px -5px #19f' : '0 0 100px -20px #19f';
    // Update all rects
    this.querySelectorAll('.rect').forEach(rect => {
      if (this.selectedRects.includes(rect)) {
        rect.style.boxShadow = shadow;
      } else {
        rect.style.boxShadow = 'none';
      }
    });
  }

  isEmptyClick(target) {
    return target === this || target === this.guides || target.classList.contains('fixed-guide');
  }

  createMarqueeElement() {
    this.marqueeElement = document.createElement('div');
    Object.assign(this.marqueeElement.style, {
      position: 'absolute',
      border: '2px dashed #ff6b35',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      pointerEvents: 'none',
      zIndex: '10002'
    });
    this.appendChild(this.marqueeElement);
  }

  updateMarquee(x, y) {
    if (!this.marqueeElement) return;

    const startX = Math.min(this.marqueeStartX, x);
    const startY = Math.min(this.marqueeStartY, y);
    const width = Math.abs(x - this.marqueeStartX);
    const height = Math.abs(y - this.marqueeStartY);

    Object.assign(this.marqueeElement.style, {
      left: startX + 'px',
      top: startY + 'px',
      width: width + 'px',
      height: height + 'px'
    });

    // Select rectangles that intersect with marquee
    const canvasBounds = this.getBoundingClientRect();
    const marqueeRect = {
      left: canvasBounds.left + startX,
      top: canvasBounds.top + startY,
      right: canvasBounds.left + startX + width,
      bottom: canvasBounds.top + startY + height
    };

    this.selectedRects = [];
    this.querySelectorAll('.rect').forEach(rect => {
      const rectBounds = rect.getBoundingClientRect();
      if (this.rectsIntersect(marqueeRect, {
        left: rectBounds.left,
        top: rectBounds.top,
        right: rectBounds.right,
        bottom: rectBounds.bottom
      })) {
        this.selectedRects.push(rect);
      }
    });
    this.updateSelectionVisuals();
    this.updateToolbarVisibility();
  }

  rectsIntersect(r1, r2) {
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
  }

  removeMarquee() {
    if (this.marqueeElement) {
      this.marqueeElement.remove();
      this.marqueeElement = null;
    }
  }

  // Alignment Guide Methods
  createAlignmentGuide(type, position) {
    const guide = document.createElement('div');
    guide.className = 'guide-line';
    guide.style.zIndex = '10001';

    if (type === 'vertical') {
      guide.classList.add('guide-vertical');
      guide.style.left = position + 'px';
    } else if (type === 'horizontal') {
      guide.classList.add('guide-horizontal');
      guide.style.top = position + 'px';
    }

    this.appendChild(guide);
    this.alignmentGuides.push(guide);
    return guide;
  }

  clearAlignmentGuides() {
    this.alignmentGuides.forEach(guide => guide.remove());
    this.alignmentGuides = [];
  }

  checkAlignmentGuides(draggedRect, newLeft, newTop, width, height) {
    this.clearAlignmentGuides();

    // Use provided width/height for group snapping, or fall back to rect's dimensions
    const actualWidth = width !== undefined ? width : draggedRect.offsetWidth;
    const actualHeight = height !== undefined ? height : draggedRect.offsetHeight;

    const draggedBounds = {
      left: newLeft,
      top: newTop,
      right: newLeft + actualWidth,
      bottom: newTop + actualHeight
    };

    const alignmentThreshold = 8; // pixels
    let snappedLeft = newLeft;
    let snappedTop = newTop;
    let foundAlignment = false;

    // Cache the rectangles query and selected rects set for faster lookup
    const allRects = this.querySelectorAll('.rect');
    const selectedSet = new Set(this.selectedRects);

    // Check against all other rectangles (exclude all selected rectangles since they're moving together)
    for (let i = 0; i < allRects.length; i++) {
      const otherRect = allRects[i];
      if (selectedSet.has(otherRect)) continue;

      const otherBounds = {
        left: parseFloat(otherRect.style.left),
        top: parseFloat(otherRect.style.top),
        right: parseFloat(otherRect.style.left) + otherRect.offsetWidth,
        bottom: parseFloat(otherRect.style.top) + otherRect.offsetHeight
      };

      // Check vertical alignments (left/right edges)
      // Dragged right edge to other left edge
      if (Math.abs(draggedBounds.right - otherBounds.left) <= alignmentThreshold) {
        this.createAlignmentGuide('vertical', otherBounds.left);
        snappedLeft = otherBounds.left - actualWidth;
        foundAlignment = true;
      }
      // Dragged left edge to other right edge
      else if (Math.abs(draggedBounds.left - otherBounds.right) <= alignmentThreshold) {
        this.createAlignmentGuide('vertical', otherBounds.right);
        snappedLeft = otherBounds.right;
        foundAlignment = true;
      }
      // Dragged left edge to other left edge
      else if (Math.abs(draggedBounds.left - otherBounds.left) <= alignmentThreshold) {
        this.createAlignmentGuide('vertical', otherBounds.left);
        snappedLeft = otherBounds.left;
        foundAlignment = true;
      }
      // Dragged right edge to other right edge
      else if (Math.abs(draggedBounds.right - otherBounds.right) <= alignmentThreshold) {
        this.createAlignmentGuide('vertical', otherBounds.right);
        snappedLeft = otherBounds.right - actualWidth;
        foundAlignment = true;
      }

      // Check horizontal alignments (top/bottom edges)
      // Dragged bottom edge to other top edge
      if (Math.abs(draggedBounds.bottom - otherBounds.top) <= alignmentThreshold) {
        this.createAlignmentGuide('horizontal', otherBounds.top);
        snappedTop = otherBounds.top - actualHeight;
        foundAlignment = true;
      }
      // Dragged top edge to other bottom edge
      else if (Math.abs(draggedBounds.top - otherBounds.bottom) <= alignmentThreshold) {
        this.createAlignmentGuide('horizontal', otherBounds.bottom);
        snappedTop = otherBounds.bottom;
        foundAlignment = true;
      }
      // Dragged top edge to other top edge
      else if (Math.abs(draggedBounds.top - otherBounds.top) <= alignmentThreshold) {
        this.createAlignmentGuide('horizontal', otherBounds.top);
        snappedTop = otherBounds.top;
        foundAlignment = true;
      }
      // Dragged bottom edge to other bottom edge
      else if (Math.abs(draggedBounds.bottom - otherBounds.bottom) <= alignmentThreshold) {
        this.createAlignmentGuide('horizontal', otherBounds.bottom);
        snappedTop = otherBounds.bottom - actualHeight;
        foundAlignment = true;
      }
    }

    // Return the snapped position if alignment was found
    if (foundAlignment) {
      return { left: snappedLeft, top: snappedTop, aligned: true };
    }

    return { left: newLeft, top: newTop, aligned: false };
  }

  // Alignment and Distribution Methods
  getSelectionBounds() {
    if (this.selectedRects.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    this.selectedRects.forEach(rect => {
      const left = parseFloat(rect.style.left);
      const top = parseFloat(rect.style.top);
      const right = left + rect.offsetWidth;
      const bottom = top + rect.offsetHeight;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  // Alignment methods for selected objects
  alignSelectionLeft() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    this.selectedRects.forEach(rect => {
      rect.style.left = bounds.minX + 'px';
    });
  }

  alignSelectionCenter() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    this.selectedRects.forEach(rect => {
      const rectCenterX = rect.offsetWidth / 2;
      const newLeft = centerX - rectCenterX;
      rect.style.left = newLeft + 'px';
    });
  }

  alignSelectionRight() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    this.selectedRects.forEach(rect => {
      const newLeft = bounds.maxX - rect.offsetWidth;
      rect.style.left = newLeft + 'px';
    });
  }

  alignSelectionTop() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    this.selectedRects.forEach(rect => {
      rect.style.top = bounds.minY + 'px';
    });
  }

  alignSelectionMiddle() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    const centerY = (bounds.minY + bounds.maxY) / 2;
    this.selectedRects.forEach(rect => {
      const rectCenterY = rect.offsetHeight / 2;
      const newTop = centerY - rectCenterY;
      rect.style.top = newTop + 'px';
    });
  }

  alignSelectionBottom() {
    if (this.selectedRects.length < 2) return;
    const bounds = this.getSelectionBounds();
    this.selectedRects.forEach(rect => {
      const newTop = bounds.maxY - rect.offsetHeight;
      rect.style.top = newTop + 'px';
    });
  }

  // Distribution (evenly space selected objects)
  distributeSelectionHorizontally() {
    if (this.selectedRects.length < 3) return;

    // Sort by left position
    const sortedRects = [...this.selectedRects].sort((a, b) =>
      parseFloat(a.style.left) - parseFloat(b.style.left)
    );

    const bounds = this.getSelectionBounds();
    const totalWidth = bounds.width;
    const totalRectsWidth = sortedRects.reduce((sum, rect) => sum + rect.offsetWidth, 0);
    const availableSpace = totalWidth - totalRectsWidth;
    const gap = availableSpace / (sortedRects.length - 1);

    let currentX = bounds.minX;
    sortedRects.forEach((rect, index) => {
      rect.style.left = currentX + 'px';
      currentX += rect.offsetWidth + gap;
    });
  }

  distributeSelectionVertically() {
    if (this.selectedRects.length < 3) return;

    // Sort by top position
    const sortedRects = [...this.selectedRects].sort((a, b) =>
      parseFloat(a.style.top) - parseFloat(b.style.top)
    );

    const bounds = this.getSelectionBounds();
    const totalHeight = bounds.height;
    const totalRectsHeight = sortedRects.reduce((sum, rect) => sum + rect.offsetHeight, 0);
    const availableSpace = totalHeight - totalRectsHeight;
    const gap = availableSpace / (sortedRects.length - 1);

    let currentY = bounds.minY;
    sortedRects.forEach((rect, index) => {
      rect.style.top = currentY + 'px';
      currentY += rect.offsetHeight + gap;
    });
  }

  handleToolbarClick(e) {
    e.stopPropagation(); // Prevent event from bubbling up
    const button = e.target.closest('.align-btn');
    if (!button) return;

    const action = button.dataset.action;
    switch (action) {
      case 'align-left':
        this.alignSelectionLeft();
        break;
      case 'align-center':
        this.alignSelectionCenter();
        break;
      case 'align-right':
        this.alignSelectionRight();
        break;
      case 'align-top':
        this.alignSelectionTop();
        break;
      case 'align-middle':
        this.alignSelectionMiddle();
        break;
      case 'align-bottom':
        this.alignSelectionBottom();
        break;
      case 'distribute-h':
        this.distributeSelectionHorizontally();
        break;
      case 'distribute-v':
        this.distributeSelectionVertically();
        break;
      case 'clone':
        this.duplicateSelection();
        break;
      case 'delete':
        this.eraseSelection();
        break;
      case 'preview':
        this.togglePreviewMode();
        break;
    }

    // Close dropdown and reposition trigger after action
    this.hideAlignmentDropdown();
    this.positionAlignmentTrigger();

    // Save after alignment/distribution
    this.saveToLocalStorage();
  }

  duplicateSelection() {
    if (this.selectedRects.length === 0) return;

    // Duplicate all selected rectangles
    const newRects = [];
    this.selectedRects.forEach(selectedRect => {
      const newRect = document.createElement('div');
      newRect.className = 'rect';
      newRect.style.width = selectedRect.offsetWidth + 'px';
      newRect.style.height = selectedRect.offsetHeight + 'px';
      newRect.style.backgroundColor = selectedRect.style.backgroundColor;
      newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';

      // Copy inner content (excluding resize handle)
      Array.from(selectedRect.children).forEach(child => {
        if (!child.classList.contains('resize-handle')) {
          const clone = child.cloneNode(true);
          clone.style.pointerEvents = 'none';
          newRect.appendChild(clone);
        }
      });

      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      if (!this.bordersVisible) handle.style.display = 'none';
      newRect.appendChild(handle);
      this.appendChild(newRect);
      newRects.push(newRect);
    });

    // Position new rectangles offset from originals so they're visible
    const offset = 20; // Offset in pixels
    this.selectedRects.forEach((originalRect, index) => {
      const newRect = newRects[index];
      const left = parseFloat(originalRect.style.left) + offset;
      const top = parseFloat(originalRect.style.top) + offset;
      newRect.style.left = left + 'px';
      newRect.style.top = top + 'px';
    });

    // Select the new rectangles
    this.selectedRects = newRects;
    this.updateSelectionVisuals();
    this.updateToolbarVisibility();

    // Save after duplication
    this.saveToLocalStorage();
  }

  duplicateRect(rect) {
    const newRect = document.createElement('div');
    newRect.className = 'rect';
    newRect.style.width = rect.offsetWidth + 'px';
    newRect.style.height = rect.offsetHeight + 'px';
    newRect.style.backgroundColor = rect.style.backgroundColor;
    newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';

    // Copy inner content (excluding resize handle)
    Array.from(rect.children).forEach(child => {
      if (!child.classList.contains('resize-handle')) {
        const clone = child.cloneNode(true);
        clone.style.pointerEvents = 'none';
        newRect.appendChild(clone);
      }
    });

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    if (!this.bordersVisible) handle.style.display = 'none';
    newRect.appendChild(handle);
    this.appendChild(newRect);

    // Position at the same position
    const left = parseFloat(rect.style.left);
    const top = parseFloat(rect.style.top);
    newRect.style.left = left + 'px';
    newRect.style.top = top + 'px';

    return newRect;
  }

  eraseSelection() {
    if (this.selectedRects.length === 0) return;

    // Remove all selected rectangles
    this.selectedRects.forEach(rect => rect.remove());
    this.selectedRects = [];
    this.clearGuides();
    this.updateToolbarVisibility();

    // Save after deletion
    this.saveToLocalStorage();
  }

  showQuickToolbar() {
    this.quickElementsToolbar.classList.add('visible');
    this.toolbarVisible = true;
  }

  hideQuickToolbar() {
    this.quickElementsToolbar.classList.remove('visible');
    this.toolbarVisible = false;
  }

  setupTopDragInteraction() {
    let isDragging = false;
    let startY = 0;
    const toolbarHeight = 80; // Approximate height of the toolbar
    const dragThreshold = 30; // Minimum drag distance to trigger reveal

    const onPointerDown = (e) => {
      // Only trigger from the drag zone or when toolbar is visible (drag handle)
      if (e.target === this.topDragZone ||
          e.target.classList.contains('drag-handle') ||
          (this.toolbarVisible && this.quickElementsToolbar.contains(e.target) && e.target.classList.contains('drag-handle'))) {
        isDragging = true;
        startY = e.clientY;
        this.topDragZone.classList.add('dragging');
        e.preventDefault();
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const deltaY = e.clientY - startY;

      if (!this.toolbarVisible && deltaY > dragThreshold) {
        // Dragging down from top - show toolbar
        this.showQuickToolbar();
      } else if (this.toolbarVisible && deltaY < -dragThreshold) {
        // Dragging up - hide toolbar
        this.hideQuickToolbar();
      }
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        this.topDragZone.classList.remove('dragging');
      }
    };

    // Mouse/touch entering from outside the window at the top
    const onMouseEnter = (e) => {
      // If entering from outside the window (y was 0 or negative) and now inside
      if (e.clientY <= 5 && e.buttons > 0) {
        // Mouse button is held down while entering from top
        this.showQuickToolbar();
      }
    };

    // Close toolbar when clicking outside
    const onDocumentClick = (e) => {
      if (this.toolbarVisible &&
          !this.quickElementsToolbar.contains(e.target) &&
          e.target !== this.topDragZone) {
        this.hideQuickToolbar();
      }
    };

    this.topDragZone.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    this.topDragZone.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('click', onDocumentClick);

    // Also allow the toolbar's drag handle to close
    this.quickElementsToolbar.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('drag-handle')) {
        isDragging = true;
        startY = e.clientY;
        e.preventDefault();
      }
    });
  }

  addComponentAtCenter(templateIndex) {
    const template = this.componentTemplates[templateIndex];
    if (!template) return;

    const newRect = document.createElement('div');
    newRect.className = 'rect';
    newRect.style.width = template.width + 'px';
    newRect.style.height = template.height + 'px';
    newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';
    newRect.innerHTML = template.html;

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    if (!this.bordersVisible) handle.style.display = 'none';
    newRect.appendChild(handle);

    // Position at canvas center
    const canvasBounds = this.getBoundingClientRect();
    const centerX = (canvasBounds.width / 2) - (template.width / 2);
    const centerY = (canvasBounds.height / 2) - (template.height / 2);
    newRect.style.left = centerX + 'px';
    newRect.style.top = centerY + 'px';

    this.appendChild(newRect);

    // Select the new component
    this.deselectAll();
    this.selectRect(newRect);

    // Save after adding component
    this.saveToLocalStorage();
  }

  // HTML Editor Modal Methods
  showEditorModal(rect) {
    this.editingRect = rect;

    // Get current HTML content (exclude the resize handle)
    const contentElements = Array.from(rect.children).filter(
      child => !child.classList.contains('resize-handle')
    );
    const currentHTML = contentElements.map(el => el.outerHTML).join('\n');

    // Create modal overlay
    this.editorModal = document.createElement('div');
    this.editorModal.className = 'editor-modal-overlay';

    this.editorModal.innerHTML = `
      <div class="editor-modal">
        <div class="editor-modal-header">
          <h3 class="editor-modal-title">Edit Component HTML</h3>
          <button class="editor-modal-close">&times;</button>
        </div>
        <div class="editor-modal-body">
          <div class="editor-section">
            <div class="editor-section-label">HTML Code</div>
            <textarea class="editor-textarea" spellcheck="false">${this.escapeHTML(currentHTML)}</textarea>
          </div>
          <div class="editor-section editor-preview-container">
            <div class="editor-section-label">Preview</div>
            <div class="editor-preview"></div>
            <div class="editor-error"></div>
          </div>
        </div>
        <div class="editor-modal-footer">
          <button class="editor-btn editor-btn-cancel">Cancel</button>
          <button class="editor-btn editor-btn-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.editorModal);

    // Get references to elements
    const textarea = this.editorModal.querySelector('.editor-textarea');
    const preview = this.editorModal.querySelector('.editor-preview');
    const errorDiv = this.editorModal.querySelector('.editor-error');
    const closeBtn = this.editorModal.querySelector('.editor-modal-close');
    const cancelBtn = this.editorModal.querySelector('.editor-btn-cancel');
    const saveBtn = this.editorModal.querySelector('.editor-btn-save');

    // Initial preview
    this.updatePreview(textarea.value, preview, errorDiv);

    // Real-time preview update
    textarea.addEventListener('input', () => {
      this.updatePreview(textarea.value, preview, errorDiv);
    });

    // Close handlers
    closeBtn.addEventListener('click', () => this.hideEditorModal());
    cancelBtn.addEventListener('click', () => this.hideEditorModal());

    // Close on overlay click
    this.editorModal.addEventListener('click', (e) => {
      if (e.target === this.editorModal) {
        this.hideEditorModal();
      }
    });

    // Save handler
    saveBtn.addEventListener('click', () => {
      const html = textarea.value;
      const error = this.validateHTML(html);
      if (!error) {
        this.applyHTMLToRect(html);
        this.hideEditorModal();
      } else {
        errorDiv.textContent = error;
        errorDiv.classList.add('visible');
      }
    });

    // Escape key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideEditorModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);
  }

  hideEditorModal() {
    if (this.editorModal) {
      this.editorModal.remove();
      this.editorModal = null;
    }
    this.editingRect = null;
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  validateHTML(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Check for parsing errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        return 'HTML parsing error: ' + parseError.textContent;
      }

      // Check for unclosed tags by comparing structure
      const body = doc.body;
      if (body.innerHTML.trim() === '' && html.trim() !== '') {
        // DOMParser couldn't parse anything meaningful
        return 'Invalid HTML structure';
      }

      return null; // No error
    } catch (e) {
      return 'Error: ' + e.message;
    }
  }

  updatePreview(html, previewEl, errorEl) {
    const error = this.validateHTML(html);

    if (error) {
      errorEl.textContent = error;
      errorEl.classList.add('visible');
      // Still show whatever can be rendered
      previewEl.innerHTML = html;
    } else {
      errorEl.classList.remove('visible');
      errorEl.textContent = '';
      previewEl.innerHTML = html;
    }
  }

  applyHTMLToRect(html) {
    if (!this.editingRect) return;

    // Store rect reference and properties before modifying
    const rect = this.editingRect;

    // Get or create resize handle
    let resizeHandle = rect.querySelector('.resize-handle');
    if (resizeHandle) {
      resizeHandle.remove(); // Temporarily remove to re-add at the end
    }

    // Remove all existing content
    rect.innerHTML = '';

    // Parse and add new content
    if (html.trim()) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newElements = Array.from(doc.body.children);

      newElements.forEach(el => {
        // Add pointer-events: none so dragging still works
        el.style.pointerEvents = 'none';
        rect.appendChild(el);
      });
    }

    // Re-add resize handle at the end
    if (!resizeHandle) {
      resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
    }
    resizeHandle.style.display = this.bordersVisible ? 'block' : 'none';
    rect.appendChild(resizeHandle);

    // Save after editing HTML
    this.saveToLocalStorage();
  }

  // Local Storage Methods
  serializeState() {
    const rects = [];
    this.querySelectorAll('.rect').forEach(rect => {
      // Get HTML content (exclude resize handle)
      const contentElements = Array.from(rect.children).filter(
        child => !child.classList.contains('resize-handle')
      );
      const html = contentElements.map(el => el.outerHTML).join('');

      rects.push({
        left: parseFloat(rect.style.left) || 0,
        top: parseFloat(rect.style.top) || 0,
        width: rect.offsetWidth,
        height: rect.offsetHeight,
        html: html
      });
    });

    // Also save fixed guides
    const fixedHorizontals = this.guides ? this.guides.getFixedHorizontals() : [];
    const fixedVerticals = this.guides ? this.guides.getFixedVerticals() : [];

    return {
      version: 1,
      rects,
      fixedHorizontals,
      fixedVerticals
    };
  }

  saveToLocalStorage() {
    try {
      const state = this.serializeState();
      localStorage.setItem(SnappingCanvas.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(SnappingCanvas.STORAGE_KEY);
      if (!saved) return false;

      const state = JSON.parse(saved);
      if (!state || !state.rects) return false;

      // Clear existing rects (but keep UI elements)
      this.querySelectorAll('.rect').forEach(rect => rect.remove());

      // Restore rects
      state.rects.forEach(rectData => {
        const newRect = document.createElement('div');
        newRect.className = 'rect';
        newRect.style.left = rectData.left + 'px';
        newRect.style.top = rectData.top + 'px';
        newRect.style.width = rectData.width + 'px';
        newRect.style.height = rectData.height + 'px';
        newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';

        // Restore HTML content
        if (rectData.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(rectData.html, 'text/html');
          Array.from(doc.body.children).forEach(el => {
            el.style.pointerEvents = 'none';
            newRect.appendChild(el);
          });
        }

        // Add resize handle
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        if (!this.bordersVisible) handle.style.display = 'none';
        newRect.appendChild(handle);

        this.appendChild(newRect);
      });

      // Restore fixed guides
      if (this.guides && state.fixedHorizontals) {
        state.fixedHorizontals.forEach(y => this.guides.addHorizontalGuide(y));
      }
      if (this.guides && state.fixedVerticals) {
        state.fixedVerticals.forEach(x => this.guides.addVerticalGuide(x));
      }

      return true;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return false;
    }
  }
}

customElements.define('snapping-canvas', SnappingCanvas);
