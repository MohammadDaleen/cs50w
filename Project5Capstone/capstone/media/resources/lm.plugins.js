LM.plugins.lazyLoad = (function ($) {
    var defaults = {
        lazyLoadAutoInit: true
    }
    var settings = Object.assign({}, defaults, LM.settings);

    function initVariables() {
        $.lazyLoadXT.edgeY = 500;
        $.lazyLoadXT.edgeX = 500;
        $.lazyLoadXT.updateEvent = 'load orientationchange resize scroll touchmove';
        $.lazyLoadXT.visibleOnly = false;
        $.lazyLoadXT.srcAttr = 'data-src';
        $.lazyLoadXT.selector = 'img[data-src], iframe[data-src], video, audio, source[data-src]';
        $.lazyLoadXT.autoInit = false;
    }

    function initLazyLoad(checkVisibleCallback, onload, scrollContainer) {
        $.extend($.lazyLoadXT, {
            onload: onload
        });
        $(window).lazyLoadXT({
            checkVisibleCallback: checkVisibleCallback,
            scrollContainer: scrollContainer
        });
    }

    initVariables();

    if (settings.lazyLoadAutoInit) {
        LM.bind('init', init);
    }

    function init() {
        if (arguments.length === 3) {
            initLazyLoad.call(this, arguments[0], arguments[1], arguments[2])
        } else {
            initLazyLoad();
        }
    }

    return {
        init: init
    };
})(jQuery);

LM.plugins.katex = (function () {
    function initKatex() {
        var formulas = document.querySelectorAll('.formula');

        for (var i = 0; i < formulas.length; i++) {
            var el = formulas[i];

            if (el.children.length === 0) {
                var latex = el.textContent;

                try {
                    katex.render(latex, el, { displayMode: true });
                } catch (e) {
                    console.error(e.message + '\n\n' + latex);
    
                    el.textContent = latex;
                    el.style.color = 'red';
                }
            }
        }
    }

    function init() {
        initKatex();
    }

    LM.bind('init', init);

    return {
        init: init
    };
})();

LM.plugins.wrappers = (function () {
    var defaults = {
        showDefaultCopyright: false,
        defaultCopyright: '',
        wrappersAutoInit: true
    };

    var settings = Object.assign({}, defaults, LM.settings);

    function initWrappers(state) {
        var elements = document.querySelectorAll('[data-interactive="true"]');
        var viewPort;

        if(LM.settings.viewPort) {
            viewPort = LM.settings.viewPort;
        } else if (LM.settings.container) {
            viewPort = {
                width: LM.settings.container.offsetWidth,
                height: LM.settings.container.offsetHeight
            };
        }
        for (var k = 0; k < elements.length; k++) {
            //temporary, type detection should be done somehow else, only demo
            if (elements[k].nodeName === 'IMG') {
                new PSImageWrapper(elements[k], viewPort, state);
            } else if (elements[k].nodeName === 'IFRAME') {
                if(elements[k].getAttribute('interactive')) {
                    new PSAnimWrapper(elements[k], viewPort, state);
                } else {
                    new PSHtmlWrapper(elements[k], viewPort, state);
                }
            } else if (elements[k].nodeName === 'VIDEO') {
                new PSVideoWrapper(elements[k], viewPort, state);
            } else if (elements[k].nodeName === 'AUDIO') {
                new PSAudioWrapper(elements[k], viewPort, state);
            } else {
                new PSToolWrapper(elements[k], viewPort, state);
            }

            elements[k].setAttribute('data-interactive', 'false');
        }
    }

    function init(state) {
        initWrappers(state);
    }

    if (settings.wrappersAutoInit) {
        LM.bind('init', init);
    }
    return {
        init: init
    };
})();
