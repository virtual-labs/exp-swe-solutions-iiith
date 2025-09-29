/// <reference path='./visualizer.ts'/>
// HTML and JavaScript UI stuff (not GL)
var ui;
(function (ui) {
    // Toggle whether events should be routed to iframes
    // This is used during drag-type maneuvers
    function setBlockIFrameEvents(flag) {
        if (flag) {
            document.body.classList.add("noselect");
        }
        else {
            document.body.classList.remove("noselect");
        }
        var elems = document.getElementsByTagName('iframe');
        for (var i = 0; i < elems.length; i++) {
            if (flag) {
                elems[i].classList.add('no-pointer-events');
            }
            else {
                elems[i].classList.remove('no-pointer-events');
            }
        }
    }
    // Helper function to get the pageX/pageY of a MouseEvent or TouchEvent
    function getEventPageXY(evt) {
        var target = null;
        if (evt.targetTouches) {
            // Touch event
            target = evt.targetTouches[0];
        }
        else {
            // Mouse event
            target = evt;
        }
        return { x: target.pageX, y: target.pageY };
    }
    // Helper function to get the global offset of an HTML element
    function getElementOffset(elem) {
        var result = { x: 0, y: 0 };
        var cursor = elem;
        while (cursor != null) {
            result.x += cursor.offsetLeft;
            result.y += cursor.offsetTop;
            cursor = cursor.offsetParent;
        }
        return result;
    }
    // Add event handlers for the rotator knob
    function setupRotatorKnob(rotator, onRotate) {
        var dragging = false;
        var rotation = 0;
        var moveHandler = function (evt) {
            if (dragging) {
                var pageXY = getEventPageXY(evt);
                var bounds = rotator.getBoundingClientRect();
                var x = pageXY.x - bounds.left - bounds.width / 2;
                var y = pageXY.y - bounds.top - bounds.height / 2;
                // x is positive east, negative west
                // y is positive north, negative south
                // a rotation of 0 is pointing up
                // determine rotation about the center
                if (x !== 0 && y !== 0) {
                    rotation = Math.atan2(y, x);
                    // Allow snap-to for the four 90 degree rotations
                    // If we're within eps of one of those rotations, snap to it 
                    var eps = .1;
                    for (var i = -2; i <= 2; i++) {
                        var snapTo = i * Math.PI / 2;
                        if (Math.abs(rotation - snapTo) < eps) {
                            rotation = snapTo;
                            break;
                        }
                    }
                    // a rotation of 0 should be up
                    rotation += Math.PI / 2;
                    rotator.style["transform"] = "rotate(" + rotation + "rad)";
                    if (onRotate) {
                        onRotate(rotation);
                    }
                }
                evt.stopPropagation();
                evt.preventDefault();
            }
        };
        var startRotateHandler = function () {
            if (!dragging) {
                dragging = true;
                document.body.classList.add('noselect');
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('touchmove', moveHandler);
                setBlockIFrameEvents(true);
            }
        };
        var stopRotateHandler = function () {
            if (dragging) {
                dragging = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('touchmove', moveHandler);
                setBlockIFrameEvents(false);
            }
        };
        rotator.addEventListener('mousedown', startRotateHandler);
        rotator.addEventListener('touchstart', startRotateHandler);
        document.addEventListener('mouseup', stopRotateHandler);
        rotator.addEventListener('touchend', stopRotateHandler);
        rotator.addEventListener('touchcancel', stopRotateHandler);
    }
    ui.setupRotatorKnob = setupRotatorKnob;
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["Horizontal"] = 0] = "Horizontal";
        Orientation[Orientation["Vertical"] = 1] = "Vertical";
    })(Orientation = ui.Orientation || (ui.Orientation = {}));
    // Attach event targets to the element with this class
    var SLIDER_TOUCH_EVENT_TARGET_CLASS = 'touch_event_target';
    var SLIDER_CLICK_EVENT_TARGET_CLASS = 'click_event_target';
    // Horizontal and vertical sliders, implemented in HTML
    var Slider = /** @class */ (function () {
        // Construct a Slider either horizontal or vertical, with a Slider element
        function Slider(orientation, element) {
            this.orientation = orientation;
            this.element = element;
            // The position the slider would have if there were no ends
            this.unconstrainedPosition = -1;
            // The actual position of the slider
            this.position = 0;
            // Handler invoked when the slider is dragged
            this.draggedToPositionHandler = function () { };
            if (!Slider.globalInitDone) {
                Slider.globalInitDone = true;
                document.addEventListener('mousemove', function (evt) {
                    if (Slider.draggedSlider)
                        Slider.draggedSlider.tryDrag(evt);
                });
                document.addEventListener('mouseup', function () {
                    if (Slider.draggedSlider)
                        Slider.draggedSlider.stopDragging();
                });
            }
            this.installEventHandlers();
        }
        // Removes the Slider from its parent and discards event handlers
        Slider.prototype.remove = function () {
            this.removeEventHandlers();
            var parent = this.element.parentNode;
            if (parent)
                parent.removeChild(this.element);
        };
        // Updates the position of the Slider
        Slider.prototype.setPosition = function (position) {
            this.position = position;
            if (this.isHorizontal()) {
                this.element.style.left = position + "px";
            }
            else {
                this.element.style.top = position + "px";
            }
        };
        // Sets the value text of the Slider 
        Slider.prototype.setValue = function (value) {
            var valueStr = value.toFixed(2);
            var labelFieldNodeList = this.element.getElementsByClassName("value_text");
            for (var i = 0; i < labelFieldNodeList.length; i++) {
                labelFieldNodeList[i].textContent = valueStr;
            }
        };
        // Mark the slider visible or not
        Slider.prototype.setVisible = function (flag) {
            this.element.style.visibility = flag ? "visible" : "hidden";
        };
        // Helper to return the touch and click event targets
        Slider.prototype.eventTargets = function () {
            var _this = this;
            var getChild = function (cn) { return _this.element.getElementsByClassName(cn)[0]; };
            return {
                touch: getChild(SLIDER_TOUCH_EVENT_TARGET_CLASS),
                click: getChild(SLIDER_CLICK_EVENT_TARGET_CLASS)
            };
        };
        Slider.prototype.installEventHandlers = function () {
            var _this = this;
            var _a = this.eventTargets(), touch = _a.touch, click = _a.click;
            click.onmousedown = function (evt) { return _this.startDragging(evt); };
            Array(touch, click).forEach(function (target) {
                target.ontouchstart = function (evt) { return _this.startDragging(evt); };
                target.ontouchmove = function (evt) { return _this.tryDrag(evt); };
                target.ontouchend = function () { return _this.stopDragging(); };
                target.ontouchcancel = function () { return _this.stopDragging(); };
            });
        };
        Slider.prototype.removeEventHandlers = function () {
            var _a = this.eventTargets(), touch = _a.touch, click = _a.click;
            Array(touch, click).forEach(function (target) {
                target.onmousedown = null;
                target.ontouchstart = null;
                target.ontouchmove = null;
                target.ontouchend = null;
                target.ontouchcancel = null;
            });
        };
        // Called from event handlers. Mark this Slider as dragging!
        Slider.prototype.startDragging = function (evt) {
            Slider.draggedSlider = this;
            Slider.lastPosition = this.getEventPosition(evt);
            this.unconstrainedPosition = this.position;
            evt.preventDefault(); // keeps the cursor from becoming an IBeam
        };
        Slider.prototype.stopDragging = function () {
            Slider.draggedSlider = null;
        };
        // Called during a drag
        // Try to move the Slider to a position
        Slider.prototype.tryDrag = function (evt) {
            if (this !== Slider.draggedSlider) {
                return;
            }
            evt.preventDefault(); // prevents scrolling on mobile?
            var position = this.getEventPosition(evt);
            var positionChange = position - Slider.lastPosition;
            // adjust for the scaling we do when the window size is reduced
            // scaling assumed to be uniform
            var container = this.container();
            var scale = container.offsetHeight / container.getBoundingClientRect().height;
            positionChange *= scale;
            Slider.lastPosition = position;
            this.unconstrainedPosition += positionChange;
            var maxPosition = this.isHorizontal() ? this.container().offsetWidth : this.container().offsetHeight;
            var constrainedPosition = Math.min(Math.max(this.unconstrainedPosition, 0), maxPosition);
            this.draggedToPositionHandler(constrainedPosition);
        };
        // The container is used for position calculations
        // It is either our parent or ourself (TODO: needs justification)
        Slider.prototype.container = function () {
            return this.element.parentElement || this.element;
        };
        Slider.prototype.isHorizontal = function () {
            return this.orientation == Orientation.Horizontal;
        };
        // Returns the event position
        Slider.prototype.getEventPosition = function (evt) {
            var offsetPos = this.isHorizontal() ? this.container().offsetLeft : this.container().offsetTop;
            var pageXY = getEventPageXY(evt);
            var pagePos = this.isHorizontal() ? pageXY.x : pageXY.y;
            return pagePos - offsetPos;
        };
        // Shared variables
        // Only one Slider can be dragged at a time
        Slider.draggedSlider = null;
        Slider.lastPosition = -1;
        Slider.globalInitDone = false;
        return Slider;
    }());
    ui.Slider = Slider;
    // Entry point for initializing dragging 
    function initDragging(container, camera, draggables) {
        var dragSelection = null;
        var mouseIsDown = false;
        var getXY = function (evt) {
            var offset = getElementOffset(container);
            var pageXY = getEventPageXY(evt);
            return { x: pageXY.x - offset.x, y: pageXY.y - offset.y };
        };
        var getRaycaster = function (evt) {
            var _a = getXY(evt), x = _a.x, y = _a.y;
            var x2 = (x / container.offsetWidth) * 2 - 1;
            var y2 = (y / container.offsetHeight) * 2 - 1;
            var mouse = new THREE.Vector2(x2, y2);
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            return raycaster;
        };
        var moveHandler = function (evt) {
            if (mouseIsDown) {
                if (dragSelection) {
                    dragSelection.dragged(getRaycaster(evt));
                    evt.preventDefault();
                }
            }
        };
        var downHandler = function (evt) {
            dragSelection = null;
            var raycaster = getRaycaster(evt);
            for (var i = 0; i < draggables.length && dragSelection === null; i++) {
                dragSelection = draggables[i].hitTestDraggable(raycaster);
            }
            if (dragSelection) {
                dragSelection.dragStart(raycaster);
            }
            mouseIsDown = true;
        };
        var upHandler = function () {
            if (dragSelection) {
                dragSelection.dragEnd();
                dragSelection = null;
                mouseIsDown = false;
            }
        };
        container.addEventListener('mousemove', moveHandler);
        container.addEventListener('touchmove', moveHandler);
        container.addEventListener('mousedown', downHandler);
        container.addEventListener('touchstart', downHandler);
        document.addEventListener('mouseup', upHandler);
        document.addEventListener('touchend', upHandler);
        document.addEventListener('touchcancel', upHandler);
    }
    ui.initDragging = initDragging;
    var IPHONE6_INNERHEIGHT_ADDRESS_BAR_HIDDEN = 551;
    var IPHONE6_INNERHEIGHT_ADDRESS_BAR_VISIBLE = 486;
    var sSmallestClientHeightInLandscape = null;
    function getEffectiveWindowHeight() {
        var height = window.innerHeight;
        var isLandscape = window.orientation === 90 || window.orientation === -90;
        // Hack: in landscape, avoid address bar autohiding trickiness
        // We do this by remembering the smallest height we've seen in landscape
        // and not using a height larger than that
        if (isLandscape) {
            // Hack for iPhone 6
            // Pretend the address bar is hidden
            if (height === IPHONE6_INNERHEIGHT_ADDRESS_BAR_HIDDEN) {
                height = IPHONE6_INNERHEIGHT_ADDRESS_BAR_VISIBLE;
            }
            if (sSmallestClientHeightInLandscape === null || sSmallestClientHeightInLandscape > height) {
                sSmallestClientHeightInLandscape = height;
            }
            height = Math.min(height, sSmallestClientHeightInLandscape);
        }
        return height;
    }
    var sContainerInitialWidth = null, sContainerInitialHeight = null;
    function resizeToFitWindowHeight() {
        var scaleTarget = document.getElementById("ui-scale-target");
        var container = document.getElementById("ui-container");
        if (sContainerInitialWidth === null) {
            sContainerInitialWidth = scaleTarget.offsetWidth;
            sContainerInitialHeight = scaleTarget.offsetHeight;
        }
        // If our window is big enough to accomodate our max height, remove the transform
        var minHeight = 400, maxHeight = sContainerInitialHeight;
        var windowHeight = getEffectiveWindowHeight();
        if (windowHeight >= maxHeight) {
            scaleTarget.style.transform = null;
            container.style.marginRight = null;
            container.style.marginBottom = null;
            return;
        }
        var height = windowHeight;
        height = Math.max(height, minHeight);
        height = Math.min(height, maxHeight);
        var aspectRatio = sContainerInitialWidth / sContainerInitialHeight;
        var ratio = height / maxHeight;
        var dy = (height - maxHeight) / 2, dx = aspectRatio * dy;
        var transform = 'translate(' + dx + 'px,' + dy + 'px)';
        transform += ' scale(' + ratio + ',' + ratio + ')';
        scaleTarget.style.transform = transform;
        // Adjust the marginRight of the container so that the tutorial
        // can fill the space on the right. This lets us fit both in
        // with the iPhone in landscape mode.
        // Note this makes the margin negative, because dx is negative,
        // and Math.floor makes it more negative
        // Do the same with the marginBottom
        container.style.marginRight = Math.floor(2 * dx) + 'px';
        container.style.marginBottom = Math.floor(2 * dy) + 'px';
    }
    ui.resizeToFitWindowHeight = resizeToFitWindowHeight;
})(ui || (ui = {}));
