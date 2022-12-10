// Main
"use strict";
// globals: document, window, CA

var SC = window.SC || {};

SC.calculateDifference = function (aModelVA, aMeasuredVA) {
    // Calculate difference between 2 curves
    var vmin = Math.max(aModelVA[0][0], aMeasuredVA[0][0]),
        vmax = Math.min(aModelVA[aModelVA.length - 1][0], aMeasuredVA[aMeasuredVA.length - 1][0]),
        i,
        model,
        real,
        im,
        ir,
        d,
        v,
        r = [],
        sumd = 0,
        maxd = 0;

    model = new CA.Lerp(aModelVA);
    real = new CA.Lerp(aMeasuredVA);

    for (i = 0; i < 10; i++) {
        v = vmin + i * (vmax - vmin) / 9;
        ir = real.get(v);
        im = model.get(v);
        d = Math.abs(100 * ((Math.max(ir, im) / Math.min(ir, im)) - 1));
        // count anything above 20% diff as twice as bad
        if (SC.aggressiveScoring) {
            if (d > 20) {
                d += (d - 20) * 2;
            }
        }
        if (d > maxd) {
            maxd = d;
        }
        sumd += d;
        r.push({
            v: v,
            ir: ir,
            im : im,
            d: d
        });
    }
    return {
        avg: sumd / 10,
        max: maxd,
        diff: SC.optimizeForAvg ? sumd : maxd,
        points: r
    };
};

SC.onLogYClick = function () {
    // Switch between linear/logarithmic chart
    SC.chart1.logY = SC.e.logy.checked;
    SC.chart1.resetZoomAndPan();
};

SC.onClickDiode = function (event) {
    // show/hide diode
    var i = event.target.dataIndex;
    //console.log(k, i, event.target.checked, SC.chart1.series[i].dataKey);
    SC.chart1.series[i].visible = event.target.checked;
    SC.chart1.render();
};

SC.onChangeMeasuredValues = function () {
    // convert csv to array of array of numbers
    var ui = SC.e.measured_values.value.trim().split('\n').map(function (a) {
        return a.trim().split(',').map(parseFloat);
    }).sort(function (a, b) { return a[0] - b[0]; });
    SC.measuredVA = ui;
    SC.chart1.series[SC.index].data = ui;
    SC.chart1.render();
};

SC.findSimilar = function (event) {
    // Find most similar diodes to measured data
    var k, d, candidate = [], i, palette;
    for (k in SC.all) {
        if (SC.all.hasOwnProperty(k)) {
            d = SC.calculateDifference(SC.all[k].values, SC.measuredVA);
            if (k.substr(0, 8) === 'resistor') {
                d = Number.MAX_VALUE;
            }
            candidate.push({k: k, avg: d.avg});
            //console.log(k, d);
        }
    }

    palette = ['green', 'blue', 'orange', 'lime'];
    if (event && event.target && (event.target.id === 'check_similar_10')) {
        palette = ['green', 'blue', 'orange', 'lime', '#000', '#333', '#555', '#888', '#aaa', '#ccc'];
    }

    candidate.sort(function (a, b) {
        return a.avg - b.avg;
    });
    //console.log(candidate);
    //chart_series = SC.chart1.series[SC.all[candidate[1].k].index];
    //chart_series.color = 'green';
    for (i = 0; i < candidate.length; i++) {
        k = candidate[i].k;
        SC.all[k].chb.checked = i < palette.length;
        SC.chart1.series[SC.all[k].index].visible = i < palette.length;
        SC.chart1.series[SC.all[k].index].color = 'gray';
        SC.all[k].lab.style.color = 'black';
        SC.all[k].score.textContent = '';
    }
    for (i = 0; i < palette.length; i++) {
        SC.chart1.series[SC.all[candidate[i].k].index].color = palette[i];
        SC.all[candidate[i].k].lab.style.color = palette[i];
        SC.all[candidate[i].k].score.textContent = ' #' + (i + 1);
    }
    SC.chart1.render();
};

SC.checkAll = function () {
    // check all
    var k;
    for (k in SC.all) {
        if (SC.all.hasOwnProperty(k)) {
            SC.chart1.series[SC.all[k].index].visible = true;
            SC.all[k].chb.checked = true;
        }
    }
    SC.chart1.render();
};

SC.checkNone = function () {
    // check none
    var k;
    for (k in SC.all) {
        if (SC.all.hasOwnProperty(k)) {
            SC.chart1.series[SC.all[k].index].visible = false;
            SC.all[k].chb.checked = false;
        }
    }
    SC.chart1.render();
};

SC.checkUnknown = function () {
    // check unknown
    SC.chart1.series[SC.index].visible = SC.e.unknown.checked;
    SC.chart1.render();
};

SC.onClear = function () {
    // Clear textarea
    SC.e.measured_values.value = '';
};

SC.onHoverLabel = function (event) {
    // Highlight hovered label
    var k = event.target.dataKey,
        i;
    // clear previous highlighting
    for (i = 0; i < SC.chart1.series.length; i++) {
        SC.chart1.series[i].highlight = false;
    }
    // highlight current
    SC.chart1.series[SC.all[k].index].highlight = true;
    SC.chart1.render();
};

SC.onClickCopy = function (event) {
    // Copy diode values to textarea
    //alert(event.target.dataKey);
    //console.log(SC.realDiode[event.target.dataKey]);
    SC.e.measured_values.value = SC.realDiode[event.target.dataKey].join('\n').replace(/ /g, '');
    SC.onChangeMeasuredValues();
    event.preventDefault();
    event.stopPropagation();
};

SC.compareDiodes = function (aNames) {
    // show only specified diode names
    var i, k, ser;
    // hide unknown
    SC.e.unknown.checked = false;
    SC.chart1.series[SC.index].visible = false;
    // hide all
    for (k in SC.all) {
        if (SC.all.hasOwnProperty(k)) {
            SC.all[k].chb.checked = false;
            SC.chart1.series[SC.all[k].chb.dataIndex].visible = false;
        }
    }
    // show named diodes
    for (i = 0; i < aNames.length; i++) {
        if (!SC.all[aNames[i]]) {
            alert('Diode not found: ' + aNames[i]);
            continue;
        }
        SC.all[aNames[i]].chb.checked = true;
        ser = SC.chart1.series[SC.all[aNames[i]].chb.dataIndex];
        ser.visible = true;
        ser.color = SC.paletteCompare[i] || ser.color;
        SC.all[aNames[i]].lab.style.color = ser.color;
    }
};

window.addEventListener('DOMContentLoaded', function () {
    // init
    SC.e = CA.elements('measured_values', 'zoom_to_fit', 'logy', 'diodes',
        'check_all', 'check_none', 'check_similar', 'check_similar_10', 'unknown', 'clear');


    SC.e.clear.onclick = SC.onClear;
    SC.e.unknown.onclick = SC.checkUnknown;
    SC.e.check_all.onclick = SC.checkAll;
    SC.e.check_none.onclick = SC.checkNone;
    SC.e.check_similar.onclick = SC.findSimilar;
    SC.e.check_similar_10.onclick = SC.findSimilar;

    // chart
    SC.chart1 = new SC.ChartXYXY('chart1');
    SC.e.zoom_to_fit.onclick = function () { SC.chart1.resetZoomAndPan(); };

    // log chart switch
    SC.e.logy.onclick = SC.onLogYClick;

    // add known diodes
    SC.all = {};
    var k, lab, chb, i, score, copy;
    for (k in SC.realDiode) {
        if (SC.realDiode.hasOwnProperty(k)) {
            i = SC.chart1.addSeries(k, 'gray', SC.realDiode[k]);
            SC.chart1.series[i].dataKey = k;
            // label
            lab = document.createElement('label');
            lab.dataKey = k;
            lab.onmouseover = SC.onHoverLabel;
            chb = document.createElement('input');
            chb.dataKey = k;
            chb.dataIndex = i;
            chb.type = 'checkbox';
            chb.checked = true;
            chb.onclick = SC.onClickDiode;
            lab.appendChild(chb);
            lab.appendChild(document.createTextNode(k));
            score = document.createElement('span');
            score.dataKey = k;
            score.textContent = '';
            lab.appendChild(score);

            copy = document.createElement('span');
            copy.title = 'Copy values to textarea field on the left (unknown diode) to find similar diodes';
            copy.textContent = '📋';
            copy.dataKey = k;
            copy.onclick = SC.onClickCopy;
            copy.style.cursor = 'copy';
            lab.appendChild(copy);


            SC.e.diodes.appendChild(lab);
            SC.all[k] = {
                index: i,
                key: k,
                chb: chb,
                lab: lab,
                score: score,
                values: SC.realDiode[k]
            };
        }
    }

    // add measurement
    SC.index = SC.chart1.addSeries('Real', 'red', [[0, 0.001], [0.5, 0.001], [0.7, 0.024]]);
    SC.e.measured_values.oninput = SC.onChangeMeasuredValues;
    SC.onChangeMeasuredValues();

    // workaround for flex and stretched canvas
    window.setTimeout(function () {
        SC.chart1.canvas.resize(SC.chart1.canvas.canvas.clientWidth, SC.chart1.canvas.canvas.clientHeight);
        SC.chart1.render();
    }, 300);
    window.requestAnimationFrame(function () {
        // hash = comma separated names to compare
        var s = document.location.search, d;
        if (s.substr(0, 9) === '?compare=') {
            SC.compareDiodes(s.substr(9).split(','));
            SC.chart1.canvas.resize(SC.chart1.canvas.canvas.clientWidth, SC.chart1.canvas.canvas.clientHeight);
            SC.chart1.resetZoomAndPan();
            return;
        }
        if (s.substr(0, 9) === '?similar=') {
            d = s.substr(9).split(',');
            if (!SC.all[d]) {
                alert('No such diode ' + d);
            } else {
                SC.e.unknown.checked = false;
                SC.chart1.series[SC.index].visible = false;
                SC.chart1.canvas.resize(SC.chart1.canvas.canvas.clientWidth, SC.chart1.canvas.canvas.clientHeight);
                SC.e.measured_values.value = SC.all[d].values.join('\n');
                SC.onChangeMeasuredValues();
                SC.findSimilar();
                SC.chart1.resetZoomAndPan();
            }
        }
        // find similar
        SC.chart1.canvas.resize(SC.chart1.canvas.canvas.clientWidth, SC.chart1.canvas.canvas.clientHeight);
        SC.chart1.render();
        SC.findSimilar();
    });
});
