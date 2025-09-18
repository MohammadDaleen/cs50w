LM.plugins.replaceMeWithPath = (function () {
    var settings = Object.assign({}, LM.settings);

    function init() {
        if (!settings.path) {
            console.error('no path to replace');
            return;
        }

        var replaceable = document.getElementById('replace-content-child');

        if (!replaceable) {
            console.error('no child to replace');
            return;
        }

        var type = getType(settings.type) || getTypeByFile(settings.path);
        var replaceObj = creators['create' + type](settings.path, settings.poster);
        replaceable.outerHTML = replaceObj.outerHTML;
    }

    function getType(type) {
        if (typeof type !== 'string') {
            return;
        }

        type = type.toLowerCase();

        if (type === 'html') {
            return 'Iframe';
        } else if (type === 'pdf') {
            return 'Pdf';
        } else if (type === 'image' || type === 'jpg') {
            return 'Image';
        }
    }

    function getTypeByFile(path) {
        var ext = path.split('.').pop().toLowerCase();

        if (ext === 'jpg' || ext === 'png' || ext === 'gif') {
            return 'Image';
        } else if (ext === 'mp4' || ext === 'ogg') {
            return 'Video';
        } else if (ext === 'pdf') {
            return 'Pdf';
        } else {
            return 'Iframe';
        }
    }

    var creators = {
        createPdf: function (path) {
            return this.createIframe(path, 'pdf');
        },
        createIframe: function (path, pdf) {
            var iframe = document.createElement('iframe');
            iframe.setAttribute('src', path + '#toolbar=0&navpanes=0&scrollbar=0');
            iframe.setAttribute('data-interactive', 'true');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('webkitallowfullscreen', 'true');

            // if it is a PDF default size as they do not have a size
            if (pdf) {
                iframe.setAttribute('style', 'min-width: 640px; min-height: 430px');
            }

            // TODO: consider a different way to detect animations, despite from their path
            // if it is an interactive animation add the 'interactive' attribute
            // animations always reside in a path with the structure: /attachments/[name]/index.html
            var regex = /attachments\/.+\/index\.html/;
            if(regex.test(path)) {
                iframe.setAttribute('interactive', 'true');
            }

            return iframe;
        },
        createVideo: function (path, poster) {
            var video = document.createElement('video');
            video.setAttribute('poster', poster);
    
            var source = document.createElement('source');
            source.setAttribute('src', path);
    
            video.appendChild(source);
            video.setAttribute('data-interactive', 'true');
    
            return video;
        },
        createImage: function (path) {
            var img = document.createElement('img');
            img.setAttribute('src', path);
            img.setAttribute('data-interactive', 'true');
    
            return img;
        }
    };

    LM.bind('beforeInit', init);

    return {
        init: init
    };
})();