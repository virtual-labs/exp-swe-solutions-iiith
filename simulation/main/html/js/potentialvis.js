var visualizing;
(function (visualizing) {
    // This is the DOM id of the "Draw" text that appears
    // when we start sketching
    var draw_text_ID = "draw-text";
    // PotentialVisualiazer is a component responsible for showing the
    // current potential and the "sketched potential"
    var PotentialVisualizer = /** @class */ (function () {
        function PotentialVisualizer(params) {
            this.params = params;
            // The group containing all of our visual elements
            // The parent visualizer should add this to the appropriate scene
            this.group = new THREE.Group();
            // The state of the visualizer
            this.state_ = new visualizing.State(this.params);
            // Construct the line showing the potential
            this.potentialLine_ = visualizing.Polyline.create(this.params.meshDivision, this.group, {
                color: 0xFF00FF,
                linewidth: 5,
                depthWrite: false
            });
            this.potentialLine_.setRenderOrder(-5000);
            // Construct the line showing the current sketch 
            this.sketchLine_ = visualizing.Polyline.create(this.params.meshDivision, this.group, {
                color: 0x00FFFF,
                linewidth: 8
            });
            // Construct our background
            var planeGeo = new THREE.PlaneGeometry(this.params.width * 2, this.params.height * 2);
            var planeMat = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false });
            this.background_ = new THREE.Mesh(planeGeo, planeMat);
            this.background_.position.set(this.params.width / 2, this.params.height / 2, 0);
            this.background_.renderOrder = -10000;
            this.group.add(this.background_);
            // Construct our "graph paper"" grid
            var gridSize = Math.max(this.params.width, this.params.height);
            var gridStep = 20;
            this.sketchGrid_ = new THREE.GridHelper(gridSize, gridStep);
            this.sketchGrid_.setColors(0x000000, 0x006385);
            this.sketchGrid_.renderOrder = -9999;
            this.sketchGrid_.rotation.x = Math.PI / 2;
            this.group.add(this.sketchGrid_);
        }
        // Entry point for all state updates 
        PotentialVisualizer.prototype.setState = function (state) {
            this.state_ = state;
            this.sketchGrid_.visible = this.state_.sketching;
            this.setDrawTextShown(state.sketching && state.sketchLocations.length == 0);
            this.redrawPotentialLine();
            this.redrawSketchLine();
        };
        // Called from state update, update the line representing the sketch
        PotentialVisualizer.prototype.redrawSketchLine = function () {
            var _this = this;
            var hasPoints = this.state_.sketchLocations.length > 0;
            this.sketchLine_.setVisible(hasPoints);
            if (hasPoints) {
                this.sketchLine_.update(function (i) {
                    // Lines cannot be resized
                    // Thus we allocate our line to be the maximum number of points we care to support
                    // If our true line has fewer points, just repeat the last line
                    var clampedIdx = Math.min(i, _this.state_.sketchLocations.length - 1);
                    return _this.state_.sketchLocations[clampedIdx];
                });
            }
        };
        // Update the line representing our potential
        // Called from state update
        PotentialVisualizer.prototype.redrawPotentialLine = function () {
            var _this = this;
            var mesh = this.state_.potential;
            var hasPotential = (mesh.length > 0);
            this.potentialLine_.setVisible(hasPotential);
            if (hasPotential) {
                visualizing.assert(mesh.length == this.params.meshDivision, "Bad potential length");
                this.potentialLine_.update(function (index) {
                    var value = mesh[index];
                    var x = _this.params.xCenterForMeshIndex(index);
                    var y = _this.params.convertYToVisualCoordinate(value);
                    var z = 0;
                    return visualizing.vector3(x, y, z);
                });
            }
        };
        // Hide or show the "Draw" text overlay
        // Called from state update
        PotentialVisualizer.prototype.setDrawTextShown = function (flag) {
            document.getElementById(draw_text_ID).style['visibility'] = flag ? 'visible' : 'hidden';
        };
        // Draggable implementation
        // Here the user has started dragging
        PotentialVisualizer.prototype.dragStart = function (raycasterUnused) {
            if (this.state_.sketching) {
                this.state_.modify(function (st) {
                    st.sketchLocations = [];
                });
            }
        };
        // The user dragged to a new location
        // Append that location to the state
        PotentialVisualizer.prototype.dragged = function (raycaster) {
            if (!this.state_.sketching)
                return;
            var intersections = raycaster.intersectObject(this.background_, false);
            if (intersections.length > 0) {
                var where = intersections[0].point;
                var newLoc_1 = visualizing.vector3(where.x + this.params.width / 2, where.y + this.params.height / 2, 0);
                this.state_.modify(function (st) {
                    st.sketchLocations = st.sketchLocations.concat([newLoc_1]);
                });
            }
        };
        // The user stopped dragging. Clear the sketch line and build a potential from it!
        PotentialVisualizer.prototype.dragEnd = function () {
            var _this = this;
            // Do nothing unless we're sketching
            if (!this.state_.sketching)
                return;
            // We are going to construct the new potential from the drag location
            // We do this with a "SampledPotential" potential builder, which builds a potential
            // by interpolating between sampled points.
            // Our drag locations have x in the range [0, params.width), and y in [0, params.height)
            // map to the range [0, 1], and flip the y coordinate so that zero is at the bottom
            var samples = this.state_.sketchLocations.map(function (vec) {
                return { x: vec.x / _this.params.width, y: 1.0 - vec.y / _this.params.height };
            });
            this.state_.modify(function (st) {
                st.sketching = false;
                st.sketchLocations = [];
                // If we have no samples, it's because the user didn't draw any
                // Don't replace the potential in that case 
                if (samples.length > 0) {
                    st.potentialBuilder = algorithms.SampledPotential(samples);
                }
            });
        };
        // Perform hit testing
        PotentialVisualizer.prototype.hitTestDraggable = function (raycaster) {
            var intersections = raycaster.intersectObject(this.background_, false);
            return intersections.length > 0 ? this : null;
        };
        return PotentialVisualizer;
    }());
    visualizing.PotentialVisualizer = PotentialVisualizer;
})(visualizing || (visualizing = {}));
