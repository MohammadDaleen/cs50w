(function() {

    var Layout = {
        FIXED_HEIGHT: 'fixed-height',
        RESPONSIVE: 'responsive',
        FILL: 'fill'
    };

    // default timeout (in ms) to hide the toolbar in fullscreen mode
    var defaultToolbarTimeout = 4000;

    // predefined states to toggle the toolbar
    var ToolbarState = {
        OPEN: { open: true },
        OPEN_AND_CLOSE_DELAYED: { open: true, autoCloseDelay: defaultToolbarTimeout },
        CLOSE: { open: false }
    };

    // events that will open the toolbar in fullscreen mode
    var interactionEvents = [
        'mousemove',
        'touchmove',
        'click'
    ];

    // var wrapperPopupName = 'popout-wrapper.html';
    // svgPaths is provided from our authoring PCF, so this should work in the authoring tool or the LMS app
    var svgSpriteName = 'sprite.svg';
    var wrapperBase = '';
    /*
     * structure of the wrapper:
     * .interactive-container - top level wrapper, makes it responsive and handles the height
     *   .interactive-wrapper - the main wrapper which takes all available space
     *      .interactive-wrapper-main - the wrapper for the main interactive part
                .content-wrapper - wrapper for the content
     *              .fluid-child - tells to take 100% percent of width and height
     *          .wrapper-tool-bar - the toolbar where the buttons are added
     */

    window.PSToolWrapper = function(element, toolbarElementDefs, wrapperMethods, viewport) {

        var root = this;

        //viewport should be defined from a parent and sent to the LM,
        //like courseware sending the size of the viewing area, (not the iframe)

        this.element = element;
        this.element.addEventListener('load', function() {
            var size = getRealSize.call(root);

            size.width = (size.width || 0) + 2; // plus 2 padding to avoid scroll
            size.height = (size.height || 0) + 52; // plus toolbar height

            LM.sendMessageToParent("popup:loaded", size);
        });

        this.originalElement = element.cloneNode(true);
        this.wrapperMethods = wrapperMethods;

        var scriptTag = document.getElementById('pathBase');
        if (scriptTag) {
            wrapperBase = scriptTag.getAttribute('data-path-base') || wrapperBase;
        }

        this.toolbarTimeout = null;

        var defaultToolbarElements = [{
            type: 'button',
            name: 'copyright',
            align: 'right',
            callback: toggleCopyright,
            checkVisibility: canShowCopyright
        }, {
            type: 'button',
            name: 'popout',
            align: 'right',
            callback: popout,
            checkVisibility: canShowPopout
        }, {
            type: 'button',
            name: 'fullscreen',
            align: 'right',
            states: ['on', 'off'],
            callback: toggleFullscreen,
            checkState: checkFullscreenState
        }];

        if (toolbarElementDefs && toolbarElementDefs.length) {
            // let's extend the buttons with default functionality
            // this let's us specify we want fullscreen button
            // without providing another callback
            for (var i = 0; i < toolbarElementDefs.length; i++) {
                var defaultDef = findDefault(toolbarElementDefs[i], defaultToolbarElements);

                for (var key in defaultDef) {
                    if (typeof toolbarElementDefs[i][key] === 'undefined') {
                        toolbarElementDefs[i][key] = defaultDef[key];
                    }
                }
            }
        } else {
            toolbarElementDefs = defaultToolbarElements;
        }
        this.toolbarElementDefs = toolbarElementDefs;

        var parent = this.element.parentNode;
        var wrapper;
        if (this.element.nodeName === 'AUDIO') {
            wrapper = buildOutAudio.call(this);
        } else {
            wrapper = buildOut.call(this, viewport);
        }

        parent.appendChild(wrapper);
        this.wrapperElement = parent.querySelector('.interactive-wrapper');
        this.containerElement = parent.querySelector('.interactive-container');

        initializeEvents.call(this);
        checkToolsState.call(this);
    };

    // check if there exist a default definition for the current element name
    function findDefault(elementDef, defaults) {
        for (var i = 0; i < defaults.length; i++) {
            if (defaults[i].name === elementDef.name) {
                return defaults[i];
            }
        }
    }
    // Public Methods
    PSToolWrapper.prototype.init = function() { };

    // Private Methods
    function buildOutAudio() {
        // the fragment will contain the element itself and directly the audio bar
        var docFrag = document.createDocumentFragment();

        var toolbar = document.createElement('div');
        toolbar.className = 'audio_player';

        var src = this.element.getAttribute('data-src') || this.element.getAttribute('src');
        var type = this.wrapperMethods.getType() || 'toolbar';
        toolbar.setAttribute('data-original-src', src);
        toolbar.setAttribute('data-original-type', type);
        this.element.removeAttribute('data-media');

        toolbar.appendChild(this.element);

        for (var i = 0; i < this.toolbarElementDefs.length; i++) {
            var tbe = createToolbarElement(this.toolbarElementDefs[i]);
            this.toolbarElementDefs[i].element = tbe;
            toolbar.appendChild(tbe);
        }

        docFrag.appendChild(toolbar);

        return docFrag;
    }

    function buildOut(viewport) {
        var docFrag;
        var maxHeight = 999999;

        var parent = this.element.parentNode;
        var parentWidth = parent ? parent.offsetWidth : 0;

        //only if it is undefined default it to window,
        //this lets us overwrite it with false
        if (typeof viewport === 'undefined') {
            viewport = {
                width: window.innerWdith,
                height: window.innerHeight,
            };
        }
        if (viewport && viewport.height) {
            maxHeight = viewport.height * 0.8;
        }
        var widthAttr = this.element.getAttribute('width');
        var heightAttr = this.element.getAttribute('height');
        var layoutAttr = this.element.getAttribute('layout');

        var width = parseInt(widthAttr);
        var height = parseInt(heightAttr);
        var aspect = Math.min(height, maxHeight) / width;

        var layout;

        if (layoutAttr) {
            layout = layoutAttr;
        } else if (height && !width) {
            layout = Layout.FIXED_HEIGHT;
        } else if (height && width) {
            layout = Layout.RESPONSIVE;
        } else {
            layout = Layout.FILL;
        }

        // create fragment to build out the whole panel
        docFrag = document.createDocumentFragment();
        var wrapperDom = document.createElement('div');
        wrapperDom.className = 'interactive-wrapper';

        var topLevelContainer = wrapperDom;

        if (layout !== Layout.FILL) {
            var container = document.createElement('div');
            container.className = 'interactive-container';
            container.appendChild(wrapperDom);

            topLevelContainer = container;
        }

        var src = this.element.getAttribute('data-src') || this.element.getAttribute('src');
        var type = this.wrapperMethods.getType() || 'toolbar';
        topLevelContainer.setAttribute('data-orginal-src', src);
        topLevelContainer.setAttribute('data-orginal-type', type);
        this.element.removeAttribute('data-media');

        var wrapperMain = document.createElement('div');
        wrapperMain.className = 'interactive-wrapper-main';
        wrapperMain.style.maxHeight = screen.height + "px";
        wrapperMain.style.maxWidth = screen.width + "px";
        wrapperDom.appendChild(wrapperMain);

        var wrapperContent = document.createElement('div');
        wrapperContent.classList.add('content-wrapper');

        this.element.classList.add('fluid-child');
        wrapperContent.appendChild(this.element);
        wrapperMain.appendChild(wrapperContent);

        if (layout === Layout.FIXED_HEIGHT) {
            topLevelContainer.style.height = (height + 50) + 'px';

            if (viewport && viewport.height) {
                // decide here what to do, maybe better vh instead of px
                topLevelContainer.style.maxHeight = maxHeight + 'px';
            }

        } else if (layout === Layout.RESPONSIVE) {
            var scaleFactor = parentWidth ? Math.min(width / parentWidth, 1.0) : 1.0;
            topLevelContainer.style.paddingTop = (aspect * scaleFactor * 100) + '%';
        }

        var wrapperToolBar = document.createElement('div');
        wrapperToolBar.classList.add('wrapper-tool-bar');
        wrapperMain.appendChild(wrapperToolBar);

        var wrapperCopyright = document.createElement('div');
        wrapperCopyright.className = 'wrapper-copyright';
        wrapperCopyright.innerText = this.element.getAttribute('data-copyright') || LM.settings.defaultCopyright;
        wrapperMain.appendChild(wrapperCopyright);

        var toolBarLeftPane = document.createElement('div');
        toolBarLeftPane.className = 'left-pane';

        var toolBarRightPane = document.createElement('div');
        toolBarRightPane.className = 'right-pane';

        for (var i = 0; i < this.toolbarElementDefs.length; i++) {
            var tbe = createToolbarElement(this.toolbarElementDefs[i]);
            this.toolbarElementDefs[i].element = tbe;
            if (this.toolbarElementDefs[i].align === 'right') {
                toolBarRightPane.appendChild(tbe);
            } else {
                toolBarLeftPane.appendChild(tbe);
            }
        }

        wrapperToolBar.appendChild(toolBarLeftPane);

        // only add right pane if not empty
        if (toolBarRightPane.children.length > 0) {
            wrapperToolBar.appendChild(toolBarRightPane);
        }

        docFrag.appendChild(topLevelContainer);

        return docFrag;
    }

    // elemDef:
    // - type (element, label, *)
    // - name
    // - *element (necessary if type="element")
    // - *texts (necessary if type="label")
    function createToolbarElement(elemDef) {
        if (elemDef.type === 'element') {
            return elemDef.element;
        } else if (elemDef.type === 'label') {
            var label = document.createElement('div');
            label.className = 'label';
            label.innerText = elemDef.texts.en;
            return label;
        }

        // default to button, uses svg for symbol
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-' + elemDef.name;

        var states = elemDef.states || [null];
        for (var i = 0; i < states.length; i++) {
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            var name = 'svg-' + elemDef.name;
            if (states[i]) {
                name += '-' + states[i];
                svg.setAttribute('class', name); // classList and className have issues with svg elements in IE
            }

            // wrapperbase is "something/js" i need to replace it with "something/svg"
            var wrapperBaseSvg = wrapperBase.replace('js', 'svg');
            var relativeSvgPath = wrapperBaseSvg + svgSpriteName;
            var svgPath = (window.svgPaths && window.svgPaths[0]) ?? relativeSvgPath
            var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', svgPath + '#' + name);

            svg.appendChild(use);
            btn.appendChild(svg);
        }

        return btn;
    }

    function checkToolsState() {
        for (var i = 0; i < this.toolbarElementDefs.length; i++) {
            var button = this.toolbarElementDefs[i];

            if (button.element) {
                if (typeof button.checkState === 'function') {
                    toggleClass(button.element, 'on', button.checkState.call(this));
                }

                if (typeof button.checkVisibility === 'function') {
                    setVisibility(button.element, button.checkVisibility.call(this));
                }
            }
        }
    }

    function setVisibility(element, visible) {
        element.style.display = visible ? 'inline-block' : 'none';
    }

    function initializeEvents() {
        function buttonCallback(thisArg, callback, evt) {
            if (!isDisabled(evt.currentTarget) && typeof callback === 'function') {
                callback.call(thisArg, evt);
            }
        }

        // audio elements do not have a wrapperElement (and don't need the fullscreen event)
        if (this.wrapperElement) {
            this.wrapperElement.addEventListener('bsd:fullscreenChange', onFullscreenChange.bind(this), false);

            // register listener to receive events, when the user clicks on the screen or moves the cursor/finger
            // this is used to show the toolbar on each interaction, when the wrapper is displayed in fullscreen
            // note: for an iframe this is attached to the body of the iframe document, once it is loaded
            if (this.element.nodeName === "IFRAME") {
                this.element.addEventListener('load', onIframeLoaded.bind(this, this, this.element), false);
            } else {
                interactionEvents.forEach(e => {
                    this.wrapperElement.addEventListener(e, onUserInteraction.bind(this), false);
                });
            }
        }

        for (var i = 0; i < this.toolbarElementDefs.length; i++) {
            var button = this.toolbarElementDefs[i];

            if (button.element) {
                button.element.addEventListener('click', buttonCallback.bind(this, this, button.callback), false);
            }
        }
    }

    function onIframeLoaded(scope, iframeElement) {
        interactionEvents.forEach(e => {
            iframeElement.contentWindow.document.addEventListener(e, onUserInteraction.bind(scope), false);
        });

        var nestedIframe = iframeElement.contentWindow.document.body.querySelector('iframe');
        if (nestedIframe) {
            nestedIframe.addEventListener('load', onIframeLoaded.bind(this, scope, nestedIframe));
        }
    }

    function onFullscreenChange(e) {
        var fullscreen = checkFullscreenState();
        toggleClass(e.currentTarget.querySelector('.btn-fullscreen'), 'on', fullscreen);

        // e.currentTarget is the 'interactive-wrapper' element
        // setting the 'fullscreen' class on this element also allows all children to react to it
        toggleClass(e.currentTarget, 'fullscreen', fullscreen);

        // open the toolbar. set a timer to automatically close it, when in fullscreen
        var state = fullscreen ? ToolbarState.OPEN_AND_CLOSE_DELAYED : ToolbarState.OPEN;
        setToolbarState(this, state);
    }

    function onUserInteraction(e) {
        var fullscreen = checkFullscreenState();
        if (fullscreen) {
            setToolbarState(this, ToolbarState.OPEN_AND_CLOSE_DELAYED);
        }
    }

    function isDisabled(el) {
        return el.classList.contains('disabled');
    }

    function toggleFullscreen() {
        if (!LM.fullscreen.isFullscreen()) {
            LM.fullscreen.enterFullscreen(this.wrapperElement);
        } else {
            LM.fullscreen.exitFullscreen();
        }
    }

    function checkFullscreenState() {
        return LM.fullscreen.isFullscreen();
    }

    function setToolbarState(scope, state) {
        state = state || ToolbarState.OPEN;

        if (scope.toolbarTimeout) {
            clearTimeout(scope.toolbarTimeout);
            scope.toolbarTimeout = null;
        }

        var toolbar = scope.wrapperElement.querySelector('.wrapper-tool-bar');
        if (state.open) {
            toggleClass(toolbar, 'closed', false);

            if (state.autoCloseDelay) {
                scope.toolbarTimeout = setTimeout(
                    () => setToolbarState(scope, ToolbarState.CLOSE),
                    state.autoCloseDelay
                );
            }
        } else {
            toggleClass(toolbar, 'closed', true);
        }
    }

    function getRealSize() {
        var size = this.wrapperMethods.getRealSize(this.element);
        size.width = size.width || 0;
        size.height = size.height || 0;

        if (size.width > 200 && size.height > 200) {
            return size;
        }

        var minWidth = parseInt(this.element.getAttribute('width')) || this.element.offsetWidth;
        var minHeight = parseInt(this.element.getAttribute('height')) || this.element.offsetHeight;

        return {
            width: Math.max(minWidth, size.width),
            height: Math.max(minHeight, size.height)
        };
    }

    function popout() {
        if (this.popupWindow && this.popupWindow.focus && !this.popupWindow.closed) {
            this.popupWindow.focus();
            return;
        }
        var size = getRealSize.call(this);

        var maxWidth = screen.width - 200;
        var maxHeight = screen.height - 200;
        var w = Math.min(maxWidth, size.width);
        var h = Math.min(maxHeight, size.height + 50); // +50 toolbar height, could be good to be refactored
        var left = ((maxWidth / 2) - (w / 2)) + 100;
        var top = ((maxHeight / 2) - (h / 2)) + 100;

        var stateProvider = this.wrapperMethods.getStateProvider;
        var state = typeof stateProvider === 'function' ? stateProvider().getState() : null;

        // I have to store it in a global to be accessible from CW
        // not the best solution, should be improved
        if (typeof this.wrapperMethods.beforePopout === 'function') {
            this.wrapperMethods.beforePopout();
        }
        window.popupWindow = this.popupWindow = openInPopout(w, h, left, top, this.originalElement, state);

        // TODO: Find out why this listener is not working as expected on jxBrowser
        var root = this;
        this.popupWindow.addEventListener('beforeunload', function() {
            root.popupWindow = null;
            LM.sendMessageToParent('popup:closed', null);
        }, true);

        LM.sendMessageToParent('popup:opened', null);
    }

    function canShowPopout() {
        var popable = this.element.getAttribute('data-popable');
        return LM.open && popable !== 'false';
    }

    function openInPopout(w, h, left, top, originalElement, state) {
        var wrapperPath = wrapperBase + wrapperPopupName;

        var base = location.pathname.substring(0, location.pathname.lastIndexOf('/')) + "/" + wrapperPath;

        var url = location.protocol + '//' + location.host + base;
        var name = originalElement.getAttribute('data-src');

        var injectedElement = originalElement.cloneNode(true);
        injectedElement.setAttribute('layout', 'fill');
        injectedElement.setAttribute('data-popable', 'false');
        injectedElement.removeAttribute('style');

        var nodes = [injectedElement];
        var childs = injectedElement.childNodes;

        for (var i = 0; i < childs.length; ++i) {
            if (childs[i].nodeType == Node.ELEMENT_NODE) {
                nodes.push(childs[i]);
            }
        }

        //images/image.jpg (root) -> js/../images/image.jpg (from js folder)
        // / -> js/popoutWrapper.html
        nodes.forEach(function(node) {
            var src = node.getAttribute('data-src') || node.getAttribute('src');
            if (src) {
                node.setAttribute('data-src', relativePath(wrapperBase, src));
                node.removeAttribute("src");
            }

            src = node.getAttribute('data-poster') || node.getAttribute('poster');
            if (src) {
                node.setAttribute('data-poster', relativePath(wrapperBase, src));
                node.removeAttribute("poster");
            }
        });

        var newWindow = LM.open(url, name, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

        var initTimer = setInterval(function() {
            if (typeof newWindow.head !== 'undefined') {
                clearInterval(initTimer);

                newWindow.head.ready(function() {
                    replaceContent(newWindow, injectedElement, state);
                });
            }
        }, 100);

        // Puts focus on the newWindow
        if (typeof newWindow.focus === 'function') {
            newWindow.focus();
        }
        return newWindow;
    }

    function replaceContent(newWindow, injectedElement, state) {
        var replaceMe = newWindow.document.getElementById('replace-content-child');
        replaceMe.outerHTML = injectedElement.outerHTML;
        console.log('Popout wrapper loaded, replacing content with', injectedElement.outerHTML);
        newWindow.LM.init(state);
    }

    /// Copyright
    function toggleCopyright() {
        toggleClass(this.wrapperElement.querySelector('.wrapper-copyright'), 'show');
    }

    function canShowCopyright() {
        var copyright = this.element.getAttribute('data-copyright');
        return !!copyright || LM.settings.showDefaultCopyright;
    }

    function relativePath(from, to) {
        if (isAbsolute(to)) {
            return to;
        }

        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));

        var samePartsLength = commonListLength(fromParts, toParts);

        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push('..');
        }

        outputParts = outputParts.concat(toParts.slice(samePartsLength));

        return outputParts.join('/');
    }

    function commonListLength(arr1, arr2) {
        var length = Math.min(arr1.length, arr2.length);
        for (var i = 0; i < length; i++) {
            if (arr1[i] !== arr2[i]) {
                return i;
            }
        }
        return length;
    }

    function trim(arr) {
        for (var start = 0; start < arr.length && arr[start] === ''; start++) { }
        for (var end = arr.length - 1; end >= 0 && arr[end] === ''; end--) { }

        return start > end ? [] : arr.slice(start, end - start + 1);
    }

    function isAbsolute(url) {
        return /^[a-z][a-z0-9+.-]*:/.test(url);
    }

    function toggleClass(elem, className, add) {
        if (elem && elem.classList) {
            if (add === undefined) {
                add = !elem.classList.contains(className);
            }

            if (add) {
                elem.classList.add(className);
            } else {
                elem.classList.remove(className);
            }
        }
    }
}());
