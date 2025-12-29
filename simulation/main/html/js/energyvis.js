/// <reference path='./ui.ts'/>
// The energy visualizer manages both the sliders and the energy bars
var visualizing;
(function (visualizing) {
    // Private class representing a single energy
    // It wraps up a line and a slider
    // It also has an identifier, which acts as glue between the energies in the model and the UI
    var EnergyBar = /** @class */ (function () {
        function EnergyBar(identifier, slider, group, params) {
            this.identifier = identifier;
            this.slider = slider;
            this.params = params;
            this.line = visualizing.Polyline.create(2, group, { color: 0xFF0000 });
        }
        // Sets the energy, which means updating our line and slider 
        // Energy is in the range [0, 1]
        EnergyBar.prototype.setEnergy = function (energy) {
            var yPosition = this.params.convertYToVisualCoordinate(energy);
            this.line.makeHorizontal(this.params.width, yPosition);
            this.slider.setPosition(yPosition);
            this.slider.setValue(energy * this.params.energyScale);
        };
        return EnergyBar;
    }());
    // EnergyVisualizer maintains a list of EnergyBars, and maps between
    // energies in our model State and what's in the UI
    var EnergyVisualizer = /** @class */ (function () {
        function EnergyVisualizer(container, sliderPrototype, params) {
            this.container = container;
            this.sliderPrototype = sliderPrototype;
            this.params = params;
            // The group containing all of our visual elements
            // The parent visualizer should add this to the appropriate scene
            this.group = new THREE.Group();
            // Dictionary mapping identifiers to Bars
            this.bars_ = {};
            this.state_ = new visualizing.State(this.params);
            visualizing.assert(this.container != null, "Energy slider could not find container");
            visualizing.assert(this.sliderPrototype != null, "Energy slider could not find prototype");
        }
        // Called when we're creating a new energy bar
        // Pick a nice energy for it to have, that doesn't overlap with any existing energies
        // Note our energies are in the range [0, 1)
        EnergyVisualizer.prototype.nextInterestingEnergy = function () {
            // Find the point in [0, 1) furthest from all other points
            // This is naturally in the midpoint between its two closest neighbors
            // This means we can only track one distance
            var usedEnergies = this.state_.energyValues();
            // hack for initial energy
            if (usedEnergies.length == 0) {
                return 0.3;
            }
            // pretend there's a point at each end
            usedEnergies.push(0, 1);
            // Find the longest interval between energies, then pick its midpoint
            usedEnergies.sort();
            var longestIntervalMidpoint = -1;
            var longestIntervalLength = -1;
            for (var i = 0; i + 1 < usedEnergies.length; i++) {
                var length_1 = usedEnergies[i + 1] - usedEnergies[i];
                if (length_1 > longestIntervalLength) {
                    longestIntervalLength = length_1;
                    longestIntervalMidpoint = usedEnergies[i] + length_1 / 2;
                }
            }
            return longestIntervalMidpoint;
        };
        // Entry point from the UI
        // Pick another energy and identifier, and set it in the state - simple!
        EnergyVisualizer.prototype.addEnergySlider = function () {
            var energy = this.nextInterestingEnergy();
            this.state_.modify(function (st) {
                var identifier = EnergyVisualizer.sNextEnergyBarIdentifier++;
                st.energies[identifier + ''] = energy;
            });
        };
        // Entry point from the UI
        // Remove the most recently added energy bar, which is the one with the highest identifier
        // Don't delete the last energy!
        EnergyVisualizer.prototype.removeEnergySlider = function () {
            var energyIDs = Object.keys(this.state_.energies).map(function (val) { return parseInt(val, 10); });
            if (energyIDs.length > 1) {
                var maxID_1 = energyIDs.reduce(function (a, b) { return Math.max(a, b); });
                this.state_.modify(function (st) {
                    delete st.energies[maxID_1];
                });
            }
        };
        // Entry point for our state updates
        EnergyVisualizer.prototype.setState = function (state) {
            this.state_ = state;
            this.applyStateToEnergyBars();
        };
        // Given our current state, rationalize it against our energy bars
        EnergyVisualizer.prototype.applyStateToEnergyBars = function () {
            var _this = this;
            var energies = this.state_.energies;
            // Remove energy bars not found in the energy state
            Object.keys(this.bars_).forEach(function (identifier) {
                if (!(identifier in energies)) {
                    _this.tearDownEnergyBar(_this.bars_[identifier]);
                    delete _this.bars_[identifier];
                }
            });
            // Add new energy bars not found in our list
            // Also update everyone's energy
            for (var energyID in energies) {
                if (!(energyID in this.bars_)) {
                    this.bars_[energyID] = this.makeEnergyBar(energyID);
                }
                this.bars_[energyID].setEnergy(energies[energyID]);
            }
        };
        // Called from the state update.
        // Create a new bar for the given identifier. The caller will install it and set its energy.
        EnergyVisualizer.prototype.makeEnergyBar = function (identifier) {
            var _this = this;
            visualizing.assert(!(identifier in this.bars_), "Identifier already present in bars");
            // Our Slider is given as a "prototype" element
            // Clone it to make a new one, and add it t oour container
            var sliderElem = this.sliderPrototype.cloneNode(true);
            var slider = new ui.Slider(ui.Orientation.Vertical, sliderElem);
            this.container.appendChild(sliderElem);
            // The slider prototype is hidden; make sure our bar shows up
            sliderElem.style.display = "inline-block";
            // Set our callback
            // When the slider is dragged, this just updates the energy
            slider.draggedToPositionHandler = function (position) {
                var energy = _this.params.convertYFromVisualCoordinate(position); // in range [0, 1)
                _this.state_.modify(function (st) {
                    st.energies[identifier] = energy;
                });
            };
            return new EnergyBar(identifier, slider, this.group, this.params);
        };
        // Called from state update
        // Removes a bar's UI elements
        EnergyVisualizer.prototype.tearDownEnergyBar = function (bar) {
            bar.slider.remove();
            bar.line.remove();
        };
        // In order to maintain identity of our energy bars,
        // we have to give them unique identifiers
        EnergyVisualizer.sNextEnergyBarIdentifier = 1;
        return EnergyVisualizer;
    }());
    visualizing.EnergyVisualizer = EnergyVisualizer;
})(visualizing || (visualizing = {}));
