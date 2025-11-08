(function (window) {

    window.PSImageWrapper = function (element, viewport, state) {

        var root = this;

        //viewport should be defined from a parent and sent to the LM,
        //like courseware sending the size of the viewing area, (not the iframe)

        // Define option defaults
        this.element = element;
        this.zoomer = void 0;

        this.buttons = [{
            type: 'button',
            name: 'zoomin',
            align: 'left',
            callback: zoomIn.bind(this)
        }, {
            type: 'button',
            name: 'zoomout',
            align: 'left',
            callback: zoomOut.bind(this)
        }, {
            type: 'button',
            name: 'rotate',
            align: 'left',
            callback: doRotate.bind(this)
        }, {
            name: 'copyright'
        // }, {
        //     name: 'popout'
        }, {
            name: 'fullscreen'
        }];

        function getStateTemplate() {
            return {
                type: 'STATE',
                zoom: null,
                position: null,
                rotation: null
            };
        }

        this.stateProvider = {
            setState: function (s) {
                if (root.zoomer && s && typeof root.zoomer.setState === 'function') {
                    root.zoomer.setState(s);
                }
            },
            getState: function () {
                var s = getStateTemplate();
                return Object.assign(s, root.zoomer.getState());
            }
        };

        var wrapperMethods = {
            getRealSize: function (element) {
                return {
                    width: element.naturalWidth,
                    height: element.naturalHeight
                };
            },
            getStateProvider: function () {
                return root.stateProvider;
            },
			getType: function () {
				return 'image';
			}
        };

        var toolInstance = new PSToolWrapper(this.element, this.buttons, wrapperMethods, viewport);
        this.wrapper = toolInstance.wrapperElement;

        // add event listener and explicit call for iOS
        this.wrapper.addEventListener('bsd:fullscreenChange', function () {
            if (root.zoomer && typeof root.zoomer.resize === 'function') {
                root.zoomer.resize();
            }
        }, false);

        this.element.addEventListener('load', function () {
            // additional verification required because of IE
            // right after load IE sometimes returns a value of 0 for the naturalWidth
            validateImageLoad(root.element, function () {
                root.zoomer = new canvasImageZoomer(root.element, root.element.parentNode);
                wrapperMethods.getStateProvider().setState(state);
            });
        }, false);
    };

    function validateImageLoad(imgElement, callback) {
        if (imgElement.complete && imgElement.naturalWidth !== 0) {
            callback.call();
        } else {
            var img = new Image();
            img.onload = function () {
                callback.call()
            };
            img.src = imgElement.src;
        }
    }

    function doRotate() {
        this.zoomer.rotateLeft();
    }

    function zoomIn() {
        this.zoomer.zoomIn();
    }

    function zoomOut() {
        this.zoomer.zoomOut();
    }
} (window));


(function (window) {
    window.canvasImageZoomer = function (image, container) {
        var root = this;

        // const
        var rotationStep = 90; // degrees
        var zoomStep = 0.2;
        var originalSize = {
            width: image.naturalWidth,
            height: image.naturalHeight
        };

        var stageSize = {
            width: container.offsetWidth,
            height: container.offsetHeight
        };
        var lastDist = 0;
        var minScale = 1;
        var currentScale = 1;
        var canBeInitialized = false;

        var imageObj = new Konva.Image({
            x: 0,
            y: 0,
            width: originalSize.width,
            height: originalSize.height,
            offsetX: originalSize.width / 2,
            offsetY: originalSize.height / 2,
            image: image,
            draggable: true,
            dragBoundFunc: checkPosition
        });

        imageObj.on('dragstart', function() {
            window.addEventListener("mousemove", mouseRelease, true);
        });

        function mouseRelease(evt) {
            var btnPressed = typeof evt.buttons === 'number' ? evt.buttons !== 0 : evt.which !== 0;

            if (!btnPressed) {
                imageObj.stopDrag();
                window.removeEventListener("mousemove", mouseRelease, true);
            }
        }

        var layer = new Konva.Layer();
        
        var stage = new Konva.Stage({
            container: container,
            width: stageSize.width,
            height: stageSize.height
        });

        layer.add(imageObj);
        layer.draw();
        stage.add(layer);

        function checkPosition(pos) {
            pos = pos || imageObj.getPosition();
            var rect = imageObj.getClientRect();
            pos.x = constrainPos(pos, rect, 'x');
            pos.y = constrainPos(pos, rect, 'y');
            return pos;
        }

        function constrainPos(pos, rect, axis) {
            var side = axis === 'x' ? 'width' : 'height';
            var size = stage[side]();
            var rectSide = rect[side];
            var rectHalfSide = rectSide / 2;

            if (rectSide > size) {
                if (pos[axis] - rectHalfSide > 0) {
                    pos[axis] = rectHalfSide;
                } else if (pos[axis] + rectHalfSide < size) {
                    pos[axis] = size - rectHalfSide;
                }
            } else {
                if (pos[axis] - rectHalfSide < 0) {
                    pos[axis] = rectHalfSide;
                } else if (pos[axis] + rectHalfSide > size) {
                    pos[axis] = size - rectHalfSide;
                }
            }

            return pos[axis];
        }

        this.getState = function () {
            return {
                zoom: currentScale,
                rotation: imageObj.rotation(),
                position: imageObj.position()
            }
        }

        this.setState = function () {
            // Do nothing, allow auto re-centering of the image
        }

        this.reset = function () {
            imageObj.rotate(0);
            root.fit();
        }

        this.fit = function () {
            minScale = getMinScale();
            // if min scale greater than 0 means that container has a size, so we can consider this initiated
            // on resize we check only, otherwise we do the fit
            if (minScale > 0) {
                canBeInitialized = true;
            }

            zoom(minScale);
            root.center();
            layer.draw();
        }

        this.center = function () {
            imageObj.setX(stage.width() / 2);
            imageObj.setY(stage.height() / 2);
        }

        this.zoomOut = function (pos) {
            zoom(currentScale - zoomStep, pos);
            layer.draw();
        }

        this.zoomIn = function (pos) {
            zoom(currentScale + zoomStep, pos);
            layer.draw();
        }

        this.rotateLeft = function () {
            doRotate(-1);
        }

        this.rotateRight = function () {
            doRotate(1);
        }

        /// get minimum scale coefficient to fit the image in the zoombox
        function getMinScale() {
            var rect = imageObj.getClientRect();
            return Math.min(stage.width() / rect.width * imageObj.scaleX(),
                stage.height() / rect.height * imageObj.scaleY());
        }

        function doRotate(direction) {
            imageObj.rotate(direction * rotationStep);

            root.fit();
            layer.draw();
        }

        function zoom(zoom, zoomCenterPos) {
            if (isNaN(zoom) || zoom <= 0) {
                return;
            }

            if (zoom < minScale) {
                zoom = minScale;
            }

            imageObj.scale({
                x: zoom,
                y: zoom
            });
            
            imageObj.preventDefault(zoom !== minScale);

            if (zoomCenterPos) {
                var newPos = {
                    x: zoomCenterPos.x - (zoomCenterPos.x - imageObj.x()) * zoom / currentScale,
                    y: zoomCenterPos.y - (zoomCenterPos.y - imageObj.y()) * zoom / currentScale
                };

                newPos = checkPosition(newPos);
                imageObj.position(newPos);
            } else {
                imageObj.position(checkPosition());
            }

            currentScale = zoom;
        }

        stage.addEventListener('wheel', function (e) {
            if (e.metaKey === true || e.ctrlKey === true) {
                e.preventDefault();

                var zoomInOut = e.deltaY < 0 ? root.zoomIn : root.zoomOut;
                zoomInOut.call(root, stage.getPointerPosition());

                stage.batchDraw();
            }
        });

        this.resize = function () {
            var currentZoom = Math.min(container.offsetWidth / originalSize.width,
                container.offsetHeight / originalSize.height);

            stageSize.width = container.offsetWidth;
            stageSize.height = container.offsetHeight;
            stage.width(stageSize.width);
            stage.height(stageSize.height);

            if (canBeInitialized) {
                minScale = getMinScale();
                var middle = {
                    x: container.offsetWidth / 2,
                    y: container.offsetHeight / 2
                };

                zoom(currentZoom, middle);

                // if minscale > 0 means that we can check bounds
                if (minScale > 0) {
                    imageObj.position(middle);
                }
            } else {
                root.fit();
            }

            stage.draw();
        };

        window.addEventListener("resize", this.resize, false);

        stage.getContent().addEventListener('mousedown', function (evt) {
            evt.stopImmediatePropagation();
        });
        stage.getContent().addEventListener('touchstart', function (evt) {
            evt.stopImmediatePropagation();
        });

        stage.getContent().addEventListener('touchmove', function (evt) {
            var touch1 = evt.touches[0];
            var touch2 = evt.touches[1];

            if (touch1 && touch2 && imageObj) {
                var p1 = {
                    x: touch1.clientX,
                    y: touch1.clientY
                };
                var p2 = {
                    x: touch2.clientX,
                    y: touch2.clientY
                };
                var dist = getDistance(p1, p2);

                if (!lastDist) {
                    lastDist = dist;
                }

                var scale = imageObj.scaleX() * dist / lastDist;

                zoom(scale, getMidPoint(p1, p2));

                layer.draw();
                lastDist = dist;

                evt.preventDefault();
            }
        }, false);

        stage.getContent().addEventListener('touchend', function () {
            lastDist = 0;
        }, false);

        function getDistance(p1, p2) {
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }

        function getMidPoint(p1, p2) {
            return {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            };
        }

        root.fit();
    };

}(window));