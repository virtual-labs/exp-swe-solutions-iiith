/// <reference path="../typings/threejs/three.d.ts"/>
/// <reference path="./algorithms.ts"/>
/// <reference path="./potentials.ts"/>
// Helper machinery for our visualizers
var visualizing;
(function (visualizing) {
    function assert(condition, message) {
        if (!condition)
            throw message || "Assertion failed";
    }
    visualizing.assert = assert;
    function vector3(x, y, z) {
        return new THREE.Vector3(x, y, z);
    }
    visualizing.vector3 = vector3;
    // A class to help with animations or just general redrawing
    // Add clients of type AnimatorClient
    var Redrawer = /** @class */ (function () {
        function Redrawer(params, rerender) {
            this.params = params;
            this.clients_ = [];
            this.animating_ = false;
            this.rerenderScheduled_ = false;
            this.rerender_ = rerender;
            this.elapsed_ = 0;
            this.lastNow_ = Redrawer.now();
        }
        // Returns the current time
        Redrawer.now = function () {
            return (performance || Date).now();
        };
        // Schedule a new render, if one is not already scheduled  
        Redrawer.prototype.scheduleRerender = function () {
            var _this = this;
            if (!this.rerenderScheduled_) {
                this.rerenderScheduled_ = true;
                window.requestAnimationFrame(function () { return _this.fireClientsAndRerender(); });
            }
        };
        // Adds a new client, whose prepareForRender() will be called
        Redrawer.prototype.addClient = function (client) {
            this.clients_.push(client);
            this.scheduleRerender();
        };
        // Toggle pausing
        Redrawer.prototype.setAnimating = function (flag) {
            if (!this.animating_ && flag) {
                // We are unpausing
                this.lastNow_ = Redrawer.now();
                this.scheduleRerender();
            }
            this.animating_ = flag;
        };
        Redrawer.prototype.animating = function () {
            return this.animating_;
        };
        // Sets the time back to zero 
        Redrawer.prototype.reset = function () {
            this.elapsed_ = 0;
        };
        // Callback scheduled with requestAnimationFrame
        Redrawer.prototype.fireClientsAndRerender = function () {
            var _this = this;
            this.rerenderScheduled_ = false;
            var localClients = this.clients_.slice();
            // Increment time if we're animating
            if (this.animating_) {
                var now = Redrawer.now();
                var dt = (now - this.lastNow_) / 1000.;
                this.elapsed_ += dt * this.params.timescale;
                this.lastNow_ = now;
            }
            localClients.forEach(function (client) { return client.prepareForRender(_this.elapsed_); });
            this.rerender_();
            // Schedule another render if we're animating
            if (this.animating_) {
                this.scheduleRerender();
            }
        };
        return Redrawer;
    }());
    visualizing.Redrawer = Redrawer;
    // Parameters to our visualizion
    // This is all of the constant data. Parameters never change!
    var Parameters = /** @class */ (function () {
        function Parameters() {
            this.width = 800; // in "pixels"
            this.height = 600; // in "pixels"
            this.cameraDistance = 400; // how far back the camera is
            this.maxX = 25; // maximum X value
            this.timescale = 4.0; // multiplier for time
            this.energyScale = 5; // coefficient for energy in the visualizer, only affects label
            this.frequencyScale = .5; // coefficient for frequency when taking the fourier transform, relates to mass
            this.meshDivision = 800; // how many points are in our mesh
            this.psiScale = 250; // how much scale we visually apply to the wavefunction
            this.psiAbsScale = this.psiScale * 1.75; // how much scale we visually apply to the psiAbs and phiAbs
            // Colors of psi (position-space) and phi (momentum-space) wavefunctions
            this.psiColor = 0xFFD633;
            this.phiColor = 0x0077FF;
        }
        // Some helper functions based on the visualization
        // Given an index in our mesh, returns the X location of middle of the cell
        Parameters.prototype.xCenterForMeshIndex = function (idx) {
            assert(idx >= 0 && idx < this.meshDivision, "idx out of range");
            var meshWidth = this.width / this.meshDivision;
            return idx * meshWidth + meshWidth / 2.0;
        };
        // Given a Y value in the range [0, 1], return the "visual coordinate" (pixel)
        // Output is in the range [0, this.height]
        // 0 is at top, so we have to flip
        Parameters.prototype.convertYToVisualCoordinate = function (y) {
            return this.height * (1.0 - y);
        };
        // Given a Y value in the range [0, this.height], return the Y value
        // Output is in the range [0, 1]
        Parameters.prototype.convertYFromVisualCoordinate = function (y) {
            return 1.0 - y / this.height;
        };
        // Given an X value in the range [0, 1], return the visual coordinate
        // in the range [0, width]
        Parameters.prototype.convertXToVisualCoordinate = function (x) {
            return (x / this.meshDivision) * this.width;
        };
        return Parameters;
    }());
    visualizing.Parameters = Parameters;
    // State of our visualizion
    // We use a React-style model where all state is grouped into one big object
    // and passed down our UI tree. State is immutable.
    var State = /** @class */ (function () {
        // Constructs a state
        // The "apply state update" function is invoked on the new state after a call to modify()
        // This is used to announce changes
        function State(params_, applyStateUpdate) {
            if (applyStateUpdate === void 0) { applyStateUpdate = function () { }; }
            this.params_ = params_;
            this.applyStateUpdate = applyStateUpdate;
            // Current camera rotation
            this.cameraRotationRadians = 0;
            // The potential builder function and the potential
            // The potential will be automatically rebuilt as necessary
            this.potentialBuilder = null;
            this.potential = [];
            this.potentialParameter = .15; // single draggable parameter in our potential, in the range [0, 1)
            // Whether we are sketching a potential, and the sketch locations
            this.sketching = false;
            this.sketchLocations = [];
            this.showPsi = true; // show position psi(x)
            this.showPsiAbs = false; // show position probability |psi(x)|^2
            this.showPhi = false; // show momentum phi(x)
            this.showPhiAbs = false; // show momentum probability |phi(x)|^2
            // animation pause state
            this.paused = false;
            // The energies array is sparse
            // Keys are energy bar identifiers, values are numbers
            this.energies = {};
        }
        // Returns a dense array of the energy values, discarding the identifiers
        State.prototype.energyValues = function () {
            var _this = this;
            return Object.keys(this.energies).map(function (k) { return _this.energies[k]; });
        };
        // Copies the receiver. Implementation detail used to ensure immutability.
        State.prototype.copy = function () {
            var clone = new State(this.params_);
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    clone[key] = this[key];
                }
            }
            return clone;
        };
        // Builds the potential from the potential builder
        // This is not a cheap operation, so we only do it if necessary
        State.prototype.rebuildPotentialIfNeeded = function (oldState) {
            if (!this.potentialBuilder) {
                this.potential = [];
            }
            else if (this.potentialParameter !== oldState.potentialParameter ||
                this.potentialBuilder !== oldState.potentialBuilder) {
                this.potential = buildPotential(this.params_, this.potentialParameter, this.potentialBuilder);
            }
        };
        // Entry point for modification
        // Creates a new state and then calls its state update function
        State.prototype.modify = function (handler) {
            var cp = this.copy();
            handler(cp);
            cp.rebuildPotentialIfNeeded(this);
            cp.applyStateUpdate(cp);
        };
        return State;
    }());
    visualizing.State = State;
    // Builds a potential based on a function
    // let f be a function that accepts an x position, and optionally the x fraction (in the range [0, 1))
    // returns the new potential
    function buildPotential(params, potentialParam, f) {
        var potentialMesh = [];
        for (var i = 0; i < params.meshDivision; i++) {
            var x = i / params.meshDivision;
            potentialMesh.push(f(x, potentialParam));
        }
        return potentialMesh;
    }
    visualizing.buildPotential = buildPotential;
    // Benchmark and testing machinery
    function timeThing(iters, funct) {
        var start = new Date().getTime();
        for (var iter = 0; iter < iters; iter++) {
            funct();
        }
        var end = new Date().getTime();
        var duration = (end - start) / iters;
        return duration;
    }
    function arraysAreClose(arr1, arr2) {
        if (arr1.length != arr2.length)
            return false;
        var eps = .0001;
        for (var i = 0; i < arr1.length; i++) {
            var val1 = arr1.at(i), val2 = arr2.at(i);
            if (Math.abs(val1.re - val2.re) > eps) {
                return false;
            }
            if (Math.abs(val1.im - val2.im) > eps) {
                return false;
            }
        }
        return true;
    }
    function benchmarkImpl(forProfiling) {
        var params = new Parameters();
        // SHO-type potential
        var baseEnergy = 0.25;
        var xScaleFactor = 1.0 / 4.0;
        var potential = buildPotential(params, .15, function (x) {
            // x is a value in [0, 1)
            // we have a value of 1 at x = 0.5
            var offsetX = 0.5;
            var scaledX = (x - offsetX);
            return baseEnergy + xScaleFactor * (scaledX * scaledX / 2.0);
        });
        var center = algorithms.indexOfMinimum(potential);
        var energy = 2.5;
        var input = {
            potentialMesh: potential,
            energy: energy,
            maxX: params.maxX
        };
        var psi = algorithms.classicallyResolvedAveragedNumerov(input);
        var maxIter = forProfiling ? 1024 : 32;
        var text = "";
        var dx = .1, dfreq = .01;
        // Verify correctness
        var values = psi.values;
        var expected = algorithms.fourierTransformNaive(values.res, center, dx, dfreq);
        if (!arraysAreClose(expected, algorithms.fourierTransform(values.res, center, dx, dfreq))) {
            text += "fourierTransform produces wrong result\n";
        }
        {
            var duration1 = timeThing(maxIter, function () {
                algorithms.fourierTransform(values.res, center, dx, dfreq);
            });
            text += "fourierTransform: " + duration1.toFixed(2) + " ms     ";
        }
        if (!forProfiling) {
            var duration2 = timeThing(maxIter, function () {
                algorithms.fourierTransformNaive(values.res, center, dx, dfreq);
            });
            text += "fourierTransformNaive: " + duration2.toFixed(2) + " ms";
        }
        return text;
    }
    function benchmark() {
        return benchmarkImpl(false);
    }
    visualizing.benchmark = benchmark;
    function runForProfiling() {
        return benchmarkImpl(true);
    }
    visualizing.runForProfiling = runForProfiling;
})(visualizing || (visualizing = {}));
