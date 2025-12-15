/// <reference path="../typings/threejs/three.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// Support for drawing "polylines"
// These are line paths
var visualizing;
(function (visualizing) {
    // We can draw lines either with native GL lines,
    // or with a shader. Allow the user to override this with a "lines="
    // parameter in the URL.
    var LineType;
    (function (LineType) {
        LineType[LineType["None"] = 0] = "None";
        LineType[LineType["Native"] = 1] = "Native";
        LineType[LineType["Shader"] = 2] = "Shader";
    })(LineType || (LineType = {}));
    var ExplicitLineTypeCache = undefined;
    function explicitLineType() {
        if (ExplicitLineTypeCache === undefined) {
            // Look in the URI for a value "lines="
            // Hackish!
            if (window.location.search.indexOf("lines=native") >= 0) {
                ExplicitLineTypeCache = LineType.Native;
            }
            else if (window.location.search.indexOf("lines=shader") >= 0) {
                ExplicitLineTypeCache = LineType.Shader;
            }
            else {
                ExplicitLineTypeCache = LineType.None;
            }
        }
        return ExplicitLineTypeCache;
    }
    // Base class for drawing lines
    // "Line" here means a list of 3d points.
    // This could be a fancy function plot, or just a straight line.
    // Lines have a fixed count of points, but the points can change
    // We have a couple of strategies, depending on our client, hence this base class.
    var Polyline = /** @class */ (function () {
        // Lines have a fixed length. It cannot be updated.
        // This reflects the GL observation that instead of resizing a buffer,
        // you might as well create a new one - it costs about the same
        function Polyline(length) {
            this.length = length;
            // The group into which this line has been installed
            this.parent = null;
        }
        // Convenience function. Assuming this line is exactly 2 points long,
        // make it horizontal from X=0 -> width, with Y=yOffset and Z=0
        Polyline.prototype.makeHorizontal = function (width, yOffset) {
            visualizing.assert(this.length == 2, "Line not of length 2");
            this.update(function (i) { return visualizing.vector3(i * width, yOffset, 0); });
        };
        // Convenience function. Assuming this line is exactly 2 points long,
        // make it vertical from Y=0 -> width, with X=xOffset and Z=0
        Polyline.prototype.makeVertical = function (height, xOffset) {
            visualizing.assert(this.length == 2, "Line not of length 2");
            this.update(function (i) { return visualizing.vector3(xOffset, i * height, 0); });
        };
        // Make our line visible or not
        Polyline.prototype.setVisible = function (flag) {
            this.object.visible = flag;
        };
        // Set our line's render order
        // Smaller values are rendered first
        Polyline.prototype.setRenderOrder = function (val) {
            this.object.renderOrder = val;
        };
        // Remove our line from its parent if it has one
        Polyline.prototype.remove = function () {
            if (this.parent) {
                this.parent.remove(this.object);
                this.parent = null;
            }
        };
        // Creation entry point, that chooses the best subclass
        // Creates a line of the given length, adds it to the given parent group
        Polyline.create = function (length, parent, material) {
            var lineType = explicitLineType();
            if (lineType == LineType.None) {
                // Use native lines when we only have two points
                if (length == 2) {
                    lineType = LineType.Native;
                }
                else {
                    lineType = LineType.Shader;
                }
            }
            var result;
            if (lineType === LineType.Native) {
                result = new PolylineNative(length, material);
            }
            else {
                result = new PolylineShader(length, material);
            }
            if (parent) {
                result.parent = parent;
                parent.add(result.object);
            }
            return result;
        };
        return Polyline;
    }());
    visualizing.Polyline = Polyline;
    // Line subclass that uses native WebGL lines
    // Note that Chrome on Windows does not support these well
    // https://bugs.chromium.org/p/chromium/issues/detail?id=60124
    var PolylineNative = /** @class */ (function (_super) {
        __extends(PolylineNative, _super);
        function PolylineNative(length, material) {
            var _this = _super.call(this, length) || this;
            _this.geometry = new THREE.Geometry();
            var zero = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < length; i++) {
                _this.geometry.vertices.push(zero);
            }
            _this.line = new THREE.Line(_this.geometry, new THREE.LineBasicMaterial(material));
            // tell our superclass which element to operate on
            _this.object = _this.line;
            return _this;
        }
        // Simple update() implementation
        PolylineNative.prototype.update = function (cb) {
            for (var i = 0; i < this.length; i++) {
                this.geometry.vertices[i] = cb(i);
            }
            this.geometry.verticesNeedUpdate = true;
        };
        return PolylineNative;
    }(Polyline));
    // Line subclass that uses shaders
    // This uses the "screen space projected lines" technique described here:
    // https://mattdesl.svbtle.com/drawing-lines-is-hard
    var PolylineShader = /** @class */ (function (_super) {
        __extends(PolylineShader, _super);
        function PolylineShader(length, material) {
            var _this = _super.call(this, length) || this;
            _this.geometry = new THREE.BufferGeometry();
            // Length is the length of the path
            // We use two vertices for each element of our path,
            // and each vertex has 3 coordinates.
            var vertexCount = 2 * length;
            var positions = new Float32Array(vertexCount * 3);
            _this.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
            // Determine the line thickness, or use 1
            var thickness = Math.max(1, material['linewidth'] || 0);
            var depthWrite = material.hasOwnProperty('depthWrite') ? material['depthWrite'] : true;
            // Set face indexes
            // we draw two faces (triangles) for each line segment of our path
            // each face has 3 vertices, since it's a triangle
            //                                              
            //    0__2                  
            //    | /|
            //    |/ |
            //    1--3
            //
            var lineSegmentCount = length - 1;
            var faceCount = 2 * lineSegmentCount;
            var faces = new Uint32Array(3 * faceCount);
            var faceVertIdx = 0;
            for (var i = 0; i + 1 < length; i++) {
                var startVertex = i * 2;
                faces[faceVertIdx++] = startVertex + 0;
                faces[faceVertIdx++] = startVertex + 1;
                faces[faceVertIdx++] = startVertex + 2;
                faces[faceVertIdx++] = startVertex + 2;
                faces[faceVertIdx++] = startVertex + 1;
                faces[faceVertIdx++] = startVertex + 3;
            }
            _this.geometry.setIndex(new THREE.BufferAttribute(faces, 1));
            // Compute the "direction" attribute, alternating 1 and -1 for each vertex
            // This tells our shader which way to push each vertex along the normal
            var directions = new Float32Array(vertexCount);
            for (var i = 0; i < vertexCount; i++) {
                directions[i] = (i & 1) ? -1.0 : 1.0;
            }
            _this.geometry.addAttribute('direction', new THREE.BufferAttribute(directions, 1));
            // compute "next" and "previous" locations
            // This is a separate vertex array that is just our original shifted
            // next is shifted left, and previous shifted right
            var nexts = new Float32Array(vertexCount * 3);
            var prevs = new Float32Array(vertexCount * 3);
            _this.geometry.addAttribute('next', new THREE.BufferAttribute(nexts, 3));
            _this.geometry.addAttribute('prev', new THREE.BufferAttribute(prevs, 3));
            // Construct our shader
            var sm = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                uniforms: {
                    color: { type: 'c', value: new THREE.Color(material.color) },
                    thickness: { type: 'f', value: thickness }
                },
                vertexShader: Shaders.vertexCode,
                fragmentShader: Shaders.fragmentCode,
                depthWrite: depthWrite
            });
            sm.transparent = true;
            _this.mesh = new THREE.Mesh(_this.geometry, sm);
            // tell superclass which object to operate on
            _this.object = _this.mesh;
            return _this;
        }
        PolylineShader.prototype.update = function (cb) {
            // The attributes of a geometry are runtime dynamic
            // Do some casting shenanigans to get the types we want
            var attrs = this.geometry.attributes;
            // Helper function to set vertices at a given index
            // Each point is associated with six vertices
            function setVertices(vertices, pointIndex, point) {
                var vertexIdx = pointIndex * 6;
                var x = point.x, y = point.y, z = point.z;
                vertices[vertexIdx++] = x;
                vertices[vertexIdx++] = y;
                vertices[vertexIdx++] = z;
                vertices[vertexIdx++] = x;
                vertices[vertexIdx++] = y;
                vertices[vertexIdx++] = z;
            }
            // Fetch and update our positions, prevs, and nexts arrays
            var positions = attrs.position.array;
            var prevs = attrs.prev.array;
            var nexts = attrs.next.array;
            var lastIdx = this.length - 1;
            for (var i = 0; i < this.length; i++) {
                var pt = cb(i);
                // Our positions array stores the point
                // Our nexts array is positions shifted left
                // Our prevs array is positions shifted right
                setVertices(positions, i, pt);
                if (i > 0)
                    setVertices(nexts, i - 1, pt);
                if (i < lastIdx)
                    setVertices(prevs, i + 1, pt);
                // The first/last points logically have no previous/next point, respectively
                // Just duplicate the current point for them
                if (i === 0)
                    setVertices(prevs, i, pt);
                if (i === lastIdx)
                    setVertices(nexts, i, pt);
            }
            attrs.position.needsUpdate = true;
            attrs.next.needsUpdate = true;
            attrs.prev.needsUpdate = true;
        };
        return PolylineShader;
    }(Polyline));
    visualizing.PolylineShader = PolylineShader;
    // The shaders we use
    var Shaders = {
        // The fragment shader is responsible for shading more distant points darker,
        // To give a 3d effect
        // This is a sort of psuedo-lighting
        // Note that we duplicate some fields from Parameters here
        fragmentCode: "\n            uniform vec3 color;\n            varying float projectedDepth; // depth of the corresponding vertex\n            varying float edgeiness;\n\n            void main() {\n                float cameraDistance = 400.0;\n                float psiScale = 250.0; // maximum size of psi\n                float totalScale = psiScale * .5; // maximum distance that psi can be from its baseline\n                float depthScale = smoothstep(-totalScale, totalScale, cameraDistance - projectedDepth);\n                \n                vec3 mungedColor = color * (1.0 + depthScale) / 2.0;\n                float alpha = 1.0 - pow(abs(edgeiness), 4.0);\n                gl_FragColor = vec4(mungedColor, alpha);\n            }\n        ",
        // The vertex shader is fancier
        // This is responsible for drawing lines of fixed thickness, regardless of depth
        // We have a path, containing a list of points
        // Each point has two vertices at that point
        // Each vertex is also given the previous and next vertex, along that path
        // This allows us to compute the normal (in screen space!) of that path
        // We then push the two points along the normal, in opposite directions
        // See "Screen-Space Projected Lines" from https://mattdesl.svbtle.com/drawing-lines-is-hard
        // Note that this shader also steals some values from the Params. These ought to be passed in.
        vertexCode: "\n            attribute float direction;\n            uniform float thickness;\n            attribute vec3 next;\n            attribute vec3 prev;\n            varying float projectedDepth;\n            varying float edgeiness;\n            \n            void main() {\n                float aspect = 800.0 / 600.0;\n                vec2 aspectVec = vec2(aspect, 1.0);\n                mat4 projViewModel = projectionMatrix * modelViewMatrix;\n                \n                // Project all of our points to model space\n                vec4 previousProjected = projViewModel * vec4(prev, 1.0);\n                vec4 currentProjected = projViewModel * vec4(position, 1.0);\n                vec4 nextProjected = projViewModel * vec4(next, 1.0);\n                \n                // Pass the projected depth to the fragment shader\n                projectedDepth = currentProjected.w;                \n\n                // Get 2D screen space with W divide and aspect correction\n                vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n                vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n                vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n                                \n                // Use the average of the normals\n                // This helps us handle 90 degree turns correctly\n                vec2 tangent1 = normalize(nextScreen - currentScreen);\n                vec2 tangent2 = normalize(currentScreen - previousScreen);\n                vec2 averageTangent = normalize(tangent1 + tangent2);\n                vec2 normal = vec2(-averageTangent.y, averageTangent.x);\n                normal *= thickness/2.0;\n                normal.x /= aspect;\n\n                edgeiness = direction;\n                \n                // Offset our position along the normal\n                vec4 offset = vec4(normal * direction, 0.0, 1.0);\n                gl_Position = currentProjected + offset;\n            }\n        "
    };
})(visualizing || (visualizing = {}));
