// Converting from and to engineering values (4.7k -> 4700)
"use strict";
// globals: document, window

var SC = window.SC || {};

SC.fromEng = function (aValue) {
    // convert 4.7k to 4700
    if (aValue === undefined || aValue === 0 || aValue === null) {
        return aValue;
    }
    var suffix, k, v = aValue.toString(),
        multiplier = {
            k: 1e3,
            M: 1e6,
            G: 1e9,
            m: 1e-3,
            u: 1e-6,
            n: 1e-9,
            p: 1e-12,
            f: 1e-15
        };
    suffix = v.substr(-1);
    k = multiplier[suffix] || 1;
    if (k !== 1) {
        v = v.substr(0, v.length - 1);
    }
    return parseFloat(v) * k;
};

SC.toEng = function (aReal) {
    // convert 1234.5678 to 1.23k
    if (aReal === undefined || aReal === 0 || aReal === null) {
        return aReal;
    }
    var orig = aReal, sign = aReal < 0 ? '-' : '';
    aReal = Math.abs(aReal);
    function out(x) {
        //console.log('x', x);
        return sign + parseFloat(x.toPrecision(3)).toString();
    }
    if ((aReal >= 1) && (aReal < 1000)) {
        return out(aReal);
    }
    if (aReal >= 1000) {
        aReal = aReal / 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'k';
        }
        aReal = aReal / 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'M';
        }
        aReal = aReal / 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'G';
        }
    }
    if (aReal < 1) {
        aReal = aReal * 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'm';
        }
        aReal = aReal * 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'u';
        }
        aReal = aReal * 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'n';
        }
        aReal = aReal * 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'p';
        }
        aReal = aReal * 1000;
        if ((aReal >= 1) && (aReal < 1000)) {
            return out(aReal) + 'f';
        }
    }
    return out(orig);
};

