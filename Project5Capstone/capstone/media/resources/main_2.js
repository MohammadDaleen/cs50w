var scriptTag = document.getElementById('pathBase');
if (scriptTag) {
    var pathBase = scriptTag.getAttribute('data-path-base') || '';
}

window.loading = {
    path: pathBase,
    files: [
        'object-assign-polyfill.js', 'custom-event-polyfill.js', 'svg4everybody.min.js',
        'jquery.min.js', 'jquery.lazyloadxt.extra.js', 'katex.min.js', 'konva.min.js',
        'fullscreen-handler.js', 'lm.js', 'ps-tool-wrapper.js', 'ps-image-wrapper.js',
        'ps-html-wrapper.js', 'ps-anim-wrapper.js', 'ps-video-wrapper.js', 'ps-audio-wrapper.js',
        'lm.plugins.js', 'slides.js'
    ]
};

//pathOverwrites let's us change the path to external assets, in case we want to overwrite them from CW
//eliminates the need to change all contents
//it should be injected from somewhere else (ex: CW)
window.pathOverwrites = window.pathOverwrites || {};

//extra files to load:
//it should be injected from somewhere else (ex: CW)
window.additionalFiles = window.additionalFiles || [];
window.loading.files = window.loading.files.concat(window.additionalFiles);

var files = window.loading.files.map(function(file) {
    //if the overwrite says to ignore file let's not laod it
    if (window.pathOverwrites.hasOwnProperty(file) && !window.pathOverwrites[file]) {
        return;
    }
    //if we have a overwrite for a specific file use it, if not use default
    var path = window.pathOverwrites[file] || window.loading.path;

    return path + file;
}).filter(Boolean);

head.load(files, function() {
    svg4everybody()
    LM.sendMessageToParent('contentLoaded', null);
    if (LM.settings.autoInitLM) {
        LM.init();
    }
});
