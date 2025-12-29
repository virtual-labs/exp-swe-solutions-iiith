// Support for complex arithmetic
var algorithms;
(function (algorithms) {
    // Represents a complex number, with fields re and im
    var Complex = /** @class */ (function () {
        function Complex(re, im) {
            this.re = re;
            this.im = im;
        }
        Complex.prototype.addToSelf = function (rhs) {
            this.re += rhs.re;
            this.im += rhs.im;
        };
        Complex.prototype.added = function (rhs) {
            return new Complex(this.re + rhs.re, this.im + rhs.im);
        };
        Complex.prototype.multiplied = function (rhs) {
            return new Complex(this.re * rhs.re - this.im * rhs.im, this.re * rhs.im + this.im * rhs.re);
        };
        Complex.prototype.multipliedByReal = function (val) {
            return new Complex(this.re * val, this.im * val);
        };
        Complex.prototype.magnitudeSquared = function () {
            return this.re * this.re + this.im * this.im;
        };
        Complex.prototype.toString = function () {
            return this.re.toFixed(2) + " + i*" + this.im.toFixed(2);
        };
        // Computes e^(i*power)
        Complex.exponential = function (power) {
            return new Complex(Math.cos(power), Math.sin(power));
        };
        return Complex;
    }());
    algorithms.Complex = Complex;
    // Helper machinery around using FloatArray, which provides some performance benefits
    // We can switch here between Float32 and Float64, or just number[]
    // In current tests, the naive number[] beats FloatArray
    // export let FloatArray = Float64Array
    // export type FloatArray = Float64Array
    algorithms.FloatArray = null;
    // Construct a new FloatArray containing zeros
    function newFloatArray(length) {
        if (algorithms.FloatArray == Float32Array || algorithms.FloatArray == Float64Array) {
            return new algorithms.FloatArray(length);
        }
        else {
            var result = [];
            for (var i = 0; i < length; i++) {
                result.push(0);
            }
            return result;
        }
    }
    // Make an independent copy of a given FloatArray
    function copyFloatArray(arr) {
        if (algorithms.FloatArray == Float32Array || algorithms.FloatArray == Float64Array) {
            return new algorithms.FloatArray(arr);
        }
        else {
            return arr.slice();
        }
    }
    // ComplexArray efficiently stores an array of complex values,
    // in two parallel FloatArrays
    // ComplexArray cannot be resized
    var ComplexArray = /** @class */ (function () {
        function ComplexArray(res, ims) {
            this.res = res;
            this.ims = ims;
            algorithms.assert(res.length === ims.length, "Mismatching length");
            this.length = res.length;
        }
        // Create a ComplexArray of the given length, filled with zeros
        ComplexArray.zeros = function (length) {
            algorithms.assert(length >= 0 && length === (length | 0), "Invalid length");
            var result = new ComplexArray(newFloatArray(length), newFloatArray(length));
            return result;
        };
        // Return the value at a given index
        ComplexArray.prototype.at = function (idx) {
            return new Complex(this.res[idx], this.ims[idx]);
        };
        // Set the complex value at a given index
        ComplexArray.prototype.set = function (idx, value) {
            this.res[idx] = value.re;
            this.ims[idx] = value.im;
        };
        // Returns an independent copy of the ComplexArray
        ComplexArray.prototype.slice = function () {
            return new ComplexArray(copyFloatArray(this.res), copyFloatArray(this.ims));
        };
        return ComplexArray;
    }());
    algorithms.ComplexArray = ComplexArray;
})(algorithms || (algorithms = {}));
