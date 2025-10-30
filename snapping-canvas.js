class SnappingCanvas extends HTMLElement {
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
  }

  connectedCallback() {
    // Create guides
    this.guides = document.createElement('snapping-guides');
    this.appendChild(this.guides);

    // Create and append styles for alignment toolbar
    const style = document.createElement('style');
    style.textContent = `
      .alignment-toolbar {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 8px;
        display: none;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        font-family: inherit;
        font-size: 12px;
      }

      .align-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6px 8px;
        border: none;
        background: none;
        border-radius: 4px;
        cursor: pointer;
        color: #333;
        transition: background-color 0.2s;
        min-width: 60px;
      }

      .align-btn:hover {
        background: rgba(25, 159, 255, 0.1);
        color: #19f;
      }

      .align-btn:active {
        background: rgba(25, 159, 255, 0.2);
      }

      .align-icon {
        font-size: 14px;
        margin-bottom: 2px;
        user-select: none;
      }

      .align-label {
        font-size: 10px;
        text-align: center;
        line-height: 1;
        user-select: none;
      }
    `;
    this.appendChild(style);

    // Create toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'alignment-toolbar';
    this.toolbar.innerHTML = `
      <button class=\"align-btn\" data-action=\"align-left\">
        <div class=\"align-icon\">←</div>
        <div class=\"align-label\">Left</div>
      </button>
      <button class=\"align-btn\" data-action=\"align-center\">
        <div class=\"align-icon\">↔</div>
        <div class=\"align-label\">Center</div>
      </button>
      <button class=\"align-btn\" data-action=\"align-right\">
        <div class=\"align-icon\">→</div>
        <div class=\"align-label\">Right</div>
      </button>
      <button class=\"align-btn\" data-action=\"align-top\">
        <div class=\"align-icon\">↑</div>
        <div class=\"align-label\">Top</div>
      </button>
      <button class=\"align-btn\" data-action=\"align-middle\">
        <div class=\"align-icon\">↕</div>
        <div class=\"align-label\">Middle</div>
      </button>
      <button class=\"align-btn\" data-action=\"align-bottom\">
        <div class=\"align-icon\">↓</div>
        <div class=\"align-label\">Bottom</div>
      </button>
      <button class=\"align-btn\" data-action=\"distribute-h\">
        <div class=\"align-icon\">⇄</div>
        <div class=\"align-label\">Dist H</div>
      </button>
      <button class=\"align-btn\" data-action=\"distribute-v\">
        <div class=\"align-icon\">⇅</div>
        <div class=\"align-label\">Dist V</div>
      </button>
    `;
    this.appendChild(this.toolbar);

    // Add styles for help
    style.textContent += `
      .help-button {
        position: absolute;
        bottom: 4em;
        right: 10px;
        padding: 4px 8px;
        background: rgba(25, 159, 255, 0.9);
        border: 1px solid #19f;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        color: #fff;
      }

      .help-text {
        position: absolute;
        bottom: 4em;
        right: 60px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        max-width: 300px;
        display: none;
        z-index: 10003;
      }
    `;

    // Create help text
    this.helpText = document.createElement('div');
    this.helpText.className = 'help-text';
    this.helpText.textContent = 'H: horizontal guide | V: vertical guide | R: remove guides | Alt+drag: duplicate | Backspace: erase selection | B: toggle borders/handles | Cmd+A: select all | Shift/Cmd+click: multi-select | Marquee: drag on empty canvas | Select 2+ objects: alignment toolbar | Drag near edges: auto-align';
    this.appendChild(this.helpText);

    // Help button for desktop
    if (!('ontouchstart' in window)) {
      this.helpButton = document.createElement('button');
      this.helpButton.className = 'help-button';
      this.helpButton.textContent = 'Help';
      this.helpButton.addEventListener('click', () => {
        this.helpText.style.display = this.helpText.style.display === 'block' ? 'none' : 'block';
      });
      this.appendChild(this.helpButton);
    }

    // Mobile toolbar
    if ('ontouchstart' in window) {
      style.textContent += `
        .mobile-toolbar {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px;
          z-index: 10002;
        }

        .mobile-btn {
          padding: 10px 15px;
          border: none;
          background: #19f;
          color: white;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          min-width: 70px;
        }

        .mobile-btn:active {
          background: #007acc;
        }
      `;

      // Larger resize handles on mobile
      const resizeStyle = document.createElement('style');
      resizeStyle.textContent = `
        .resize-handle {
          width: 48px !important;
          height: 48px !important;
          right: -24px !important;
          bottom: -24px !important;
        }
      `;
      this.appendChild(resizeStyle);

      this.mobileToolbar = document.createElement('div');
      this.mobileToolbar.className = 'mobile-toolbar';

      const cloneBtn = document.createElement('button');
      cloneBtn.className = 'mobile-btn';
      cloneBtn.textContent = 'Clone';
      cloneBtn.addEventListener('click', () => this.duplicateSelection());
      this.mobileToolbar.appendChild(cloneBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'mobile-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => this.eraseSelection());
      this.mobileToolbar.appendChild(deleteBtn);

      const helpBtn = document.createElement('button');
      helpBtn.className = 'mobile-btn';
      helpBtn.textContent = 'Help';
      helpBtn.addEventListener('click', () => {
        this.helpText.style.display = this.helpText.style.display === 'block' ? 'none' : 'block';
      });
      this.mobileToolbar.appendChild(helpBtn);

      this.appendChild(this.mobileToolbar);
    }

    // Attach events
    this.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    document.addEventListener('pointerup', this.handlePointerUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Toolbar button events
    this.toolbar.addEventListener('click', this.handleToolbarClick.bind(this));

    // Initialize toolbar visibility
    this.updateToolbarVisibility();
  }

  handlePointerDown(e) {
    // Only handle primary pointer (left mouse or touch)
    if (e.button !== 0) return;

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
      // Dragging or selecting
      const rect = e.target;
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
            // Reposition to center at mouse
            const newBounds = this.getSelectionBounds();
            const canvasBounds = this.getBoundingClientRect();
            const mouseX = e.clientX - canvasBounds.left;
            const mouseY = e.clientY - canvasBounds.top;
            const centerX = (newBounds.minX + newBounds.maxX) / 2;
            const centerY = (newBounds.minY + newBounds.maxY) / 2;
            const shiftX = mouseX - centerX;
            const shiftY = mouseY - centerY;
            this.selectedRects.forEach(r => {
              r.style.left = (parseFloat(r.style.left) + shiftX) + 'px';
              r.style.top = (parseFloat(r.style.top) + shiftY) + 'px';
            });
            this.dragging = this.selectedRects[0];
          } else {
            // Duplicate the clicked rect
            const duplicate = this.duplicateRect(rect);
            this.deselectAll();
            this.selectRect(duplicate);
            this.dragging = duplicate;
            // Position at mouse
            const canvasBounds = this.getBoundingClientRect();
            const rectBounds = rect.getBoundingClientRect();
            this.offsetX = e.clientX - (rectBounds.left - canvasBounds.left);
            this.offsetY = e.clientY - (rectBounds.top - canvasBounds.top);
            duplicate.style.left = (e.clientX - canvasBounds.left - this.offsetX) + 'px';
            duplicate.style.top = (e.clientY - canvasBounds.top - this.offsetY) + 'px';
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

      let newLeft = e.clientX - this.offsetX;
      let newTop = e.clientY - this.offsetY;

      if (this.selectedRects.length > 1 && this.dragOffsets.length > 0) {
        // Multi-drag
        // Calculate new position for primary rectangle
        const primaryOffset = this.dragOffsets.find(offset => offset.rect === this.dragging);
        if (!primaryOffset) return;

        // Get bounding box of all selected rectangles
        const bounds = this.getSelectionBounds();
        const groupWidth = bounds.width;
        const groupHeight = bounds.height;

        // First apply existing snapping guides using the group's bounding box
        const snapResult = this.guides.snapDrag(newLeft, newTop, groupWidth, groupHeight, this.otherRects);
        newLeft = snapResult.left;
        newTop = snapResult.top;

        // Then check for alignment guides and potentially snap using group's bounding box
        const alignmentResult = this.checkAlignmentGuides(this.dragging, newLeft, newTop, groupWidth, groupHeight);
        if (alignmentResult.aligned) {
          newLeft = alignmentResult.left;
          newTop = alignmentResult.top;
        }

        // Adjust delta based on final position
        const finalDeltaX = newLeft - primaryOffset.initialLeft;
        const finalDeltaY = newTop - primaryOffset.initialTop;

        // Apply final delta to all rectangles
        this.dragOffsets.forEach(otherOffset => {
          otherOffset.rect.style.left = (otherOffset.initialLeft + finalDeltaX) + 'px';
          otherOffset.rect.style.top = (otherOffset.initialTop + finalDeltaY) + 'px';
        });
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
      }

      this.showGuides();
    } else if (this.resizing) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);
      let newW = Math.max(50, this.startW + (e.pageX - this.startX));
      let newH = Math.max(50, this.startH + (e.pageY - this.startY));
      console.log('resizing: newW=', newW, 'newH=', newH);
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
  }

  handleKeyDown(e) {
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
    } else if (e.key === 'v' || e.key === 'V') {
      this.guides.addVerticalGuide(mouseX);
    } else if (e.key === 'r' || e.key === 'R') {
      this.guides.removeAllFixedGuides();
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
    }

  }

  updateOtherRects() {
    const current = this.dragging || this.resizing;
    // When dragging multiple selected rectangles, exclude all selected rectangles from snapping
    const excludeRects = this.selectedRects.length > 1 ? this.selectedRects : [current];
    this.otherRects = Array.from(this.querySelectorAll('.rect')).filter(r => !excludeRects.includes(r)).map(r => ({
      left: parseFloat(r.style.left),
      top: parseFloat(r.style.top),
      width: r.offsetWidth,
      height: r.offsetHeight
    }));
  }

  showGuides() {
    if (this.guides.getGuideX() !== null) {
      this.guides.showVertical(this.guides.getGuideX());
    } else {
      this.guides.hideVertical();
    }
    if (this.guides.getGuideY() !== null) {
      console.log('showGuides: calling showHorizontal with guideY=', this.guides.getGuideY());
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

  updateToolbarVisibility() {
    if (this.toolbar) {
      const isMobile = 'ontouchstart' in window;
      if (this.selectedRects.length > 1 || (isMobile && this.selectedRects.length > 0)) {
        this.toolbar.style.display = 'flex';
      } else {
        this.toolbar.style.display = 'none';
      }
    }
  }

  updateSelectionVisuals() {
    const isMobile = 'ontouchstart' in window;
    const shadow = isMobile ? '0 0 20px -5px #19f' : '0 0 100px -20px #19f';
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

    // Check against all other rectangles (exclude all selected rectangles since they're moving together)
    this.querySelectorAll('.rect').forEach(otherRect => {
      if (this.selectedRects.includes(otherRect)) return;

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
    });

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
    }
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

      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      if (!this.bordersVisible) handle.style.display = 'none';
      newRect.appendChild(handle);
      this.appendChild(newRect);
      newRects.push(newRect);
    });

    // Position new rectangles slightly offset from originals
    this.selectedRects.forEach((originalRect, index) => {
      const newRect = newRects[index];
      const left = parseFloat(originalRect.style.left);
      const top = parseFloat(originalRect.style.top);
      newRect.style.left = (left + 20) + 'px';
      newRect.style.top = (top + 20) + 'px';
    });

    // Select the new rectangles
    this.selectedRects = newRects;
    this.updateSelectionVisuals();
    this.updateToolbarVisibility();
  }

  duplicateRect(rect) {
    const newRect = document.createElement('div');
    newRect.className = 'rect';
    newRect.style.width = rect.offsetWidth + 'px';
    newRect.style.height = rect.offsetHeight + 'px';
    newRect.style.backgroundColor = rect.style.backgroundColor;
    newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';

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
  }


}

customElements.define('snapping-canvas', SnappingCanvas);
