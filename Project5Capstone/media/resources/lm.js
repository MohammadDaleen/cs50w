var LM = (function () {
    var _open;

    var defaults = {
        autoInitLM: true
    };

    //make sure CW LM send the lazyLoadAutoInit param as a query string
    var settings = Object.assign({}, defaults, getQuerySettings());

    if (window.top.webapp && typeof window.top.webapp.open !== 'undefined') {
        _open = window.top.webapp.open;
    } else {
        _open = window.open;
        _open = _open.bind(window);
    }

    var getDiffs = function () {
        return document.querySelectorAll('[diff]');
    };

    var showDiffs = function () {
        var diffNodes = getDiffs();
        for (var i = 0; i < diffNodes.length; i++) {
            diffNodes[i].classList.add('visible');
        }
        this.trigger('diffsVisible');
    };

    var hideDiffs = function () {
        var diffNodes = getDiffs();
        for (var i = 0; i < diffNodes.length; i++) {
            diffNodes[i].classList.remove('visible');
        }
        this.trigger('diffsHidden');
    };

    function init(state) {
        this.trigger('beforeInit');
        this.trigger('init', state);
        sendMessageToParent('contentInited', null);
        this.trigger('afterInit');
    }

    function sendMessageToParent(command, value) {
        var msg = JSON.stringify({
            cmd: command,
            value: value
        });
        window.parent.postMessage(msg, "*");
    }

    return {
        fullscreen: window.FullscreenHandler,
        open: _open,
        sendMessageToParent: sendMessageToParent,

        showDiffs: showDiffs,
        hideDiffs: hideDiffs,
        getDiffs: getDiffs,

        init: init,

        settings: settings,
        plugins: {}
    };
})();

/// from a query string, create an object of parsed values
function getQuerySettings() {
    var hashPos = window.location.search.indexOf('#');
    var endPos = hashPos < 1 ? window.location.search.length : hashPos;
    var params = parseQueryString(window.location.search.slice(1, endPos));

    var querySettings = {};
    Object.keys(params).forEach(function (key) {
        querySettings[key] = parseQueryValue(params[key]);
    });
    return querySettings;
}

/// Parse the query string and return it as an object of key/value strings
function parseQueryString(q) {
    var res = {};
    var params = q.split('&');
    for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        if (p.length === 2) {
            var k = p[0];
            res[k] = decodeURIComponent(p[1].replace(/\+/g, ' '));
        }
    }
    return res;
}

/// transform string values to their primitives (bool/numbers/null/undefined)
function parseQueryValue(val) {
    if (val == "true") return true;
    if (val == "false") return false;
    if (val == "null") return null;
    if (val == "undefined") return;

    var n = +val;
    return isNaN(n) ? val : n;
}

var MicroEvent = function () {};
MicroEvent.prototype = {
    bind: function (event, fct) {
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(fct);
    },
    unbind: function (event, fct) {
        this._events = this._events || {};
        if (event in this._events === false) return;
        this._events[event].splice(this._events[event].indexOf(fct), 1);
    },
    trigger: function (event /* , args... */ ) {
        this._events = this._events || {};
        if (event in this._events === false) return;
        for (var i = 0; i < this._events[event].length; i++) {
            this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }
};

/**
 * mixin will delegate all MicroEvent.js function in the destination object
 *
 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {Object} the object which will support MicroEvent
 */
MicroEvent.mixin = function (destObject) {
    var props = ['bind', 'unbind', 'trigger'];
    for (var i = 0; i < props.length; i++) {
        if (typeof destObject === 'function') {
            destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
        } else {
            destObject[props[i]] = MicroEvent.prototype[props[i]];
        }
    }
    return destObject;
}

// export in common js
if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = MicroEvent;
}

MicroEvent.mixin(LM);