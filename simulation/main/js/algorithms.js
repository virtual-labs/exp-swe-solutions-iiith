/// <reference path="./complex.ts"/>
var algorithms;
(function (algorithms) {
    var Parity;
    (function (Parity) {
        Parity[Parity["Even"] = 1] = "Even";
        Parity[Parity["Odd"] = 2] = "Odd";
    })(Parity || (Parity = {}));
    function assert(condition, message) {
        if (!condition)
            throw message || "Assertion failed";
    }
    algorithms.assert = assert;
    // Helper function to fill an array with zeros
    function zeros(amt) {
        var result = [];
        for (var i = 0; i < amt; i++)
            result.push(0);
        return result;
    }
    // Given a function F, represented as samples in the given ComplexArray,
    // modify it in-place such that the integral of |F|^2 over all space
    // is 1
    function normalizeComplexFunction(samples, dx) {
        // norm is sum of dx * |vals|**2
        var norm = 0;
        for (var i = 0; i < samples.length; i++) {
            norm += samples.at(i).magnitudeSquared();
        }
        norm *= dx;
        norm = Math.sqrt(norm);
        if (norm === 0)
            norm = 1; // handle the case of a zero function by pretending the norm is 1
        var normRecip = 1.0 / norm;
        for (var i = 0; i < samples.length; i++) {
            samples.set(i, samples.at(i).multipliedByReal(normRecip));
        }
    }
    // Given a real function F, represented as samples in the given vals array,
    // modify it in place such that the integral of |F|^2 over all space
    // is 1
    function normalizeRealFunction(samples, dx) {
        // norm is sum of dx * vals**2
        var norm = 0;
        for (var i = 0; i < samples.length; i++) {
            norm += samples[i] * samples[i];
        }
        norm *= dx;
        norm = Math.sqrt(norm);
        if (norm === 0)
            norm = 1; // handle the case of a zero function by pretending the norm is 1
        var normRecip = 1.0 / norm;
        for (var i = 0; i < samples.length; i++) {
            samples[i] *= normRecip;
        }
    }
    // Given a complex function F, represented as samples in the given ComplexArray,
    // modify it in-place such that the first nonzero value on the left is positive 
    function normalizeSign(vals, leftTurningPoint) {
        // make it positive on the left
        var wantsSignFlip = false;
        var eps = 1.0E-16;
        for (var i = leftTurningPoint; i + 1 < vals.length; i++) {
            var re = vals.at(i).re;
            if (Math.abs(re) > eps) {
                wantsSignFlip = re < 0;
                break;
            }
        }
        if (wantsSignFlip) {
            for (var i = 0; i < vals.length; i++) {
                vals.set(i, vals.at(i).multipliedByReal(-1));
            }
        }
    }
    // Naive reference function
    // Given a list of real values in the space domain, separated by dx,
    // computes a list of complex values in the frequency domain, separated by dfreq
    // Note this is NOT the Discrete Fourier Transform. The DFT decomposes the function into
    // frequencies that are integer multiples of the fundamental frequency. But this decomposes
    // a function into non-integer multiples.
    // That is why we cannot use FFT techniques.
    function fourierTransformNaive(spaceValues, center, dx, dfreq) {
        var length = spaceValues.length;
        assert(length > 0 && center < length, "center out of bounds");
        var freqValues = algorithms.ComplexArray.zeros(length);
        var multiplier = dx / Math.sqrt(2 * Math.PI);
        for (var arrayIdx = 0; arrayIdx < length; arrayIdx++) {
            var p = (arrayIdx - center) * dfreq;
            var phi = new algorithms.Complex(0, 0);
            for (var i = 0; i < length; i++) {
                var spaceValue = spaceValues[i];
                var x = (i - center) * dx;
                phi.addToSelf(algorithms.Complex.exponential(-p * x).multipliedByReal(spaceValue));
            }
            freqValues.set(arrayIdx, phi.multipliedByReal(multiplier));
        }
        return freqValues;
    }
    algorithms.fourierTransformNaive = fourierTransformNaive;
    // Optimized variant that computes the Fourier transform of the given space values
    // See fourierTransformNaive() for comments 
    function fourierTransform(spaceValues, centerIndex, dx, dfreq) {
        var length = spaceValues.length;
        assert(length > 0 && centerIndex < length, "center out of bounds");
        var freqValues = algorithms.ComplexArray.zeros(length);
        var freqValuesRe = freqValues.res;
        var freqValuesIm = freqValues.ims;
        // Initial space value at each iteration
        var startX = -centerIndex * dx;
        // We have an overall multiplier of 1/sqrt(2*pi), which goes outside the integral
        // We also have a Riemann sum, of width dx, which can be pulled out too
        // Compute the overall multiplier
        var coefficient = dx / Math.sqrt(2 * Math.PI);
        var freq = -centerIndex * dfreq;
        for (var freqIndex = 0; freqIndex < length; freqIndex++, freq += dfreq) {
            // {phiReal, phiImaginary} are the computed values of phi(freq)
            // for each spaceIndex, we want to compute:
            //    e^(-i * freq * spaceLocation) * spaceValues[spaceIndex]
            // The freq is constant for this iteration, and we run through the space positions
            // The difference between successive spaceLocations is dx
            // Thus we have
            //    e^(-i * freq * (spaceLocation + dx))
            //    = e^(-i * freq * spaceLocation) * e^(-i * freq * dx)
            // so we can step through the successive exponentials by multiplying by e^(-i * freq * dx)
            // which is of course cos(-freq * dx) + i sin(-freq * dx)  
            // Initial value of the exponential term in the expression
            var exponentialReal = Math.cos(-startX * freq);
            var exponentialImag = Math.sin(-startX * freq);
            // Step values
            var stepReal = Math.cos(-dx * freq);
            var stepImag = Math.sin(-dx * freq);
            // Value of Riemann sum (i.e. phi) at our current frequency (freq)
            var phiReal = 0;
            var phiImag = 0;
            for (var spaceIndex = 0; spaceIndex < length; spaceIndex++) {
                // Pull out the spaceValue, aka psi(x). We only use the real part.
                // Multiply that by our current exponential and add that to phi
                var spaceValue = spaceValues[spaceIndex];
                phiReal += spaceValue * exponentialReal;
                phiImag += spaceValue * exponentialImag;
                // Step our exponential
                // Note that we are multiplying two complex numbers
                // the formula is {c1.re*c2.re - c1.im*c2.im, c1.re*c2.im + c2.re*c1.im}
                var tmpReal = exponentialReal * stepReal - exponentialImag * stepImag;
                exponentialImag = exponentialReal * stepImag + stepReal * exponentialImag;
                exponentialReal = tmpReal;
            }
            // Multiply by coefficient and store
            freqValuesRe[freqIndex] = coefficient * phiReal;
            freqValuesIm[freqIndex] = coefficient * phiImag;
        }
        return freqValues;
    }
    algorithms.fourierTransform = fourierTransform;
    // Represents a solution to the time-independent Schrodinger equation
    // This is represented as a list of complex values, separated by dx,
    // with some metadata
    // Note that this may be in either the spatial domain or frequency domain
    var TimeIndependentWavefunction = /** @class */ (function () {
        function TimeIndependentWavefunction(values, dx, md) {
            this.values = values;
            this.dx = dx;
            this.md = md;
            assert(isFinite(md.energy), "Non-finite energy: " + md.energy);
            assert(isFinite(dx), "Non-finite dx: " + dx);
            assert(isFinite(md.leftDerivativeDiscontinuity), "Non-finite leftDerivativeDiscontinuity: " + md.leftDerivativeDiscontinuity);
            assert(isFinite(md.rightDerivativeDiscontinuity), "Non-finite rightDerivativeDiscontinuity: " + md.rightDerivativeDiscontinuity);
        }
        // Returns the value of the wavefunction at a given time
        // "Time independent" is a slight lie - really our time dependence is very simple
        TimeIndependentWavefunction.prototype.valueAt = function (x, time) {
            // e^(-iEt) -> cos(-eT) + i * sin(-Et)
            var nEt = -this.md.energy * time;
            return this.values.at(x).multiplied(algorithms.Complex.exponential(nEt));
        };
        // Takes the Fourier transform, returning a new wavefunction
        TimeIndependentWavefunction.prototype.fourierTransform = function (center, scale) {
            var freqValues = fourierTransform(this.values.res, center, this.dx, this.dx * scale);
            normalizeComplexFunction(freqValues, this.dx);
            return new TimeIndependentWavefunction(freqValues, this.dx, this.md);
        };
        return TimeIndependentWavefunction;
    }());
    algorithms.TimeIndependentWavefunction = TimeIndependentWavefunction;
    // Represents a generalized solution to the Schrodinger equation, as a sum of time-independent solutions
    // Assumes that the time-independent solutions are present with equal weights; this is a wholly artificial
    // assumption for the purposes of the visualizer. In practice the weights can be arbitrary.
    var Wavefunction = /** @class */ (function () {
        function Wavefunction(components) {
            var _this = this;
            this.components = components;
            assert(components.length > 0, "Empty components in Wavefunction");
            this.length = components[0].values.length;
            this.components.forEach(function (psi) {
                assert(psi.values.length === _this.length, "Not all lengths the same");
            });
            this.dx = this.components[0].dx;
        }
        // Returns the complex value at a given location for a given time
        // This is simply the weighted sum of the valueAts of our components
        Wavefunction.prototype.valueAt = function (x, time) {
            assert(x === +x && x === (x | 0), "Non-integer passed to valueAt");
            var result = new algorithms.Complex(0, 0);
            this.components.forEach(function (psi) {
                result.addToSelf(psi.valueAt(x, time));
            });
            // apply equal weights
            result.re /= this.components.length;
            result.im /= this.components.length;
            return result;
        };
        // Returns the Fourier transform of the given wavefunction
        // Because the Fourier transform is linear, this is just the Fourier transform
        // of the sum of our components
        Wavefunction.prototype.fourierTransform = function (center, scale) {
            var fourierComps = this.components.map(function (comp) { return comp.fourierTransform(center, scale); });
            return new Wavefunction(fourierComps);
        };
        return Wavefunction;
    }());
    algorithms.Wavefunction = Wavefunction;
    // Given two ResolvedWavefunction, computes an average weighted by the discontinuities in their derivatives
    // The average is chosen so as to cancel the left discontinuity
    function averageWavefunctionsToCancelDiscontinuities(first, second) {
        assert(first.values.length === second.values.length, "Wavefunctions have different lengths");
        var bad1 = first.md.leftDerivativeDiscontinuity;
        var bad2 = second.md.leftDerivativeDiscontinuity;
        var eps = .01;
        var values;
        if (Math.abs(bad1) < eps) {
            values = first.values.slice();
        }
        else if (Math.abs(bad2) < eps) {
            values = second.values.slice();
        }
        else {
            // we want bad1 + k * bad2 = 0
            // so k = -bad1 / bad2
            var k = -bad1 / bad2;
            var length_1 = first.values.length;
            values = algorithms.ComplexArray.zeros(length_1);
            for (var i = 0; i < length_1; i++) {
                values.set(i, first.values.at(i).added(second.values.at(i).multipliedByReal(k)));
            }
            normalizeComplexFunction(values, first.dx);
        }
        normalizeSign(values, first.md.leftTurningPoint);
        return new TimeIndependentWavefunction(values, first.dx, first.md);
    }
    algorithms.averageWavefunctionsToCancelDiscontinuities = averageWavefunctionsToCancelDiscontinuities;
    function classicalTurningPoints(potential, energy) {
        var length = potential.length;
        var left, right;
        for (left = 0; left < length; left++) {
            if (energy > potential[left]) {
                break;
            }
        }
        for (right = length - 1; right >= left; right--) {
            if (energy > potential[right]) {
                break;
            }
        }
        // if we meet, it means the energy is above the potential: scattering state
        // assume we have an infinite square well box in that case 
        if (left > right) {
            left = 0;
            right = length - 1;
        }
        return { left: left, right: right };
    }
    algorithms.classicalTurningPoints = classicalTurningPoints;
    // A ResolvableWavefunction is the output of our Numerov method
    // It contains both the result of stepping both inside out and outside in
    // "Resolving" referes to the process of joining these two wavefunctions at a given point
    // Note that these wavefunctions are real-valued
    var ResolvableWavefunction = /** @class */ (function () {
        function ResolvableWavefunction(potential, energy, maxX) {
            this.energy = energy;
            this.maxX = maxX;
            this.valuesFromCenter = [];
            this.valuesFromEdge = [];
            // F function used in our Numerov algorithm
            // We need to keep this around for computing the discontinuities
            this.F = null;
            this.potential = potential.slice();
        }
        ResolvableWavefunction.prototype.length = function () {
            assert(this.valuesFromCenter.length === this.valuesFromEdge.length, "Wavefunction does not have a consistent length");
            return this.valuesFromCenter.length;
        };
        // computes the discontinuity in the two derivatives at the given location
        // we don't actually care if it's right or left
        ResolvableWavefunction.prototype.derivativeDiscontinuity = function (psi, x, dx) {
            if (x === 0 || x + 1 === psi.length) {
                // this indicates the turning points are at the very edges
                // don't try to be clever here
                return 0;
            }
            return (psi[x + 1] + psi[x - 1] - (14. - 12 * this.F(x)) * psi[x]) / dx;
        };
        // Resolve the wavefunction by joining the inside-out and outside-in values at the given points
        // We scale the valuesFromEdge to match the valuesFromCenter at the given turning points,
        // then normalize the whole thing
        ResolvableWavefunction.prototype.resolveAtTurningPoints = function (tp) {
            var left = Math.round(tp.left), right = Math.round(tp.right);
            var length = this.length();
            assert(left <= right, "left is not <= right");
            assert(left >= 0 && left < length && right >= 0 && right < length, "left or right out of bounds");
            var leftScale = this.valuesFromCenter[left] / this.valuesFromEdge[left];
            var rightScale = this.valuesFromCenter[right] / this.valuesFromEdge[right];
            // build our wavefunction piecewise: edge, center, edge
            var psi = zeros(length);
            var i = 0;
            for (; i < left; i++) {
                psi[i] = leftScale * this.valuesFromEdge[i];
            }
            for (; i < right; i++) {
                psi[i] = this.valuesFromCenter[i];
            }
            for (; i < length; i++) {
                psi[i] = rightScale * this.valuesFromEdge[i];
            }
            // normalize
            var dx = this.maxX / length;
            normalizeRealFunction(psi, dx);
            // compute discontinuities
            var leftDiscont = this.derivativeDiscontinuity(psi, left, dx);
            var rightDiscont = this.derivativeDiscontinuity(psi, right, dx);
            var md = {
                energy: this.energy,
                leftTurningPoint: left,
                rightTurningPoint: right,
                leftDerivativeDiscontinuity: leftDiscont,
                rightDerivativeDiscontinuity: rightDiscont
            };
            var complexPsi = algorithms.ComplexArray.zeros(psi.length);
            for (var i_1 = 0; i_1 < psi.length; i_1++) {
                complexPsi.res[i_1] = psi[i_1];
            }
            return new TimeIndependentWavefunction(complexPsi, dx, md);
        };
        // Resolves us at our classical turning points, which are the points where our energy
        // reaches the potential
        ResolvableWavefunction.prototype.resolveAtClassicalTurningPoints = function () {
            return this.resolveAtTurningPoints(classicalTurningPoints(this.potential, this.energy));
        };
        return ResolvableWavefunction;
    }());
    // Main entry point!
    // Given IntegratorInput, produce the time independent wavefunction using our numerical method
    function classicallyResolvedAveragedNumerov(input) {
        var tps = classicalTurningPoints(input.potentialMesh, input.energy);
        var evenVal = numerov(input, Parity.Even).resolveAtTurningPoints(tps);
        var oddVal = numerov(input, Parity.Odd).resolveAtTurningPoints(tps);
        return averageWavefunctionsToCancelDiscontinuities(evenVal, oddVal);
    }
    algorithms.classicallyResolvedAveragedNumerov = classicallyResolvedAveragedNumerov;
    // The guts of the numerical method!
    // Given integrator input, compute a resolvable wavefunction
    function numerov(input, parity) {
        // We start at the point of minimum energy, and integrate left and right
        var even = (parity === Parity.Even);
        var potential = input.potentialMesh;
        var length = potential.length;
        assert(length >= 3, "PotentialMesh is too small");
        var startIndex = indexOfMinimum(potential);
        // Fill wavefunction with all 0s
        var wavefunction = new ResolvableWavefunction(potential.slice(), input.energy, input.maxX);
        wavefunction.valuesFromCenter = zeros(length);
        wavefunction.valuesFromEdge = zeros(length);
        var energy = input.energy;
        var dx = input.maxX / length;
        var ddx12 = dx * dx / 12.0;
        // F function used by Numerov
        var F = function (x) { return 1.0 - ddx12 * 2. * (potential[x] - energy); };
        wavefunction.F = F;
        // Numerov integrator formula
        // given that we have set psi[index], compute and set psi[index+1] if rightwards,
        // or psi[index-1] if leftwards
        var GoingLeft = false, GoingRight = true;
        var step = function (psi, index, rightwards) {
            var targetX = rightwards ? index + 1 : index - 1; // point we're setting
            var prev1X = index; // previous x
            var prev2X = rightwards ? index - 1 : index + 1; // previous previous x
            var psiVal = (((12. - F(prev1X) * 10.) * psi[prev1X] - F(prev2X) * psi[prev2X])) / F(targetX);
            // We may get NaNs for very narrow potentials; flush them to zero
            psi[targetX] = isNaN(psiVal) ? 0 : psiVal;
        };
        // integrate outwards
        // In the reference code, f is the potential, y is psi
        var psi = wavefunction.valuesFromCenter;
        if (even) {
            psi[startIndex] = 1;
            psi[startIndex + 1] = 0.5 * (12. - F(startIndex) * 10.) * psi[startIndex] / F(startIndex + 1);
        }
        else {
            psi[startIndex] = 0;
            psi[startIndex + 1] = dx;
        }
        // rightwards integration
        for (var i = startIndex + 1; i + 1 < length; i++) {
            // y[i + 1] = ((12. - f[i] * 10.) * y[i] - f[i - 1] * y[i - 1]) / f[i + 1];
            step(psi, i, GoingRight);
        }
        // leftwards integration
        // note we "start at" startIndex+1
        for (var i = startIndex; i > 0; i--) {
            step(psi, i, GoingLeft);
        }
        // integrate inwards
        // we assume psi is 0 outside the mesh
        psi = wavefunction.valuesFromEdge;
        psi[0] = even ? dx : -dx;
        psi[1] = (12. - 10. * F(0)) * psi[0] / F(1);
        for (var i = 1; i < startIndex; i++) {
            step(psi, i, GoingRight);
        }
        psi[length - 1] = dx;
        psi[length - 2] = (12. - 10. * F(length - 1)) * psi[length - 1] / F(length - 2);
        for (var i = length - 2; i > startIndex; i--) {
            step(psi, i, GoingLeft);
        }
        return wavefunction;
    }
    // Helper function: returns the index of the minimum of the given potential
    // If multiple locations are at the minimum, returns the middlemost location
    function indexOfMinimum(potential) {
        assert(potential.length > 0, "No minimum for empty potential");
        // Determine minimum and locations with that minimum
        var minimum = potential.reduce(function (a, b) { return Math.min(a, b); });
        var locationsAtMinimum = [];
        for (var i = 0; i < potential.length; i++) {
            if (potential[i] === minimum) {
                locationsAtMinimum.push(i);
            }
        }
        // Return the middle location
        // Do not allow it to be on the edge
        assert(locationsAtMinimum.length > 0);
        var result = locationsAtMinimum[(locationsAtMinimum.length / 2) | 0];
        result = Math.max(1, result);
        result = Math.min(potential.length - 2, result);
        return result;
    }
    algorithms.indexOfMinimum = indexOfMinimum;
    // Some testing machinery
    function algorithmTest() {
        function formatFloat(x) {
            return x.toFixed(2);
        }
        var lines = [];
        var width = 1025;
        var potential = zeros(width);
        // Simple Harmonic Oscillator
        var baseEnergy = 0.04;
        var steepness = 12.0;
        for (var i = 0; i < width; i++) {
            var x = i / width;
            var offsetX = 0.5;
            var scaledX = (x - offsetX);
            potential[i] = baseEnergy + steepness * (scaledX * scaledX / 2.0);
        }
        var input = {
            potentialMesh: potential,
            energy: 0.5,
            maxX: 25
        };
        var psi = numerov(input, Parity.Even).resolveAtClassicalTurningPoints();
        lines.push("left discontinuity: " + psi.md.leftDerivativeDiscontinuity.toFixed(4));
        lines.push("right discontinuity: " + psi.md.rightDerivativeDiscontinuity.toFixed(4));
        lines.push("x\tpsi\tV");
        for (var i = 0; i < width; i++) {
            var x = i / width - (1.0 / 2.0);
            lines.push(formatFloat(x) + "\t" + formatFloat(psi.valueAt(i, 0).re) + "\t" + formatFloat(potential[i]));
        }
        return lines.join("\n");
    }
    algorithms.algorithmTest = algorithmTest;
})(algorithms || (algorithms = {}));
