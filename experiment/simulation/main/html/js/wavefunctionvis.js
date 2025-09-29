/// <reference path='./algorithms.ts'/>
var visualizing;
(function (visualizing) {
    // Higher level function! Given a ValueAt, returns a new ValueAt representing its magnitude
    function magnitudeSquaredOf(originalFunc) {
        return function (index, time) {
            var mag2 = originalFunc(index, time).magnitudeSquared();
            return new algorithms.Complex(mag2, 0);
        };
    }
    // WavefunctionVisualizer presents a wavefunction
    // It can show psi and psiAbs (position-space wavefunction), and also
    // phi and phiAbs (momentum-space wavefunction)
    // This operates a little differently in that it doesn't do anything in setState()
    // This is because its rendering is time-dependent. Thus it does all of its work
    // at draw time, in prepareForRender().
    var WavefunctionVisualizer = /** @class */ (function () {
        function WavefunctionVisualizer(params, animator) {
            var _this = this;
            this.params = params;
            this.animator = animator;
            // The group containing all of our visual elements
            // The parent visualizer should add this to the appropriate scene
            this.group = new THREE.Group();
            // The state tracks which of our four graphs are visible
            this.state_ = new visualizing.State(this.params);
            var psiColor = params.psiColor;
            var phiColor = params.phiColor;
            // Set up materials for our four graphs, and the baseline
            var psiMaterial = {
                color: psiColor,
                linewidth: 5,
                depthTest: false
            };
            var psiAbsMaterial = {
                color: psiColor,
                linewidth: 8,
                transparent: true,
                opacity: .75,
                depthTest: false
            };
            var phiMaterial = {
                color: phiColor,
                linewidth: 5,
                transparent: true,
                opacity: .75,
                depthTest: false
            };
            var phiAbsMaterial = {
                color: phiColor,
                linewidth: 8,
                transparent: true,
                opacity: .75,
                depthTest: false
            };
            var baselineMaterial = {
                color: psiColor,
                linewidth: .5,
                depthTest: false
            };
            // Our baseline doesn't change, so we can just update it once
            this.psiBaseline_ = visualizing.Polyline.create(2, this.group, baselineMaterial);
            this.psiBaseline_.update(function (i) { return visualizing.vector3(i * _this.params.width, 0, 0); });
            // Create our Visualizables 
            this.psiVis_ = new Visualizable(this.params.psiScale, this.params, this.group, psiMaterial);
            this.phiVis_ = new Visualizable(this.params.psiScale, this.params, this.group, phiMaterial);
            this.psiAbsVis_ = new Visualizable(this.params.psiAbsScale, this.params, this.group, psiAbsMaterial);
            this.phiAbsVis_ = new Visualizable(this.params.psiAbsScale, this.params, this.group, phiAbsMaterial);
            // Get told when our animator is going to redraw
            this.animator.addClient(this);
        }
        // Set our global state.
        WavefunctionVisualizer.prototype.setState = function (state) {
            this.state_ = state;
            this.psiVis_.visible = this.state_.showPsi;
            this.psiAbsVis_.visible = this.state_.showPsiAbs;
            this.phiVis_.visible = this.state_.showPhi;
            this.phiAbsVis_.visible = this.state_.showPhiAbs;
        };
        // Sets the wavefunction. Note that the wavefunction is not stored in the 'state' object,
        // since it requires some computation
        WavefunctionVisualizer.prototype.setWavefunction = function (psi) {
            var _this = this;
            if (!psi) {
                this.psiVis_.valueAt = null;
                this.psiAbsVis_.valueAt = null;
                this.phiVis_.valueAt = null;
                this.phiAbsVis_.valueAt = null;
            }
            else {
                visualizing.assert(psi.length === this.params.meshDivision, "Wavefunction has wrong length");
                // The phi (momentum-space) values are the Fourier transform of the psi (position-space) values
                // The fourier transform is expensive, so perform it only if requested (and cache the result)
                // We compute it based on the center, not the potential minimum, because we want to capture
                // the probability of the particle moving left or right
                var freqWavefunctionCache_1 = null;
                var freqWavefunction_1 = function () {
                    if (freqWavefunctionCache_1 === null) {
                        freqWavefunctionCache_1 =
                            psi.fourierTransform(Math.floor(psi.length / 2), _this.params.frequencyScale);
                    }
                    return freqWavefunctionCache_1;
                };
                // Set everyone's valueAts
                var psiValueAt = function (index, time) { return psi.valueAt(index, time); };
                var phiValueAt = function (index, time) { return freqWavefunction_1().valueAt(index, time); };
                this.psiVis_.valueAt = psiValueAt;
                this.psiAbsVis_.valueAt = magnitudeSquaredOf(psiValueAt);
                this.phiVis_.valueAt = phiValueAt;
                this.phiAbsVis_.valueAt = magnitudeSquaredOf(phiValueAt);
            }
        };
        // Called by the redrawer right before it triggers rerendering
        // Here we tell our four visualizables to update
        WavefunctionVisualizer.prototype.prepareForRender = function (time) {
            this.psiVis_.update(time);
            this.psiAbsVis_.update(time);
            this.phiVis_.update(time);
            this.phiAbsVis_.update(time);
        };
        return WavefunctionVisualizer;
    }());
    visualizing.WavefunctionVisualizer = WavefunctionVisualizer;
    // A Visualizable takes a function to calculate a (complex) value
    // at a given x position and time, and then plots that in a Line
    var Visualizable = /** @class */ (function () {
        function Visualizable(scale, params_, group, material) {
            this.scale = scale;
            this.params_ = params_;
            this.valueAt = null;
            this.visible = true;
            this.line_ = visualizing.Polyline.create(this.params_.meshDivision, group, material);
        }
        // Entry point for updating our line according to our valueAt function
        // valueAt produces a complex value. We show the real part on the y axis,
        // and the imaginary part on the z axis
        Visualizable.prototype.update = function (time) {
            var _this = this;
            if (!this.visible || this.valueAt === null) {
                this.line_.setVisible(false);
            }
            else {
                this.line_.setVisible(true);
                this.line_.update(function (index) {
                    var x = _this.params_.xCenterForMeshIndex(index);
                    var yz = _this.valueAt(index, time);
                    var y = -_this.scale * yz.re;
                    var z = _this.scale * yz.im;
                    return visualizing.vector3(x, _this.clamp(y), _this.clamp(z));
                });
            }
        };
        // Helper function to maintain numerical sanity
        // Things can get crazy when we try to compute wavefunctions where none should exist
        // Ensure NaNs don't sneak in, and that we don't send extreme values to the GL renderer        
        Visualizable.prototype.clamp = function (value) {
            var limit = this.params_.height / 2;
            if (isNaN(value))
                value = limit;
            return Math.max(-limit, Math.min(limit, value));
        };
        return Visualizable;
    }());
})(visualizing || (visualizing = {}));
