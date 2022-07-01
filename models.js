// Models made from measuring real diodes
"use strict";

var SC = window.SC || {};

SC.diodeModel = {
    "1N34A": {IS: 3.22270e-9, N: 1.59630, RS: 0.396195}, // avg error 2.3% max 6.3%
    "1N34A_2": {IS: 3.18489e-9, N: 1.59169, RS: 0.418770}, // avg error 2.8% max 4.2%

    "1N4007": {IS: 2.23487e-9, N: 1.77383, RS: 0.637275}, // avg error 8.6% max 18.4%
    "1N4007_2": {IS: 2.22965e-9, N: 1.76709, RS: 0.693182}, // avg error 9.2% max 13.9%

    "1N4148": {IS: 4.75820e-9, N: 1.95969, RS: 2.14024}, // avg error 4.1% max 19.9%
    "1N4148_2": {IS: 5.87734e-9, N: 2.00210, RS: 2.14563}, // avg error 5.7% max 8.3%

    "1N5399": {IS: 1.43583e-9, N: 1.68080, RS: 0.554708}, // avg error 9.3% max 23.1%
    "1N5399_2": {IS: 1.47303e-9, N: 1.67757, RS: 0.785847}, // avg error 10.6% max 17.5%

    "1N5408": {IS: 1.05957e-9, N: 1.57219, RS: 0.664185}, // avg error 7.0% max 15.3%
    "1N5408_2": {IS: 1.06066e-9, N: 1.56955, RS: 0.851773}, // avg error 7.6% max 13.0%

    "1N5819": {IS: 4.14809e-7, N: 1.04287, RS: 0.208896}, // avg error 0.7% max 2.2%
    "1N5819_2": {IS: 4.16301e-7, N: 1.04455, RS: 0.212902}, // avg error 1.0% max 1.8%

    "1N5822": {IS: 0.00000125552, N: 1.03475, RS: 0.0431348}, // avg error 1.2% max 2.8%
    "1N5822_2": {IS: 0.00000125046, N: 1.03327, RS: 0.0451249}, // avg error 1.3% max 2.6%

    "BZV86-2V0": {IS: 5.27632e-15, N: 2.84850, RS: 0.103020}, // avg error 14.8% max 42.0%
    "BZV86-2V0_2": {IS: 8.79968e-15, N: 2.90352, RS: 0.111076}, // avg error 15.9% max 27.6%

    "ER1002CT": {IS: 9.93370e-11, N: 1.16105, RS: 0.701337}, // avg error 4.8% max 28.9%
    "ER1002CT_2": {IS: 1.47303e-10, N: 1.19877, RS: 0.625001}, // avg error 10.0% max 14.5%

    "FR107": {IS: 8.92157e-10, N: 1.55229, RS: 6.23061}, // avg error 12.2% max 34.7%
    "FR107_2": {IS: 1.24275e-9, N: 1.59943, RS: 4.99982}, // avg error 14.4% max 21.2%

    "FR207": {IS: 4.19814e-10, N: 1.45297, RS: 5.25472}, // avg error 10.8% max 33.9%
    "FR207_2": {IS: 5.72432e-10, N: 1.49482, RS: 4.08107}, // avg error 13.0% max 19.1%

    "FR302": {IS: 1.50494e-10, N: 1.13749, RS: 1.65315}, // avg error 6.6% max 26.8%
    "FR302_2": {IS: 2.12652e-10, N: 1.16728, RS: 1.78382}, // avg error 7.6% max 11.6%

    "PR1504": {IS: 2.08298e-10, N: 1.29583, RS: 3.54298}, // avg error 10.0% max 21.9%
    "PR1504_2": {IS: 1.73086e-10, N: 1.27604, RS: 3.43550}, // avg error 10.6% max 15.9%

    "LED_BLUE": {IS: 2.71397e-31, N: 1.58324, RS: 17.8994}, // avg error 6.5% max 30.3%
    "LED_BLUE_2": {IS: 2.36253e-31, N: 1.58208, RS: 14.7011}, // avg error 14.8% max 18.9%

    "LED_GREEN": {IS: 4.37561e-22, N: 1.74172, RS: 0.0204277}, // avg error 15.7% max 36.9%
    "LED_GREEN_2": {IS: 7.06818e-22, N: 1.76271, RS: 0.0184355}, // avg error 16.9% max 31.1%

    "LED_RED": {IS: 3.69679e-17, N: 2.27114, RS: 1.16854}, // avg error 13.7% max 55.4%
    "LED_RED_2": {IS: 2.26325e-16, N: 2.41848, RS: 0.897075}, // avg error 17.4% max 25.2%

    "LED_WHITE": {IS: 8.64162e-33, N: 1.51971, RS: 16.1687}, // avg error 3.6% max 18.5%
    "LED_WHITE_2": {IS: 8.45181e-33, N: 1.52112, RS: 14.3896}, // avg error 8.2% max 9.5%

    "LED_YELLOW": {IS: 1.38357e-21, N: 1.79130, RS: 6.08539}, // avg error 5.6% max 11.6%
    "LED_YELLOW_2": {IS: 1.58700e-21, N: 1.79686, RS: 5.93804}, // avg error 6.0% max 8.8%

    "SFF3DG": {IS: 3.41787e-11, N: 1.06219, RS: 0.742020}, // avg error 3.7% max 24.4%
    "SFF3DG_2": {IS: 4.69934e-11, N: 1.08379, RS: 0.813738}, // avg error 6.5% max 10.2%

    "BAT43": {IS: 2.87591e-7, N: 1.00985, RS: 1.24219}, // avg error 1.1% max 4.0%
    "BAT43_2": {IS: 2.88561e-7, N: 1.00834, RS: 1.27012}, // avg error 1.6% max 2.8%
};
