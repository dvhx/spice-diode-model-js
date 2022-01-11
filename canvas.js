// Canvas v4180
"use strict";
// Various utility functions for canvas
// globals: document, window
// provide: arrayToObject, deg, rad, distance, parseFloat, randomFloat, randomInt, unused

var CA = window.CA || {};

CA.randomFloat = function (aMin, aMax) {
    // Random float from given range, including extremes
    return Math.random() * (aMax - aMin) + aMin;
};

CA.elements = function () {
    // Get multiple elements by id
    var i, o = {};
    for (i = 0; i < arguments.length; i++) {
        o[arguments[i]] = document.getElementById(arguments[i]);
        if (!o[arguments[i]]) {
            console.warn('CA.elements not found ' + arguments[i]);
        }
    }
    return o;
};

// Canvas prototype
// globals: document, window, CanvasRenderingContext2D

var CA = window.CA || {};

// polyfill
if (window.CanvasRenderingContext2D.prototype.resetTransform === undefined) {
    window.CanvasRenderingContext2D.prototype.resetTransform = function () {
        this.setTransform(1, 0, 0, 1, 0, 0);
    };
}

CA.Canvas = function (aElementOrId, aWidth, aHeight, aStretch) {
    // Create canvas and context, handle resize
    var t = this;
    if (aElementOrId) {
        // auto-resized on-screen canvas
        t.canvas = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId;
        if (!t.canvas) {
            throw "CA.Canvas cannot find element " + aElementOrId;
        }
        window.addEventListener('resize', function () {
            t.resize();
        });
        window.addEventListener('DOMContentLoaded', function () {
            t.resize();
        });
        // stretch to parent flex
        if (aStretch) {
            // parent must be relative
            if (window.getComputedStyle(t.canvas.parentElement, 'position').position !== 'relative') {
                console.error('Parent of stretched canvas ' + aElementOrId + ' must have position: relative');
            }
            // canvas must be absolute
            if (window.getComputedStyle(t.canvas, 'position').position !== 'absolute') {
                console.error('Stretched canvas ' + aElementOrId + ' must have position: absolute');
            }
            t.canvas.style.minWidth = '1px';
            t.canvas.style.minHeight = '1px';
            t.canvas.style.flex = 1;
            t.canvas.style.width = '100%';
            t.canvas.style.height = '100%';
        }
        t.resize();
    } else {
        // fixed-size off-screen canvas
        t.canvas = document.createElement('canvas');
        t.resize(aWidth, aHeight);
    }
    t.context = t.canvas.getContext('2d');
    t.canvas.context = t.context;
};

CA.Canvas.prototype.resize = function (aWidth, aHeight) {
    // Change canvas resolution to it's natural size
    //console.log('par', aWidth, aHeight, 'can', this.canvas.width, this.canvas.height, 'clientwh', this.canvas.clientWidth, this.canvas.clientHeight);
    this.width = aWidth || this.canvas.clientWidth;
    this.height = aHeight || this.canvas.clientHeight;
    this.w = this.width;
    this.h = this.height;
    this.w2 = this.width / 2;
    this.h2 = this.height / 2;
    var old = this.canvas.getContext('2d').imageSmoothingEnabled;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.getContext('2d').imageSmoothingEnabled = old;
    if (this.render) {
        this.render();
    }
};

CA.Canvas.prototype.clear = function (aColor) {
    // Clear canvas or fill it with color
    if (aColor) {
        this.context.globalAlpha = 1;
        this.context.globalCompositeOperation = 'source-over';
        this.context.fillStyle = aColor;
        this.context.fillRect(0, 0, this.w, this.h);
        this.context.fillStyle = 'black';
    } else {
        this.context.clearRect(0, 0, this.w, this.h);
    }
};

CA.Canvas.prototype.line = function (aX1, aY1, aX2, aY2, aStrokeStyle, aWidth) {
    // Draw a line
    this.context.strokeStyle = aStrokeStyle || 'red';
    this.context.lineWidth = aWidth || 1;
    this.context.beginPath();
    this.context.moveTo(aX1, aY1);
    this.context.lineTo(aX2, aY2);
    this.context.closePath();
    this.context.stroke();
};

// Distance from point to line segment
"use strict";
// globals: document, window
// provide: distancePointLineSegment, distancePointLine

var CA = window.CA || {};

CA.distancePointLineSegment = function (x, y, x1, y1, x2, y2) {
    // Return distance from point to line segment
    var A, B, C, D, dot, len_sq, param, xx, yy, dx, dy;
    A = x - x1;
    B = y - y1;
    C = x2 - x1;
    D = y2 - y1;
    dot = A * C + B * D;
    len_sq = C * C + D * D;
    param = -1;
    if (len_sq !== 0) {
        param = dot / len_sq;
    }
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    dx = x - xx;
    dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
};

CA.distancePointLine = function (x, y, aPoints) {
    // Return distance from point to line defined by points [[x1,y1], [x2,y2], ..., [xn, yn]]
    var i, x1, y1, x2, y2, d, m = Number.MAX_VALUE;
    for (i = 0; i < aPoints.length - 1; i++) {
        x1 = aPoints[i][0];
        y1 = aPoints[i][1];
        x2 = aPoints[i + 1][0];
        y2 = aPoints[i + 1][1];
        d = CA.distancePointLineSegment(x, y, x1, y1, x2, y2);
        if (d < m) {
            m = d;
        }
    }
    return m;
};

// Multi-segment linear interpolation
"use strict";
// globals: document, window
// provide: lerp

var CA = window.CA || {};

CA.Lerp = function (aValues) {
    // Lerp constructor
    this.values = aValues; //JSON.parse(JSON.stringify(aValues));
};

CA.Lerp.prototype.add = function (aX, aY) {
    // Return new lerp with one added point
    var i, n = this.dup();
    for (i = 0; i < n.values.length; i++) {
        if (n.values[i][0] > aX) {
            n.values.splice(i, 0, [aX, aY]);
            return n;
        }
    }
    n.values.push([aX, aY]);
    return n;
};

CA.Lerp.prototype.get = function (aValue) {
    // Return linear interpolation for given value
    var i, x1, y1, x2, y2, aShape = this.values;
    if (aValue < aShape[0][0]) {
        return aShape[0][1];
    }
    for (i = 0; i < aShape.length - 1; i++) {
        if (aValue >= aShape[i][0] && aValue < aShape[i + 1][0]) {
            x1 = aShape[i][0];
            y1 = aShape[i][1];
            x2 = aShape[i + 1][0];
            y2 = aShape[i + 1][1];
            return ((aValue - x1) / (x2 - x1)) * (y2 - y1) + y1;
        }
    }
    return aShape.slice(-1)[0][1]; // slice is shallow, no problem because returning number
};

CA.Lerp.prototype.inverse = function () {
    // Find inverse value for lerp, works only for monotonous lerps
    var i, transpose = [];
    for (i = 0; i < this.values.length; i++) {
        transpose.push([this.values[i][1], this.values[i][0]]);
    }
    return new CA.Lerp(transpose);
};

CA.Lerp.prototype.constraints = function () {
    // Find min/max of lerp x,y
    var i,
        aLerp = this.values,
        o = {
            minx: Number.MAX_VALUE,
            miny: Number.MAX_VALUE,
            maxx: -Number.MAX_VALUE,
            maxy: -Number.MAX_VALUE
        };
    for (i = 0; i < aLerp.length; i++) {
        o.minx = Math.min(o.minx, aLerp[i][0]);
        o.miny = Math.min(o.miny, aLerp[i][1]);
        o.maxx = Math.max(o.maxx, aLerp[i][0]);
        o.maxy = Math.max(o.maxy, aLerp[i][1]);
    }
    return o;
};

