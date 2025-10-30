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
      zIndex: '10001',
      pointerEvents: 'none',
      width: '1px',
      opacity: '0.7',
      display: 'none'
    });
    Object.assign(this.hGuide.style, {
      position: 'absolute',
      borderTop: '2px dashed #19f',
      zIndex: '10001',
      pointerEvents: 'none',
      height: '1px',
      opacity: '0.7',
      display: 'none'
    });
  }

  connectedCallback() {
    this.appendChild(this.vGuide);
    this.appendChild(this.hGuide);
  }

  showVertical(x) {
    this.vGuide.style.left = x + 'px';
    this.vGuide.style.top = '0px';
    this.vGuide.style.height = '100%';
    this.vGuide.style.display = 'block';
  }

  showHorizontal(y) {
    console.log('showHorizontal: y=', y);
    this.hGuide.style.top = y + 'px';
    this.hGuide.style.left = '0px';
    this.hGuide.style.width = '100%';
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
        zIndex: '10001',
        pointerEvents: 'none',
        height: '1px',
        width: '100%',
        opacity: '0.7',
        left: '0',
        top: y + 'px'
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
        zIndex: '10001',
        pointerEvents: 'none',
        width: '1px',
        height: '100%',
        opacity: '0.7',
        top: '0',
        left: x + 'px'
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
    console.log('snapResize: rect.top=', rect.top, 'newH=', newH, 'newBottom=', rect.top + newH);
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
        console.log('snapResize: guideY set to', this.guideY, 'for bottom to top');
      }
      // Check bottom edge to other's bottom
      if (Math.abs(newBottom - otherRect.bottom) < this.snapDistance) {
        newH = otherRect.bottom - rect.top;
        this.guideY = otherRect.bottom;
        console.log('snapResize: guideY set to', this.guideY, 'for bottom to bottom');
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
        console.log('snapResize: guideY set to', this.guideY, 'for fixed horizontal fy=', fy);
      }
    }

    newW = Math.max(50, newW);
    newH = Math.max(50, newH);
    return { newW, newH };
  }
}

customElements.define('snapping-guides', SnappingGuides);
