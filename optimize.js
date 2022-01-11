// Optimize model using Monte Carlo method
"use strict";
// globals: document, window, CA

var SC = window.SC || {};

SC.monteCarloEnabled = false;
SC.monteCarloBest = 1e9;
SC.monteCarloRuns = 0;

SC.monteCarlo = function (aSpeedIS, aSpeedN, aSpeedRS) {
    // Randomly change model and keep it if the difference is smaller
    aSpeedIS = aSpeedIS || 0.1;
    aSpeedN = aSpeedN || 0.1;
    aSpeedRS = aSpeedRS || 0.1;
    var d1 = SC.calculateDifference(SC.modelVA, SC.measuredVA).diff,
        d2,
        IS,
        N,
        RS,
        nextVA,
        vmax = SC.measuredVA[SC.measuredVA.length - 1][0],
        temp = SC.fromEng(SC.e.temperature.value);

    // slightly change model
    IS = SC.model.IS * CA.randomFloat(1 - aSpeedIS, 1 + aSpeedIS);
    N = SC.model.N * CA.randomFloat(1 - aSpeedN, 1 + aSpeedN);
    RS = SC.model.RS * CA.randomFloat(1 - aSpeedRS, 1 + aSpeedRS);
    // create new curve and measure difference against measured
    nextVA = SC.diodeCurve(vmax, temp, IS, N, RS);
    d2 = SC.calculateDifference(nextVA, SC.measuredVA).diff;
    // if model is better keep it
    if (d2 < d1) {
        SC.model.IS = IS;
        SC.model.N = N;
        SC.model.RS = RS;
        SC.modelVA = nextVA;
        if (SC.chart1.series[1]) {
            SC.chart1.series[1].data = SC.modelVA;
        }
        SC.chart1.render();
        SC.showDifference();
        SC.e.IS.value = IS.toPrecision(8);
        SC.e.N.value = N.toPrecision(8);
        SC.e.RS.value = RS.toPrecision(8);
        SC.showSpiceModel();
        return d2;
    }
};

SC.monteCarloBatch = function (aSpeedIS, aSpeedN, aSpeedRS) {
    // Run it 1000 times, repeat which optimize is running
    var i, d;
    for (i = 0; i < 1000; i++) {
        SC.monteCarloRuns++;
        // first 100k be more random
        if (SC.monteCarloRuns < 99000) {
            d = SC.monteCarlo(30 * aSpeedIS, 30 * aSpeedN, 30 * aSpeedRS);
        } else {
            d = SC.monteCarlo(aSpeedIS, aSpeedN, aSpeedRS);
        }
        if (d < SC.monteCarloBest) {
            SC.monteCarloBest = d;
        }
    }
    if (SC.monteCarloEnabled) {
        window.requestAnimationFrame(function () {
            SC.monteCarloBatch(aSpeedIS, aSpeedN, aSpeedRS);
        });
    }
};

SC.startMonteCarlo = function () {
    // Start optimizing
    SC.monteCarloRuns = 0;
    SC.e.start_monte_carlo.disabled = true;
    SC.e.stop_monte_carlo.disabled = false;
    SC.monteCarloBest = 1e9;
    SC.monteCarloEnabled = true;
    SC.monteCarloBatch(0.001, 0.001, 0.001);
};

SC.stopMonteCarlo = function () {
    // Stop optimizing
    SC.e.start_monte_carlo.disabled = false;
    SC.e.stop_monte_carlo.disabled = true;
    SC.monteCarloEnabled = false;
};

