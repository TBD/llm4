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
  }

  connectedCallback() {
    // Create guides
    this.guides = document.createElement('snapping-guides');
    this.appendChild(this.guides);

    // Attach events
    this.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
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
      // Dragging
      this.dragging = e.target;
      this.offsetX = e.offsetX;
      this.offsetY = e.offsetY;
      this.initialLeft = parseFloat(this.dragging.style.left);
      this.initialTop = parseFloat(this.dragging.style.top);
      this.dragging.style.zIndex = 10;
      this.updateOtherRects();
    }
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }

  handleMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.dragging) {
      this.guides.setGuideX(null);
      this.guides.setGuideY(null);
      let left = e.pageX - this.offsetX;
      let top = e.pageY - this.offsetY;
      const result = this.guides.snapDrag(left, top, this.dragging.offsetWidth, this.dragging.offsetHeight, this.otherRects);
      left = result.left;
      top = result.top;
      this.showGuides();
      this.dragging.style.left = left + 'px';
      this.dragging.style.top = top + 'px';
    }
    if (this.resizing) {
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
    if (this.dragging) this.dragging.style.zIndex = 1;
    this.clearGuides();
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    this.dragging = null;
    this.resizing = null;
  }

  handleKeyDown(e) {
    if (e.key === 'h' || e.key === 'H') {
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
    } else if ((e.key === 'e' || e.key === 'E') && this.dragging) {
      this.dragging.remove();
      this.clearGuides();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      this.dragging = null;
    } else if ((e.key === 'd' || e.key === 'D') && this.dragging) {
      const newRect = document.createElement('div');
      newRect.className = 'rect';
      newRect.style.width = this.dragging.offsetWidth + 'px';
      newRect.style.height = this.dragging.offsetHeight + 'px';
      newRect.style.left = (this.mouseX - this.offsetX) + 'px';
      newRect.style.top = (this.mouseY - this.offsetY) + 'px';
      newRect.style.border = this.bordersVisible ? '2px solid #19f' : 'none';
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      if (!this.bordersVisible) handle.style.display = 'none';
      newRect.appendChild(handle);
      this.appendChild(newRect);
      // Move old back
      this.dragging.style.left = this.initialLeft + 'px';
      this.dragging.style.top = this.initialTop + 'px';
      this.dragging.style.zIndex = 1;
      // Start dragging new
      this.dragging = newRect;
      this.dragging.style.zIndex = 10;
      this.updateOtherRects();
    }
  }

  updateOtherRects() {
    const current = this.dragging || this.resizing;
    this.otherRects = Array.from(this.querySelectorAll('.rect')).filter(r => r !== current).map(r => ({
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
