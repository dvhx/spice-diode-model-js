// Main
"use strict";
// globals: document, window, CA

var SC = window.SC || {};

SC.steps = 50; // Number of points in model curve

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
    var i = 0, v = 0, va, r = [], a, b, dx, dy, q;

    do {
        i++;
        if (i > 1000) {
            console.error('Too many points');
            break;
        }
        va = SC.diodeCurveOnePoint(v, aTemp, aIS, aN, aRS);
        v += aVMax / SC.steps;
        //console.log(v, va);
        r.push([va.voltage, va.current]);
    } while (va.voltage < aVMax);

    // make end exactly in aVMax (for simpler score calculation)
    a = r[r.length - 2];
    b = r[r.length - 1];
    if (a[0] < aVMax && b[0] > aVMax) {
        dx = b[0] - a[0];
        dy = b[1] - a[1];
        //console.log({a, b, aVMax, dx, dy});
        b[0] = aVMax;
        q = (aVMax - a[0]) / dx;
        b[1] = a[1] + q * dy;
    }
    return r;
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
    SC.e.spice.textContent = '.model NAME D(IS=' + SC.model.IS.toPrecision(6) + ' N=' + SC.model.N.toPrecision(6) + ' RS=' + SC.model.RS.toPrecision(6) + ')';
};

SC.scoreModelEndDistance = function (aModelVA, aMeasuredVA, aDebug) {
    // measure score only as a distance of ends
    if (!aModelVA || !aMeasuredVA) {
        return 999;
    }
    var s, last_model_voltage, last_measured_voltage, last_model_current, last_measured_current, dv, di;
    s = 0;

    // it is important for model to end near measurements end, so worsen score
    // if ends are too far apart, otherwise it would create models that have
    // perfect match but only on small segment, but also don't emphasize ends
    // too much otherwise it will only care about ends being close together and
    // will ignore shape
    last_model_voltage = aModelVA[aModelVA.length - 1][0];
    last_measured_voltage = aMeasuredVA[aMeasuredVA.length - 1][0];
    last_model_current = aModelVA[aModelVA.length - 1][1];
    last_measured_current = aMeasuredVA[aMeasuredVA.length - 1][1];
    dv = last_model_voltage - last_measured_voltage;
    di = 1000 * (last_model_current - last_measured_current);
    if (aDebug) {
        console.log(di, dv);
    }
    s += Math.sqrt(dv * dv + di * di);
    return s;
};

SC.bestFit = function () {
    // Just match ends for now (gradient descent was too slow)
    var i;
    for (i = 0; i < 100; i++) {
        SC.matchEnds(1);
    }
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

SC.matchEnds = function (aSpeed) {
    // change IS,N to move end closer to measured end
    // Note: You can change sharpness of curve while preserving ends by changing
    // any of the 2 of 3 parameters and keep the remaining 3rd parameter constant.
    // Because Rs is closest to anything "real", I decided to change IS and N so
    // that Rs remains reasonable. You can comment out IS and change N and RS but
    // then Rs would have weird values, like 30ohm, or 12 pico ohm.
    aSpeed = aSpeed || 1;
    var d = SC.scoreModelEndDistance(SC.modelVA, SC.measuredVA),
        s,
        vmax = SC.measuredVA[SC.measuredVA.length - 1][0],
        temp = SC.fromEng(SC.e.temperature.value),
        speedIS = 1 + 0.01 * aSpeed,
        speedN = 1 + 0.1 * aSpeed,
        va;

    // N up
    va = SC.diodeCurve(vmax, temp, SC.model.IS, SC.model.N * speedN, SC.model.RS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.N *= speedN;
        SC.modelVA = va;
        d = s;
        //console.log('1 d', d, 'N', SC.model.N);
    }
    // N down
    va = SC.diodeCurve(vmax, temp, SC.model.IS, SC.model.N / speedN, SC.model.RS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.N /= speedN;
        SC.modelVA = va;
        d = s;
        //console.log('2 d', d, 'N', SC.model.N);
    }
    // IS up
    va = SC.diodeCurve(vmax, temp, SC.model.IS * speedIS, SC.model.N, SC.model.RS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.IS *= speedIS;
        SC.modelVA = va;
        d = s;
        //console.log('3 d', d, 'IS', SC.model.IS);
    }
    // IS down
    va = SC.diodeCurve(vmax, temp, SC.model.IS / speedIS, SC.model.N, SC.model.RS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.IS /= speedIS;
        SC.modelVA = va;
        d = s;
    }
    /*
    // RS left
    va = SC.diodeCurve(vmax, temp, SC.model.IS, SC.model.N, SC.model.RS * speedRS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.RS *= speedRS;
        SC.modelVA = va;
        d = s;
    }
    // RS right
    va = SC.diodeCurve(vmax, temp, SC.model.IS, SC.model.N, SC.model.RS / speedRS);
    s = SC.scoreModelEndDistance(va, SC.measuredVA);
    if (s < d) {
        SC.model.RS /= speedRS;
        SC.modelVA = va;
        d = s;
    }
    */
    SC.e.N.value = SC.model.N.toPrecision(8);
    SC.e.IS.value = SC.model.IS.toPrecision(8);
    SC.e.RS.value = SC.model.RS.toPrecision(8);
    SC.chart1.series[1].data = SC.modelVA;
    SC.updateModel();
};

SC.onSharper = function () {
    // Make curve's knee sharper
    SC.model.N /= 1.01;
    SC.e.N.value = SC.model.N.toPrecision(8);
    var i;
    for (i = 0; i < 100; i++) {
        SC.matchEnds(1);
    }
};

SC.onDuller = function () {
    // Make curve's knee duller (less sharp)
    SC.model.N *= 1.01;
    SC.e.N.value = SC.model.N.toPrecision(8);
    var i;
    for (i = 0; i < 100; i++) {
        SC.matchEnds(1);
    }
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

window.addEventListener('DOMContentLoaded', function () {
    SC.e = CA.elements('preset_real', 'measured_values', 'zoom_to_fit', 'preset_model',
        'temperature',
        'IS', 'N', 'RS',
        'best_fit', 'spice', 'sharper', 'duller');

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
        SC.e.IS.value = o.IS;
        SC.e.N.value = o.N;
        SC.e.RS.value = o.RS;
        SC.updateModel();
    };

    // best fit/sharper/duller
    SC.e.best_fit.onclick = SC.bestFit;
    SC.e.sharper.onclick = SC.onSharper;
    SC.e.duller.onclick = SC.onDuller;
});
