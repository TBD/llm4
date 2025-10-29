class SnappingGuides extends HTMLElement {
  constructor() {
    super();
    this.vGuide = document.createElement('div');
    this.hGuide = document.createElement('div');
    this.fixedHorizontals = [];
    this.fixedVerticals = [];
    this.guideX = null;
    this.guideY = null;
    this.snapDistance = 10;

    // Style guides
    Object.assign(this.vGuide.style, {
      position: 'absolute',
      borderLeft: '2px dashed #19f',
      zIndex: '9999',
      pointerEvents: 'none',
      width: '1px',
      height: '100%',
      opacity: '0.7',
      top: '0',
      display: 'none'
    });
    Object.assign(this.hGuide.style, {
      position: 'absolute',
      borderTop: '2px dashed #19f',
      zIndex: '9999',
      pointerEvents: 'none',
      height: '1px',
      width: '100%',
      opacity: '0.7',
      left: '0',
      display: 'none'
    });
  }

  connectedCallback() {
    this.appendChild(this.vGuide);
    this.appendChild(this.hGuide);
  }

  showVertical(x) {
    this.vGuide.style.left = `${x}px`;
    this.vGuide.style.display = 'block';
  }

  showHorizontal(y) {
    this.hGuide.style.top = `${y}px`;
    this.hGuide.style.display = 'block';
  }

  hideVertical() {
    this.vGuide.style.display = 'none';
  }

  hideHorizontal() {
    this.hGuide.style.display = 'none';
  }

  hide() {
    this.hideVertical();
    this.hideHorizontal();
  }

  addHorizontalGuide(y) {
    if (!this.fixedHorizontals.includes(y)) {
      this.fixedHorizontals.push(y);
      const g = document.createElement('div');
      g.className = 'fixed-guide';
      Object.assign(g.style, {
        position: 'absolute',
        borderTop: '1px dashed #19f',
        zIndex: '9999',
        pointerEvents: 'none',
        height: '1px',
        width: '100%',
        opacity: '0.7',
        left: '0',
        top: `${y}px`
      });
      this.appendChild(g);
    }
  }

  addVerticalGuide(x) {
    if (!this.fixedVerticals.includes(x)) {
      this.fixedVerticals.push(x);
      const g = document.createElement('div');
      g.className = 'fixed-guide';
      Object.assign(g.style, {
        position: 'absolute',
        borderLeft: '1px dashed #19f',
        zIndex: '9999',
        pointerEvents: 'none',
        width: '1px',
        height: '100%',
        opacity: '0.7',
        top: '0',
        left: `${x}px`
      });
      this.appendChild(g);
    }
  }

  removeAllFixedGuides() {
    this.fixedHorizontals.length = 0;
    this.fixedVerticals.length = 0;
    this.querySelectorAll('.fixed-guide').forEach(g => g.remove());
  }

  getFixedHorizontals() {
    return this.fixedHorizontals;
  }

  getFixedVerticals() {
    return this.fixedVerticals;
  }

  getGuideX() {
    return this.guideX;
  }

  getGuideY() {
    return this.guideY;
  }

  setGuideX(x) {
    this.guideX = x;
  }

  setGuideY(y) {
    this.guideY = y;
  }

  snapDrag(left, top, width, height, others) {
    this.guideX = null;
    this.guideY = null;

    // Check against other rectangles
    for (const rect of others) {
      const rectLeft = rect.left;
      const rectTop = rect.top;
      const rectRight = rectLeft + rect.width;
      const rectBottom = rectTop + rect.height;

      // Check left edge
      if (Math.abs(left - rectLeft) < this.snapDistance) {
        left = rectLeft;
        this.guideX = left;
      }
      // Check right edge
      else if (Math.abs((left + width) - rectRight) < this.snapDistance) {
        left = rectRight - width;
        this.guideX = left + width;
      }

      // Check top edge
      if (Math.abs(top - rectTop) < this.snapDistance) {
        top = rectTop;
        this.guideY = top;
      }
      // Check bottom edge
      else if (Math.abs((top + height) - rectBottom) < this.snapDistance) {
        top = rectBottom - height;
        this.guideY = top + height;
      }
    }

    // Check fixed verticals
    for (let fx of this.getFixedVerticals()) {
      if (Math.abs(left - fx) < this.snapDistance) {
        left = fx;
        this.guideX = fx;
      } else if (Math.abs((left + width) - fx) < this.snapDistance) {
        left = fx - width;
        this.guideX = fx;
      }
    }

    // Check fixed horizontals
    for (let fy of this.getFixedHorizontals()) {
      if (Math.abs(top - fy) < this.snapDistance) {
        top = fy;
        this.guideY = fy;
      } else if (Math.abs((top + height) - fy) < this.snapDistance) {
        top = fy - height;
        this.guideY = fy;
      }
    }

    return { left, top };
  }

  snapResize(rect, newW, newH, others) {
    this.guideX = null;
    this.guideY = null;

    const newRight = rect.left + newW;
    const newBottom = rect.top + newH;

    for (const other of others) {
      const otherRect = { left: other.left, top: other.top, right: other.left + other.width, bottom: other.top + other.height };

      // Check right edge to other's left
      if (Math.abs(newRight - otherRect.left) < this.snapDistance) {
        newW = otherRect.left - rect.left;
        this.guideX = rect.left + newW;
      }
      // Check right edge to other's right
      if (Math.abs(newRight - otherRect.right) < this.snapDistance) {
        newW = otherRect.right - rect.left;
        this.guideX = otherRect.right;
      }
      // Check bottom edge to other's top
      if (Math.abs(newBottom - otherRect.top) < this.snapDistance) {
        newH = otherRect.top - rect.top;
        this.guideY = rect.top + newH;
      }
      // Check bottom edge to other's bottom
      if (Math.abs(newBottom - otherRect.bottom) < this.snapDistance) {
        newH = otherRect.bottom - rect.top;
        this.guideY = otherRect.bottom;
      }
    }

    // Check fixed verticals for newRight
    for (let fx of this.getFixedVerticals()) {
      if (Math.abs(newRight - fx) < this.snapDistance) {
        newW = fx - rect.left;
        this.guideX = fx;
      }
    }

    // Check fixed horizontals for newBottom
    for (let fy of this.getFixedHorizontals()) {
      if (Math.abs(newBottom - fy) < this.snapDistance) {
        newH = fy - rect.top;
        this.guideY = fy;
      }
    }

    newW = Math.max(50, newW);
    newH = Math.max(50, newH);
    return { newW, newH };
  }
}

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

    // Get toolbar reference
    this.toolbar = this.querySelector('.alignment-toolbar');

    // Attach events
    this.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Toolbar button events
    if (this.toolbar) {
      this.toolbar.addEventListener('click', this.handleToolbarClick.bind(this));
    }

    // Initialize toolbar visibility
    this.updateToolbarVisibility();
  }

  handleMouseDown(e) {
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
        // Single select or start dragging
        if (!this.selectedRects.includes(rect)) {
          this.deselectAll();
          this.selectRect(rect);
        }
        // Start dragging all selected rectangles
        this.dragging = rect;
        this.offsetX = e.offsetX;
        this.offsetY = e.offsetY;

        // Clear any existing guides before starting multi-drag
        this.guides.hide();
        this.clearAlignmentGuides();

        // Store initial positions for all selected rectangles
        this.dragOffsets = this.selectedRects.map(selectedRect => ({
          rect: selectedRect,
          initialLeft: parseFloat(selectedRect.style.left),
          initialTop: parseFloat(selectedRect.style.top)
        }));

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
      this.marqueeStartX = e.clientX;
      this.marqueeStartY = e.clientY;
      this.createMarqueeElement();
    }
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }

  handleMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.marqueeSelecting) {
      this.updateMarquee(e.clientX, e.clientY);
    } else if (this.dragging) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);

      // Calculate the delta from the initial position of the primary dragged rect
      const primaryOffset = this.dragOffsets.find(offset => offset.rect === this.dragging);
      if (!primaryOffset) return;

      const deltaX = (e.pageX - this.offsetX) - primaryOffset.initialLeft;
      const deltaY = (e.pageY - this.offsetY) - primaryOffset.initialTop;

      // Calculate new position for primary rectangle
      let newLeft = primaryOffset.initialLeft + deltaX;
      let newTop = primaryOffset.initialTop + deltaY;

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

      // Adjust delta based on final position
      const finalDeltaX = newLeft - primaryOffset.initialLeft;
      const finalDeltaY = newTop - primaryOffset.initialTop;

      // Apply final delta to all rectangles
      this.dragOffsets.forEach(otherOffset => {
        otherOffset.rect.style.left = (otherOffset.initialLeft + finalDeltaX) + 'px';
        otherOffset.rect.style.top = (otherOffset.initialTop + finalDeltaY) + 'px';
      });

      this.showGuides();
    } else if (this.resizing) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);
      let newW = Math.max(50, this.startW + (e.pageX - this.startX));
      let newH = Math.max(50, this.startH + (e.pageY - this.startY));
      const rectPos = this.resizing.getBoundingClientRect();
      const result = this.guides.snapResize({left: rectPos.left, top: rectPos.top}, newW, newH, this.otherRects);
      newW = result.newW;
      newH = result.newH;
      this.showGuides();
      this.resizing.style.width = newW + 'px';
      this.resizing.style.height = newH + 'px';
    }
  }

  handleMouseUp() {
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
      this.guides.addHorizontalGuide(this.mouseY);
    } else if (e.key === 'v' || e.key === 'V') {
      this.guides.addVerticalGuide(this.mouseX);
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
    } else if ((e.key === 'e' || e.key === 'E') && this.dragging) {
      // Remove all selected rectangles
      this.selectedRects.forEach(rect => rect.remove());
      this.selectedRects = [];
      this.clearGuides();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      this.dragging = null;
      this.dragOffsets = [];
    } else if ((e.key === 'd' || e.key === 'D') && this.dragging) {
      // Duplicate all selected rectangles
      const newRects = [];
      const primaryOffset = this.dragOffsets.find(offset => offset.rect === this.dragging);

      this.dragOffsets.forEach(offset => {
        const newRect = document.createElement('div');
        newRect.className = 'rect';
        newRect.style.width = offset.rect.offsetWidth + 'px';
        newRect.style.height = offset.rect.offsetHeight + 'px';
        newRect.style.backgroundColor = offset.rect.style.backgroundColor;
        newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        if (!this.bordersVisible) handle.style.display = 'none';
        newRect.appendChild(handle);
        this.appendChild(newRect);
        newRects.push(newRect);
      });

      // Position new rectangles at mouse position, maintaining relative positions
      if (primaryOffset) {
        const baseLeft = this.mouseX - this.offsetX;
        const baseTop = this.mouseY - this.offsetY;

        this.dragOffsets.forEach((offset, index) => {
          const newRect = newRects[index];
          const relativeLeft = offset.initialLeft - primaryOffset.initialLeft;
          const relativeTop = offset.initialTop - primaryOffset.initialTop;

          newRect.style.left = (baseLeft + relativeLeft) + 'px';
          newRect.style.top = (baseTop + relativeTop) + 'px';
        });
      }

      // Move old rectangles back to original positions
      this.dragOffsets.forEach(offset => {
        offset.rect.style.left = offset.initialLeft + 'px';
        offset.rect.style.top = offset.initialTop + 'px';
        offset.rect.style.zIndex = 1;
      });

      // Select and start dragging new rectangles
      this.selectedRects = newRects;
      this.updateSelectionVisuals();
      this.dragging = newRects[0]; // Primary drag rect is the first one
      this.dragOffsets = newRects.map(newRect => ({
        rect: newRect,
        initialLeft: parseFloat(newRect.style.left),
        initialTop: parseFloat(newRect.style.top)
      }));
      this.selectedRects.forEach(rect => rect.style.zIndex = 10);
      this.updateOtherRects();
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
      if (this.selectedRects.length > 1) {
        this.toolbar.style.display = 'flex';
      } else {
        this.toolbar.style.display = 'none';
      }
    }
  }

  updateSelectionVisuals() {
    // Update all rects
    this.querySelectorAll('.rect').forEach(rect => {
      if (this.selectedRects.includes(rect)) {
        rect.style.boxShadow = '0 0 100px -20px #19f';
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
      zIndex: '1000'
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
    const marqueeRect = {
      left: startX,
      top: startY,
      right: startX + width,
      bottom: startY + height
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

  checkAlignmentGuides(draggedRect, newLeft, newTop) {
    this.clearAlignmentGuides();

    const draggedBounds = {
      left: newLeft,
      top: newTop,
      right: newLeft + draggedRect.offsetWidth,
      bottom: newTop + draggedRect.offsetHeight
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
        snappedLeft = otherBounds.left - draggedRect.offsetWidth;
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
        snappedLeft = otherBounds.right - draggedRect.offsetWidth;
        foundAlignment = true;
      }

      // Check horizontal alignments (top/bottom edges)
      // Dragged bottom edge to other top edge
      if (Math.abs(draggedBounds.bottom - otherBounds.top) <= alignmentThreshold) {
        this.createAlignmentGuide('horizontal', otherBounds.top);
        snappedTop = otherBounds.top - draggedRect.offsetHeight;
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
        snappedTop = otherBounds.bottom - draggedRect.offsetHeight;
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

  handleDoubleClick(e) {
    if (e.target.classList.contains('rect')) {
      const mutedColors = ['#f0f8ff', '#e6f3ff', '#cce7ff', '#b3dbff', '#99cfff', '#80c3ff', '#fafafa', '#f5f5f5', '#eeeeee', '#e0e0e0'];
      const randomColor = mutedColors[Math.floor(Math.random() * mutedColors.length)];
      e.target.style.backgroundColor = randomColor;
    }
  }
}

customElements.define('snapping-guides', SnappingGuides);
customElements.define('snapping-canvas', SnappingCanvas);
