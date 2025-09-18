(function (window) {
    window.PSHtmlWrapper = function (element, viewport) {

        //viewport should be defined from a parent and sent to the LM,
        //like courseware sending the size of the viewing area, (not the iframe)

        this.element = element;

        this.buttons = [
            ...(this.buttons || []),
            {
                name: 'copyright'
                // }, {
                //     name: 'popout'
            }, {
                name: 'fullscreen'
            }
        ];

        this.element.addEventListener('load', function () {
            element.contentWindow.document.body.setAttribute('oncopy', 'return false');
            element.contentWindow.document.body.setAttribute('oncut', 'return false');
            element.contentWindow.document.body.setAttribute('onpaste', 'return false');
            element.contentWindow.document.body.setAttribute('ondragstart', 'return false');
            element.contentWindow.document.body.setAttribute('ondrop', 'return false');
        });

        var toolInstance = new PSToolWrapper(this.element, this.buttons, wrapperMethods, viewport);
        this.wrapper = toolInstance.wrapperElement;

        // removes the height from the iframe when fullscreen,
        // to avoid showing a small iframe on bigger screens
        var elementHeight = element.style.getPropertyValue('height');
        this.wrapper.addEventListener('bsd:fullscreenChange', function (evt) {
            var isFullscreen = evt.detail ? evt.detail.isFullscreen :
                LM.fullscreen.isFullscreen();
            var height = isFullscreen ? '' : elementHeight;
            element.style.height = height;
        }, false);

        // to update
        updateQueryString.call(this);
    }

    var wrapperMethods = {
        getRealSize: function (element) {
            try {
                var body = element.contentWindow.document.body;
                return {
                    width: body.scrollWidth,
                    height: body.scrollHeight
                };
            } catch (e) {
                return {
                    width: void 0,
                    height: void 0
                };
            }
        },
		getType: function () {
			return 'animation';
		}
    };

    function updateQueryString() {
        // add settings to the query string
        var dataSrc = this.element.getAttribute('data-src') || this.element.getAttribute('src');

        var separator = '?';
        if (dataSrc.indexOf('?') >= 0) {
            var lastChar = dataSrc[dataSrc.length - 1];
            separator = (lastChar !== '?' && lastChar !== '&') ? '&' : '';
        }

        var params = 'allowFullscreen=false';
        var fullSrc = dataSrc + separator + params;
        this.element.setAttribute('data-src', fullSrc);

        if (this.element.getAttribute('src')) {
            this.element.setAttribute('src', fullSrc);
        }
    }
} (window));
