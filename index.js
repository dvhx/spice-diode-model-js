// Main
"use strict";
// globals: document, window, CA

var SC = window.SC || {};

SC.steps = 50; // Number of points in model curve
SC.optimizeForAvg = true; // radio buttons avg/max difference scoring
SC.aggressiveScoring = false; // makes difference above 20% have weight double

SC.diodeCurveOnePoint = function (aVoltage, aTemperature, aIS, aN, aRS) {
    // Calculate voltage and current for a diode the same way as ngspice
    var k, q, e, TZ, VD, T0, IS, N, T, VT, ID;

    // physical constants
    k = 1.380649e-23; //(J/K) boltzman constant
    q = 1.602176634e-19; // (C Coulomb) elementary charge constant
    e = 2.718281828459045; // euler number 2.718
    TZ = -273.15; // Absolute zero in kelvins

    // measured inputs
    VD = aVoltage; // measured voltage on diode, input parameter
    T0 = aTemperature; // ambient temperature in degrees C

    // diode model parameters
    IS = aIS; // Saturation current parameter
    N = aN; // Emission coefficient, model parameter

    // calculate diode current
    T = T0 - TZ; // absolute temperature (K, 25C = 298.15K)
    VT = k * T / q; // Thermal voltage
    ID = IS * (Math.pow(e, VD / (N * VT)) - 1); // Diode current

    return {
        voltage: VD + ID * aRS,
        current: ID
    };
};

SC.diodeCurve = function (aVMax, aTemp, aIS, aN, aRS) {
    // calculate VA curve in given range from model params IS N RS
    var i = 0, vmin, v, va, r = [], a, b, dx, dy, q;

    // starts from same spot as measured curve to not waste points where there are no measurements, e.g. LED
    vmin = 0.95 * SC.measuredVA[0][0];
    if (vmin > aVMax - 0.1) {
        vmin = aVMax - 0.1;
    }
    v = vmin;

    // points
    do {
        i++;
        if (i > 1000) {
            console.error('Too many points');
            break;
        }
        va = SC.diodeCurveOnePoint(v, aTemp, aIS, aN, aRS);
        v += (aVMax - vmin) / SC.steps;
        r.push([va.voltage, va.current]);
    } while (va.voltage < aVMax);

    // make end exactly in aVMax
    a = r[r.length - 2];
    b = r[r.length - 1];
    if (a && b && (a[0] < aVMax) && (b[0] > aVMax)) {
        dx = b[0] - a[0];
        dy = b[1] - a[1];
        b[0] = aVMax;
        q = (aVMax - a[0]) / dx;
        b[1] = a[1] + q * dy;
    }

    // drop modelVA data below lowest measured current to fit chart better
    if (SC.measuredVA) {
        for (i = r.length - 1; i > 0; i--) {
            if (r[i][1] < SC.measuredVA[0][1]) {
                r = r.slice(i - 1); // slice is shallow
                break;
            }
        }
    }

    return r;
};

SC.showSpiceModel = function () {
    // Show spice and js model at the bottom of the page
    var name = SC.e.preset_real.value + (SC.e.optimize_for_max.checked ? '_2' : '');
    SC.e.spice.textContent = '.model ' + name + ' D(IS=' + SC.model.IS.toPrecision(6) + ' N=' + SC.model.N.toPrecision(6) + ' RS=' + SC.model.RS.toPrecision(6) + ')';
    SC.e.js_code.textContent = '"' + name + '": {IS: ' + SC.model.IS.toPrecision(6) + ', N: ' + SC.model.N.toPrecision(6) + ', RS: ' + SC.model.RS.toPrecision(6) + '},';
};

SC.updateModel = function () {
    // Read input values and render new model curve
    SC.model = {
        IS: SC.fromEng(SC.e.IS.value),
        N: SC.fromEng(SC.e.N.value),
        RS: SC.fromEng(SC.e.RS.value)
    };
    var vmax = SC.measuredVA[SC.measuredVA.length - 1][0],
        temp = SC.fromEng(SC.e.temperature.value);

    SC.modelVA = SC.diodeCurve(vmax, temp, SC.model.IS, SC.model.N, SC.model.RS);

    if (SC.chart1.series[1]) {
        SC.chart1.series[1].data = SC.modelVA;
    }
    SC.chart1.render();
    SC.showDifference();
    SC.showSpiceModel();
};

SC.onWheelNumberInputMultiply = function (event) {
    // wheel up increases value a bit, wheel down decreases
    var step = parseFloat(event.target.getAttribute('dataWheelStep'));
    event.preventDefault();
    event.target.value = (parseFloat(event.target.value) * (event.wheelDeltaY > 0 ? (1 + step) : (1 - step))).toPrecision(8);
    SC.updateModel();
};

SC.onWheelNumberInputAdd = function (event) {
    // wheel up increases value a bit, wheel down decreases
    var step = parseFloat(event.target.getAttribute('dataWheelStep'));
    event.preventDefault();
    event.target.value = (parseFloat(event.target.value) + (event.wheelDeltaY > 0 ? step : -step)).toFixed(0);
    SC.updateModel();
};

SC.onChangeMeasuredValues = function () {
    // convert csv to array of array of numbers
    var ui = SC.e.measured_values.value.trim().split('\n').map(function (a) {
        return a.trim().split(',').map(parseFloat);
    });
    SC.measuredVA = ui;
    SC.chart1.series[0].data = ui;
    SC.chart1.render();
};

SC.onChangePresetReal = function () {
    // When user change preset, show values and update chart
    SC.e.measured_values.value = SC.realDiode[SC.e.preset_real.value].join('\n');
    SC.onChangeMeasuredValues();
    SC.updateModel();
};

SC.addSelectOptions = function (aSelect, aObject) {
    // Add <options> to <select>
    var a = Object.keys(aObject).sort(), i, o;
    for (i = 0; i < a.length; i++) {
        o = document.createElement('option');
        o.textContent = a[i];
        aSelect.appendChild(o);
    }
};

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

SC.lastDifferenceTime = 0;

SC.showDifference = function () {
    // Show difference table but no faster than every 100ms
    var t = Date.now(), i, r, points;
    if (t - SC.lastDifferenceTime < 100) {
        window.setTimeout(SC.showDifference, 200);
        return;
    }
    r = SC.calculateDifference(SC.modelVA, SC.measuredVA);
    points = r.points;
    for (i = 0; i < points.length; i++) {
        SC.e.diff_u_td[i].textContent = (1000 * points[i].v).toFixed(0);
        SC.e.diff_i_real_td[i].textContent = SC.toEng(points[i].ir); //(1000 * model.get(v)).toFixed(6);
        SC.e.diff_i_model_td[i].textContent = SC.toEng(points[i].im); //(1000 * model.get(v)).toFixed(6);
        SC.e.diff_percent_td[i].textContent = points[i].d > 1000 ? '>1000' : points[i].d.toFixed(1); //(1000 * model.get(v)).toFixed(6);
    }
    SC.e.diff_total.textContent = r.diff.toFixed(3) + '% (' + SC.monteCarloRuns + ' runs)';
    SC.e.js_diff.textContent = '// avg error ' + r.avg.toFixed(1) + '% max ' + r.max.toFixed(1) + '%';
    SC.lastDifferenceTime = t;
};

SC.onLogYClick = function () {
    // Switch between linear/logarithmic chart
    SC.chart1.logY = SC.e.logy.checked;
    SC.chart1.resetZoomAndPan();
};

SC.onOptimizeForClick = function () {
    // Switch mode of optimization
    SC.optimizeForAvg = SC.e.optimize_for_avg.checked;
    SC.showDifference();
};

window.addEventListener('DOMContentLoaded', function () {
    // init
    SC.e = CA.elements('preset_real', 'measured_values', 'zoom_to_fit', 'preset_model',
        'temperature', 'logy',
        'diff_u', 'diff_i_model', 'diff_i_real', 'diff_percent', 'diff_total',
        'IS', 'N', 'RS',
        'spice', 'js_code', 'js_diff',
        'start_monte_carlo', 'stop_monte_carlo',
        'optimize_for_max', 'optimize_for_avg');

    // log chart switch
    SC.e.logy.onclick = SC.onLogYClick;

    // optimize
    SC.e.optimize_for_avg.onclick = SC.onOptimizeForClick;
    SC.e.optimize_for_max.onclick = SC.onOptimizeForClick;
    SC.e.start_monte_carlo.onclick = SC.startMonteCarlo;
    SC.e.stop_monte_carlo.onclick = SC.stopMonteCarlo;

    // diff table
    SC.e.diff_u_td = SC.e.diff_u.getElementsByTagName('td');
    SC.e.diff_i_model_td = SC.e.diff_i_model.getElementsByTagName('td');
    SC.e.diff_i_real_td = SC.e.diff_i_real.getElementsByTagName('td');
    SC.e.diff_percent_td = SC.e.diff_percent.getElementsByTagName('td');

    // preset combo
    SC.addSelectOptions(SC.e.preset_real, SC.realDiode);
    SC.e.preset_real.value = '1N4007';

    // model combo
    SC.addSelectOptions(SC.e.preset_model, SC.diodeModel);

    // settings
    SC.e.temperature.oninput = SC.updateModel;
    SC.e.temperature.onwheel = SC.onWheelNumberInputAdd;

    // chart
    SC.chart1 = new SC.ChartXYXY('chart1');
    SC.chart1.addSeries('Real', 'red', [[0, 0], [0.7, 0.001]]);

    // zoom to fit
    SC.e.zoom_to_fit.onclick = function () {
        SC.chart1.resetZoomAndPan();
    };

    // measured values
    SC.e.measured_values.oninput = SC.onChangeMeasuredValues;
    SC.e.preset_real.onchange = SC.onChangePresetReal;
    SC.onChangePresetReal();

    // model params
    SC.e.IS.oninput = SC.updateModel;
    SC.e.N.oninput = SC.updateModel;
    SC.e.RS.oninput = SC.updateModel;

    // make mouse wheel moves value up/down
    SC.e.IS.onwheel = SC.onWheelNumberInputMultiply;
    SC.e.N.onwheel = SC.onWheelNumberInputMultiply;
    SC.e.RS.onwheel = SC.onWheelNumberInputMultiply;

    // make model
    SC.modelVA = [];
    SC.chart1.addSeries('Model', 'green', SC.modelVA);
    SC.updateModel();

    // preset model
    SC.e.preset_model.onchange = function () {
        var o = SC.diodeModel[SC.e.preset_model.value];
        if (o) {
            SC.e.IS.value = o.IS;
            SC.e.N.value = o.N;
            SC.e.RS.value = o.RS;
            SC.updateModel();
        }
    };

    // test
    /*
    SC.e.preset_real.value = 'LED_BLUE';
    SC.e.preset_real.onchange();
    SC.e.preset_model.value = 'LED_BLUE';
    SC.e.preset_model.onchange();
    SC.showDifference();
    SC.chart1.logY = true;
    SC.e.logy.checked = SC.chart1.logY;
    SC.chart1.resetZoomAndPan();
    */
});
