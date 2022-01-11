// Multiple XY Chart in one, data : [[0, 10, 0], [1, 5, 1], [1, 0, 2]]
"use strict";
// globals: document, window, SC, CA

var SC = window.SC || {};

SC.showChartCursor = true;

SC.palette = ['#ff0000', '#00ff00', '#0077ff', '#ffff00', '#ff00ff', '#00ffff'];

SC.ChartXYXY = function (aCanvasOrId) {
    //var pan, p1, p2, t = this, rec;
    var t = this, pan, rec, p1, p2;
    this.logY = false;
    this.series = [];
    this.constraints = {minx: 0, maxx: 0, miny: 0, maxy: 0};
    this.dots = false;
    this.frames = 0;
    this.canvas = new CA.Canvas(aCanvasOrId);
    this.canvas.line(0, 0, this.canvas.w, this.canvas.h);
    //this.canvas.canvas.style.backgroundColor = 'black';
    this.gridX = 0.1;
    this.gridY = 0.001;
    this.colors = SC.palette;
    this.cursor = {x: -999, y: -999};
    this.render();


    // zoom
    this.canvas.canvas.addEventListener('wheel', function (event) {
        event.preventDefault();
        if (!t.series) {
            return;
        }
        var d;
        // y (shift)
        if (!event.altKey) {
            d = t.maxy - t.miny;
            if (event.deltaY < 0) {
                t.maxy -= 0.1 * d;
                t.miny += 0.1 * d;
            }
            if (event.deltaY > 0) {
                t.maxy += 0.1 * d;
                t.miny -= 0.1 * d;
            }
        }
        // x (alt)
        if (!event.shiftKey) {
            d = t.maxx - t.minx;
            if (event.deltaY < 0) {
                t.maxx -= 0.1 * d;
                t.minx += 0.1 * d;
            }
            if (event.deltaY > 0) {
                t.maxx += 0.1 * d;
                t.minx -= 0.1 * d;
            }
        }
        t.render();
        //console.log(event.deltaY);
    }, true);

    // pan
    this.canvas.canvas.addEventListener('mousedown', function (event) {
        if (!t.series) {
            return;
        }
        if (event.which === 2) {
            pan = true;
            rec = t.canvas.canvas.getBoundingClientRect();
            p1 = t.canvasToReal(event.clientX - rec.x, event.clientY - rec.y);
            console.log('pan', p1);
        }
    });
    window.addEventListener('mousemove', function (event) {
        if (!t.series) {
            return;
        }
        if (event.target !== t.canvas.canvas) {
            return;
        }
        rec = t.canvas.canvas.getBoundingClientRect();
        p2 = t.canvasToReal(event.clientX - rec.x, event.clientY - rec.y);
        //console.log('p2', p2, event.offsetY);
        t.old_cursor = t.cursor;
        t.cursor = p2;
        if (pan) {
            //console.log('pan move', p2);
            t.minx -= p2.x - p1.x;
            t.maxx -= p2.x - p1.x;
            if (t.logY) {
                t.miny -= Math.log10(p2.y) - Math.log10(p1.y);
                t.maxy -= Math.log10(p2.y) - Math.log10(p1.y);
            } else {
                t.miny -= p2.y - p1.y;
                t.maxy -= p2.y - p1.y;
            }
            //p1 = p2;
            t.render();
        } else {
            if (t.cursor && t.old_cursor && (t.cursor.x !== t.old_cursor.x || t.cursor.y !== t.old_cursor.y)) {
                t.render();
            }
        }
    });
    window.addEventListener('mouseup', function () {
        //console.log('pan end');
        pan = false;
    });
    window.addEventListener('mouseout', function () {
        t.cursor = null;
        t.render();
    });
    window.addEventListener('resize', function () { t.render(); });
    window.addEventListener('contextmenu', function () {
        t.cursor = null;
        t.render();
    });
};

SC.ChartXYXY.prototype.updateConstraints = function () {
    // update constraints
    var s, i, x, y, d;
    this.constraints = {minx: 0, maxx: 0, miny: Number.MAX_VALUE, maxy: -Number.MAX_VALUE};
    for (s = 0; s < this.series.length; s++) {
        d = this.series[s].data;
        for (i = 1; i < d.length; i++) {
            x = d[i][0];
            y = this.logY ? Math.log10(d[i][1]) : d[i][1];
            this.constraints.minx = Math.min(this.constraints.minx, x);
            this.constraints.maxx = Math.max(this.constraints.maxx, x);
            this.constraints.miny = Math.min(this.constraints.miny, y);
            this.constraints.maxy = Math.max(this.constraints.maxy, y);
        }
    }
};

SC.ChartXYXY.prototype.addSeries = function (aName, aColor, aData) {
    // update constraints
    var i, x, y;
    for (i = 1; i < aData.length; i++) {
        x = aData[i][0];
        y = aData[i][1];
        this.constraints.minx = Math.min(this.constraints.minx, x);
        this.constraints.maxx = Math.max(this.constraints.maxx, x);
        this.constraints.miny = Math.min(this.constraints.miny, y);
        this.constraints.maxy = Math.max(this.constraints.maxy, y);
    }
    // add to series
    this.series.push({
        name: aName,
        data: aData,
        color: aColor || SC.palette[this.series.length % SC.palette.length]
    });
    this.resetZoomAndPan();
};

SC.ChartXYXY.prototype.resetZoomAndPan = function () {
    this.updateConstraints();
    var bx = (this.logY ? 0.08 : 0.04) * (this.constraints.maxx - this.constraints.minx),
        by = 0.04 * (this.constraints.maxy - this.constraints.miny);
    this.minx = this.constraints.minx - bx;
    this.miny = this.constraints.miny - by;
    this.maxx = this.constraints.maxx + bx;
    this.maxy = this.constraints.maxy + by;
    this.render();
};

SC.ChartXYXY.prototype.realToCanvas = function (aX, aY, aRoundTo05) {
    // convert real coordinates to canvas coordinates
    var w = this.canvas.width,
        h = this.canvas.height,
        x = w * (aX - this.minx) / (this.maxx - this.minx),
        ly = this.logY ? Math.log10(aY) : aY,
        y = h - h * (ly - this.miny) / (this.maxy - this.miny);
    if (aRoundTo05) {
        x = Math.floor(x) + 0.5;
        y = Math.floor(y) + 0.5;
    }
    return {
        x: x,
        y: y
    };
};

SC.ChartXYXY.prototype.canvasToReal = function (aX, aY) {
    // convert canvas coordinates to real coordinates
    var w = this.canvas.width,
        h = this.canvas.height,
        x = aX * (this.maxx - this.minx) / w + this.minx,
        y = (h - aY) * (this.maxy - this.miny) / h + this.miny;
    if (this.logY) {
        return {
            x: x,
            y: Math.pow(10, y)
        };
    }
    return {
        x: x,
        y: y
    };
};

SC.ChartXYXY.prototype.render = function () {
    // Render chart
    this.frames++;
    var i, s, ser, sd, x, y, p, a, b, x0, y0, m, strx, stry, ofs, ly;
    this.canvas.clear('white');
    if (!this.series) {
        return;
    }

    // zero cross
    p = this.realToCanvas(0, 0, true);
    this.canvas.line(0, p.y, this.canvas.width, p.y, '#ff00ff33', 1);
    this.canvas.line(p.x, 0, p.x, this.canvas.height, '#ff00ff33', 1);

    // axes
    this.canvas.context.font = '10px sans-serif';
    this.canvas.context.fillStyle = 'black';
    this.canvas.context.textAlign = 'right';
    this.canvas.context.textBaseline = 'bottom';
    this.canvas.context.fillText('U(V)', this.canvas.width, p.y - 2);
    this.canvas.context.textAlign = 'left';
    this.canvas.context.textBaseline = 'top';
    this.canvas.context.fillText(this.logY ? 'I(A)' : 'I(mA)', p.x + 2, 2);

    // zero
    this.canvas.context.textAlign = 'right';
    this.canvas.context.textBaseline = 'top';
    this.canvas.context.fillText('0', p.x - 2, p.y + 2);

    // custom grid
    a = this.canvasToReal(0, 0);
    b = this.canvasToReal(this.canvas.width, this.canvas.height);
    x0 = a.x - a.x % this.gridX;
    y0 = b.y - b.y % this.gridY;
    this.canvas.context.textAlign = 'center';
    this.canvas.context.textBaseline = 'top';
    if ((b.x - x0) / this.gridX < 500) {
        for (x = x0; x < b.x; x += this.gridX) {
            p = this.realToCanvas(x, 0, true);
            if (x > 0) {
                this.canvas.line(p.x, 0, p.x, p.y, '#00000022', 1);
                this.canvas.context.fillText(x.toFixed(1), p.x + 1, p.y + 2);
            }
        }
    }

    // y-axis
    this.canvas.context.textAlign = 'right';
    this.canvas.context.textBaseline = 'middle';
    if (this.logY) {
        ly = {
            '10A': 10,
            '1A': 1,
            '100mA': 0.1,
            '10mA': 0.01,
            '1mA': 0.001,
            '100uA': 0.0001,
            '10uA': 0.00001,
            '1uA': 0.000001,
            '100nA': 0.0000001,
            '10nA': 0.00000001,
            '1nA': 0.000000001,
            '100pA': 0.0000000001,
            '10pA': 0.00000000001,
            '1pA': 0.000000000001,
        };
        for (y in ly) {
            if (ly.hasOwnProperty(y)) {
                p = this.realToCanvas(0, ly[y], true);
                this.canvas.line(p.x, p.y, this.canvas.width, p.y, '#00000022', 1);
                this.canvas.context.fillText(y, p.x - 1, p.y);
            }
        }
    } else {
        //console.log({ay: a.y, y0: y0, gridY: this.gridY});
        if ((a.y - y0) / this.gridY < 500) {
            for (y = y0; y < a.y; y += this.gridY) {
                p = this.realToCanvas(0, y, true);
                if (y > 0) {
                    this.canvas.line(p.x, p.y, this.canvas.width, p.y, '#00000022', 1);
                    this.canvas.context.fillText((1000 * y).toFixed(0), p.x - 1, p.y);
                }
            }
        }
    }

    this.canvas.context.textBaseline = 'alphabetic';

    // all series
    for (s = 0; s < this.series.length; s++) {
        ser = this.series[s];
        this.canvas.context.lineWidth = 2;
        this.canvas.context.strokeStyle = ser.color;
        this.canvas.context.fillStyle = ser.color;
        this.canvas.context.beginPath();
        sd = ser.data;
        for (i = 0; i < sd.length; i++) {
            x = sd[i][0];
            y = sd[i][1];
            p = this.realToCanvas(x, y);
            if (i === 0) {
                this.canvas.context.moveTo(p.x, p.y);
            } else {
                this.canvas.context.lineTo(p.x, p.y);
            }
        }
        this.canvas.context.stroke();
        // dots
        if (this.dots) {
            for (i = 0; i < sd.length; i++) {
                x = sd[i][0];
                y = sd[i][1];
                p = this.realToCanvas(x, y);
                this.canvas.context.fillRect(p.x - 3, p.y - 3, 6, 6);
            }
        }
    }
    this.canvas.context.lineWidth = 1;

    // cursor
    if (SC.showChartCursor && this.cursor) {
        p = this.realToCanvas(this.cursor.x, this.cursor.y);
        p.x = Math.floor(p.x) + 0.5;
        p.y = Math.floor(p.y) + 0.5;
        if (this.logY || (this.cursor.y >= this.miny && this.cursor.y <= this.maxy)) {
            this.canvas.context.strokeStyle = 'black';
            // horizontal
            this.canvas.context.beginPath();
            this.canvas.context.moveTo(0, p.y);
            this.canvas.context.lineTo(this.canvas.width, p.y);
            this.canvas.context.stroke();
            // vertical
            this.canvas.context.beginPath();
            this.canvas.context.moveTo(p.x, 0);
            this.canvas.context.lineTo(p.x, this.canvas.height);
            this.canvas.context.stroke();
            // text
            // vertical
            ofs = 25;
            stry = SC.toEng(this.cursor.y) + 'A';
            this.canvas.context.fillStyle = 'white';
            m = this.canvas.context.measureText(stry);
            this.canvas.context.fillRect(p.x - ofs - m.width - 2, p.y - 5 - 2, m.width + 4, 10 + 2);
            this.canvas.context.strokeRect(p.x - ofs - m.width - 2, p.y - 5 - 2, m.width + 4, 10 + 2);
            this.canvas.context.textAlign = 'right';
            this.canvas.context.textBaseline = 'middle';
            this.canvas.context.fillStyle = 'black';
            this.canvas.context.fillText(stry, p.x - ofs, p.y);
            // horizontal
            ofs = 20;
            strx = SC.toEng(this.cursor.x) + 'V';
            m = this.canvas.context.measureText(strx);
            this.canvas.context.fillStyle = 'white';
            this.canvas.context.fillRect(p.x - m.width / 2 - 2, p.y - ofs - 10, m.width + 4, 10 + 2);
            this.canvas.context.strokeRect(p.x - m.width / 2 - 2, p.y - ofs - 10, m.width + 4, 10 + 2);
            this.canvas.context.textAlign = 'center';
            this.canvas.context.textBaseline = 'bottom';
            this.canvas.context.fillStyle = 'black';
            this.canvas.context.fillText(strx, p.x, p.y - ofs + 2);
        }
    }
};

