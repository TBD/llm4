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

    let snappedX = false;
    let snappedY = false;

    // Check against other rectangles
    for (const rect of others) {
      const rectLeft = rect.left;
      const rectTop = rect.top;
      const rectRight = rectLeft + rect.width;
      const rectBottom = rectTop + rect.height;
      const rectCenterX = rectLeft + rect.width / 2;
      const rectCenterY = rectTop + rect.height / 2;

      // Check left edge (only if not already snapped)
      if (!snappedX) {
        if (Math.abs(left - rectLeft) < this.snapDistance) {
          left = rectLeft;
          this.guideX = left;
          snappedX = true;
        }
        // Check right edge
        else if (Math.abs((left + width) - rectRight) < this.snapDistance) {
          left = rectRight - width;
          this.guideX = left + width;
          snappedX = true;
        }
        // Check center horizontal alignment
        else if (Math.abs((left + width / 2) - rectCenterX) < this.snapDistance) {
          left = rectCenterX - width / 2;
          this.guideX = rectCenterX;
          snappedX = true;
        }
      }

      // Check top edge (only if not already snapped)
      if (!snappedY) {
        if (Math.abs(top - rectTop) < this.snapDistance) {
          top = rectTop;
          this.guideY = top;
          snappedY = true;
        }
        // Check bottom edge
        else if (Math.abs((top + height) - rectBottom) < this.snapDistance) {
          top = rectBottom - height;
          this.guideY = top + height;
          snappedY = true;
        }
        // Check center vertical alignment
        else if (Math.abs((top + height / 2) - rectCenterY) < this.snapDistance) {
          top = rectCenterY - height / 2;
          this.guideY = rectCenterY;
          snappedY = true;
        }
      }

      // Early exit if both dimensions are snapped
      if (snappedX && snappedY) break;
    }

    // Check fixed verticals (only if X not already snapped)
    if (!snappedX) {
      for (let fx of this.getFixedVerticals()) {
        if (Math.abs(left - fx) < this.snapDistance) {
          left = fx;
          this.guideX = fx;
          break;
        } else if (Math.abs((left + width) - fx) < this.snapDistance) {
          left = fx - width;
          this.guideX = fx;
          break;
        }
      }
    }

    // Check fixed horizontals (only if Y not already snapped)
    if (!snappedY) {
      for (let fy of this.getFixedHorizontals()) {
        if (Math.abs(top - fy) < this.snapDistance) {
          top = fy;
          this.guideY = fy;
          break;
        } else if (Math.abs((top + height) - fy) < this.snapDistance) {
          top = fy - height;
          this.guideY = fy;
          break;
        }
      }
    }

    return { left, top };
  }

  snapResize(rect, newW, newH, others) {
    this.guideX = null;
    this.guideY = null;

    const newRight = rect.left + newW;
    const newBottom = rect.top + newH;

    let snappedX = false;
    let snappedY = false;

    for (const other of others) {
      const otherRect = {
        left: other.left,
        top: other.top,
        right: other.left + other.width,
        bottom: other.top + other.height,
        centerX: other.left + other.width / 2,
        centerY: other.top + other.height / 2
      };

      // Check horizontal snapping (only if not already snapped)
      if (!snappedX) {
        // Check right edge to other's left
        if (Math.abs(newRight - otherRect.left) < this.snapDistance) {
          newW = otherRect.left - rect.left;
          this.guideX = rect.left + newW;
          snappedX = true;
        }
        // Check right edge to other's right
        else if (Math.abs(newRight - otherRect.right) < this.snapDistance) {
          newW = otherRect.right - rect.left;
          this.guideX = otherRect.right;
          snappedX = true;
        }
        // Check if resized rect's center aligns with other's center
        else if (Math.abs((rect.left + newW / 2) - otherRect.centerX) < this.snapDistance) {
          newW = (otherRect.centerX - rect.left) * 2;
          this.guideX = otherRect.centerX;
          snappedX = true;
        }
      }

      // Check vertical snapping (only if not already snapped)
      if (!snappedY) {
        // Check bottom edge to other's top
        if (Math.abs(newBottom - otherRect.top) < this.snapDistance) {
          newH = otherRect.top - rect.top;
          this.guideY = rect.top + newH;
          snappedY = true;
        }
        // Check bottom edge to other's bottom
        else if (Math.abs(newBottom - otherRect.bottom) < this.snapDistance) {
          newH = otherRect.bottom - rect.top;
          this.guideY = otherRect.bottom;
          snappedY = true;
        }
        // Check if resized rect's center aligns with other's center
        else if (Math.abs((rect.top + newH / 2) - otherRect.centerY) < this.snapDistance) {
          newH = (otherRect.centerY - rect.top) * 2;
          this.guideY = otherRect.centerY;
          snappedY = true;
        }
      }

      // Early exit if both dimensions are snapped
      if (snappedX && snappedY) break;
    }

    // Check fixed verticals for newRight (only if not already snapped)
    if (!snappedX) {
      for (let fx of this.getFixedVerticals()) {
        if (Math.abs(newRight - fx) < this.snapDistance) {
          newW = fx - rect.left;
          this.guideX = fx;
          break;
        }
      }
    }

    // Check fixed horizontals for newBottom (only if not already snapped)
    if (!snappedY) {
      for (let fy of this.getFixedHorizontals()) {
        if (Math.abs(newBottom - fy) < this.snapDistance) {
          newH = fy - rect.top;
          this.guideY = fy;
          break;
        }
      }
    }

    newW = Math.max(50, newW);
    newH = Math.max(50, newH);
    return { newW, newH };
  }
}

customElements.define('snapping-guides', SnappingGuides);
