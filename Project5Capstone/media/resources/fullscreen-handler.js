var FullscreenHandler = (function () {
    var fullscreenElem = null;

    var _enterFullscreen;
    var _exitFullscreen;

    function overrideExists() {
        return window.top.webapp && window.top.webapp.enterFullscreen &&
            window.top.webapp.exitFullscreen;
    }

    function createFullscreenEvent(fullscreenStatus) {
        return new CustomEvent('bsd:fullscreenChange', {
            detail: {
                isFullscreen: fullscreenStatus
            }
        });
    }

    function fullscreenTrigger() {
        var elem = document.fullscreenElement || document.webkitFullscreenElement ||
            document.mozFullScreenElement || document.msFullscreenElement;

        if (!fullscreenElem && elem) {
            fullscreenElem = elem;
            var event = createFullscreenEvent(true);
            elem.dispatchEvent(event);
        } else if (fullscreenElem && !elem) {
            var event = createFullscreenEvent(false);
            fullscreenElem.dispatchEvent(event);
            fullscreenElem = null;
        } else if (fullscreenElem && elem) {
            console.warn('Invalid fullscreen request. One element already in fullscreen focus, cannot move to a different one.');
        }
    }

    if (document.fullscreenEnabled) {
        _enterFullscreen = document.documentElement.requestFullscreen;
        _exitFullscreen = document.exitFullscreen;
        document.addEventListener('fullscreenchange', fullscreenTrigger);
    } else if (document.webkitFullscreenEnabled) {
        _enterFullscreen = document.documentElement.webkitRequestFullscreen;
        _exitFullscreen = document.webkitExitFullscreen;
        document.addEventListener('webkitfullscreenchange', fullscreenTrigger);
    } else if (document.msFullscreenEnabled) {
        _enterFullscreen = document.documentElement.msRequestFullscreen;
        _exitFullscreen = document.msExitFullscreen;
        document.addEventListener('MSFullscreenChange', fullscreenTrigger);
    } else if (document.mozFullScreenEnabled) {
        _enterFullscreen = document.documentElement.mozRequestFullScreen;
        _exitFullscreen = document.mozCancelFullScreen;
        document.addEventListener('mozfullscreenchange', fullscreenTrigger);
    }

    var _handler = Object.create({
        enterFullscreen: function enterFullscreen(element) {
            if (overrideExists()) {
                window.top.webapp.enterFullscreen(element);
                fullscreenElem = element;
                
                element.dispatchEvent(createFullscreenEvent(true));
                // document.fullscreenElement = element;
            } else if (_enterFullscreen) {
                _enterFullscreen.call(element);
            } else {
                alert('The Fullscreen Mode is not supported on your device.');
            }
        },
        exitFullscreen: function exitFullscreen() {
            if (overrideExists()) {
                var elem = fullscreenElem;
                fullscreenElem = null;
                window.top.webapp.exitFullscreen(elem);
                
                elem.dispatchEvent(createFullscreenEvent(false));
                // document.fullscreenElement = null;
            } else {
                _exitFullscreen.call(document);
            }
        },
        isFullscreen: function isFullscreen() {
            if (overrideExists()) {
                return !!fullscreenElem;
            }
            return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        }
    });

    return _handler;
}());