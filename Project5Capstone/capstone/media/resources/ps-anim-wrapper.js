(function (window) {
    window.PSAnimWrapper = function (element, viewport) {
        this.buttons = [
            {
                type: 'label',
                name: 'animationLabel',
                align: 'left',
                texts: {
                    en: 'INTERACTIVE',
                    de: 'INTERAKTIV'
                }
            }
        ];
        PSHtmlWrapper.call(this, element, viewport);
    }
} (window));
