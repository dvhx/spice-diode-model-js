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

