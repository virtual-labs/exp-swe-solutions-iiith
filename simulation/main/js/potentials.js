// Set of interesting potentials
// Infinite square well, simple harmonic oscillator,
// and all the other favorites from your youth!
var algorithms;
(function (algorithms) {
    // Potentials are represented in the range [0, 1]
    // Here's our "infinity" value
    algorithms.Infinityish = 1000;
    function smoothstep(p1, p2, x) {
        // Given a x value between two points, returns the lerp'd y value
        if (p1.x > p2.x) {
            // swap them
            var tmp = p1;
            p1 = p2;
            p2 = tmp;
        }
        if (x <= p1.x) {
            return p1.y;
        }
        else if (x >= p2.x) {
            return p2.y;
        }
        else {
            var percent = (x - p1.x) / (p2.x - p1.x);
            return p1.y * (1.0 - percent) + p2.y * percent;
        }
    }
    algorithms.smoothstep = smoothstep;
    // Helper function. Many potentials are symmetric
    // If the parameter is larger than 0.5, mirror it around the center
    function symmetrize(param) {
        return param <= 0.5 ? param : 1.0 - param;
    }
    // Classic harmonic oscillator potential
    // This looks like V = base + distanceFromCenter^2
    // The parameter adjusts the steepness
    algorithms.SimpleHarmonicOscillator = function (x, param) {
        var steepness = symmetrize(param);
        var baseEnergy = 0.04;
        // x is a value in [0, 1)
        // minimum at x = 0.5
        // formula is, when x = parameter, base + steepnessCoeff * (x * x / 2) = 1
        // solving: steepnessCoeff = (1 - base) / (x * x / 2)
        var offsetToCenter = 0.5;
        var vparam = steepness - offsetToCenter;
        var steepnessCoeff = Math.min(1E5, (1.0 - baseEnergy) / (vparam * vparam / 2));
        var vx = x - offsetToCenter;
        return baseEnergy + steepnessCoeff * (vx * vx / 2.0);
    };
    // Classic infinite square well
    // The parameter is (half of) the width of the well
    algorithms.InfiniteSquareWell = function (x, param) {
        var widthRatio = symmetrize(param);
        var baseEnergy = 0.05;
        // x is a value in [0, 1)
        if (x < widthRatio || x > 1.0 - widthRatio) {
            return algorithms.Infinityish;
        }
        return baseEnergy;
    };
    // Like infinite square well, but it tops out at .8 instead of infinity
    algorithms.FiniteSquareWell = function (x, param) {
        var widthRatio = symmetrize(param);
        var baseEnergy = 0.05;
        // x is a value in [0, 1)
        if (x < widthRatio || x > 1.0 - widthRatio) {
            return .8;
        }
        return baseEnergy;
    };
    // Two adjacent square wells
    algorithms.TwoSquareWells = function (x, param) {
        var widthFactor = symmetrize(param);
        var baseEnergy = 0.05;
        var leftWellWidthFactor = 1.0 / 3.5;
        var barrierWidthFactor = 1.0 / 10.0;
        //const rightWellWidthFactor = 1.0 - (leftWellWidthFactor + barrierWidthFactor) 
        // If we're outside both wells, return "infinity""
        if (x < widthFactor || x >= 1.0 - widthFactor) {
            return algorithms.Infinityish;
        }
        var intervalLength = 1.0 - 2 * widthFactor;
        var vx = (x - widthFactor) / intervalLength;
        if (vx < leftWellWidthFactor) {
            return baseEnergy;
        }
        vx -= leftWellWidthFactor;
        if (vx < barrierWidthFactor) {
            return .85;
        }
        return baseEnergy; // right well
    };
    // Two-step square well (like a staircase)
    algorithms.SteppedSquareWell = function (x, param) {
        var widthRatio = symmetrize(param);
        var baseEnergy = 0.05;
        var stepEnergy = 0.4;
        // x is a value in [0, 1)
        if (x < widthRatio || x > 1.0 - widthRatio) {
            return algorithms.Infinityish;
        }
        return x < 0.5 ? stepEnergy : baseEnergy;
    };
    // Potential built from sampling at a list of points
    // The parameter is unused
    function SampledPotential(samples) {
        algorithms.assert(samples.length > 0);
        // Note that the samples are likely multivalued!
        // Thus we can't be too clever and try to binary search or anything
        // Hence this ugly naive algorithm. Given an X location, find all the
        // sample pairs that are on either side of it, lerp them, and then
        // pick the largest
        return function (x) {
            var result = 0;
            var foundSample = false;
            for (var i = 1; i < samples.length; i++) {
                var beforeSign = x > samples[i - 1].x;
                var afterSign = x > samples[i].x;
                if (beforeSign !== afterSign) {
                    // We're between these two points
                    // Pick the largest such value
                    var lerpedSample = smoothstep(samples[i - 1], samples[i], x);
                    result = Math.max(result, lerpedSample);
                    foundSample = true;
                }
            }
            if (!foundSample) {
                // this corresponds to starting or ending the sample midway through our box
                // flush it to "infinity"
                return algorithms.Infinityish;
            }
            else {
                return result;
            }
        };
    }
    algorithms.SampledPotential = SampledPotential;
    // Potential built "randomly"
    function RandomPotential() {
        function bezier(p0, p1, p2, t) {
            var omt = 1 - t;
            return omt * (omt * p0 + t * p1) + t * (omt * p1 + t * p2);
        }
        // Determine how many pivots
        var minPivotCount = 8, maxPivotCount = 24;
        var pivotCount = Math.floor(Math.random() * (maxPivotCount - minPivotCount) + minPivotCount);
        // Make a random join type
        // Note we bias towards bezier, since it looks the most interesting
        function randomJoinType() {
            switch ((Math.random() * 5) | 0) {
                case 0: return "line";
                case 1: return "flat";
                default: return "bezier";
            }
        }
        // Build pivots
        // Have an initial one
        var pivots = [];
        pivots.push({ x: 0, y: 1, joinType: "line" });
        for (var i = 0; i < pivotCount; i++) {
            pivots.push({
                x: Math.random() * .95,
                y: Math.pow(Math.random(), 1.5),
                joinType: randomJoinType(),
                control: Math.random()
            });
        }
        pivots.sort(function (p1, p2) { return p1.x - p2.x; });
        // Throw out pivots that are too close to their neighbor
        for (var i = 1; i < pivots.length; i++) {
            if (pivots[i].x - pivots[i - 1].x < .1) {
                pivots.splice(i, 1);
                i--;
            }
        }
        // Join from second to last to last pivot must not be flat
        var secondToLast = pivots[pivots.length - 2];
        while (secondToLast.joinType == "flat") {
            secondToLast.joinType = randomJoinType();
        }
        pivots.push({ x: 1, y: 1, joinType: "line" });
        return function (x) {
            // determine which pivot to use
            var pivotIdx = binarySearch(pivots, x);
            var nextIdx = pivotIdx + 1;
            var pivot = pivots[pivotIdx];
            if (nextIdx >= pivots.length) {
                return pivot.y;
            }
            else {
                // interpolate between this one and next one
                var next = pivots[nextIdx];
                switch (pivot.joinType) {
                    case "square":
                        return pivot.y;
                    case "line":
                        return smoothstep(pivot, next, x);
                    case "bezier":
                        var cpy = pivot.control;
                        var t = (x - pivot.x) / (next.x - pivot.x);
                        return bezier(pivot.y, cpy, next.y, t);
                }
            }
            return pivot.y;
        };
    }
    algorithms.RandomPotential = RandomPotential;
    // Helper function. Given a sorted list of Point2-things, and an x position,
    // return the index of the last (rightmost) point left of (or at) the given x position
    // If every point is to the right of the given position, returns 0
    function binarySearch(vals, x) {
        algorithms.assert(vals.length > 0);
        var left = 0, right = vals.length;
        while (left + 1 < right) {
            var mid = (left + (right - left) / 2) | 0;
            if (vals[mid].x <= x) {
                left = mid;
            }
            else {
                right = mid;
            }
        }
        return left;
    }
})(algorithms || (algorithms = {}));
