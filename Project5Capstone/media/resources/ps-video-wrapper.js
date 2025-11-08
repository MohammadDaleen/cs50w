(function (window) {

    window.PSVideoWrapper = function (element, viewport, state) {
        var root = this;
        this.element = element;
        this.toolbarElements = [{
            type: 'button',
            name: 'play',
            align: 'left',
            states: ['play', 'pause']
        }, {
            type: 'button',
            name: 'volume',
            align: 'left',
            states: ['mute', 'unmute'],
            checkVisibility: function () {
                // if iOS, make invisible (return false)
                return !(navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform));
            }
        }, {
            type: 'element',
            name: 'progressText',
            element: initProgressText()
        }, {
            type: 'element',
            name: 'slider',
            element: initSlider()
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
                volume: null,
                currentTime: null,
                pause: null
            }
        }

        this.stateProvider = {
            setState: function (s) {
                if (!videoElem || !s) {
                    return;
                }

                if (s.pause) {
                    videoElem.pause();
                } else if(videoElem.readyState < 4) {
                    videoElem.addEventListener("canplay", function() { videoElem.play(); }, true);
                }

                // checks if the video element is ready, otherwise an InvalidStateException is thrown in browsers other than Chrome
                var setStateValues = function setStateValues(s) {
                    if (videoElem.readyState < 1) {
                        setTimeout(setStateValues.bind(this, s), 100);
                    } else {
                        videoElem.currentTime = s.currentTime;
                        videoElem.volume = s.volume;
                    }
                };

                setStateValues(s);
            },
            getState: function () {
                var s = getStateTemplate();
                s.currentTime = videoElem.currentTime;
                s.pause = videoElem.paused;
                s.volume = videoElem.volume;
                return s;
            }
        };

        var wrapperMethods = {
            getRealSize: function (element) {
                return {
                    width: element.videoWidth,
                    height: element.videoHeight
                };
            },
            getStateProvider: function(){
                return root.stateProvider;
            },
            beforePopout: function () {
                videoElem.pause();
            },
			getType: function () {
                return 'video';
            }
        };

        var toolInstance = new PSToolWrapper(element, this.toolbarElements, wrapperMethods, viewport);
        this.wrapper = toolInstance.wrapperElement;
        var videoElem = element;

        //slider
        var slider = this.toolbarElements.filter(function (elem) {
            return elem.name === 'slider';
        })[0].element;

        //volume
        var volumeBtn = this.toolbarElements.filter(function (elem) {
            return elem.name === 'volume';
        })[0].element;

        //playPauseBtn
        var playPauseBtn = this.toolbarElements.filter(function (elem) {
            return elem.name === 'play';
        })[0].element;

        //progressText
        var progressText = this.toolbarElements.filter(function (elem) {
            return elem.name === 'progressText';
        })[0].element;

        //Set initial button state
        updatePlayPauseButton(false);
        updateVolumeButton();

        initListeners();

        function initSlider() {
            var slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'seek-bar';
            slider.value = 0;
            return slider;
        }

        function initProgressText() {
            var label = document.createElement('span');
            label.className = 'video-progress-text non-essential';
            label.innerText = '';
            return label;
        }

        function initListeners() {
            playPauseBtn.addEventListener('click', function () {
                if (videoElem.paused) {
                    videoElem.play(); // TODO: use promise here
                } else {
                    videoElem.pause();
                }
            });
            volumeBtn.addEventListener('click', function () {
                videoElem.volume = videoElem.volume > 0 ? 0 : 1;
            });
            videoElem.addEventListener('timeupdate', function () {
                if (!videoElem.duration) {
                    slider.value = 0;
                } else {
                    slider.value = videoElem.currentTime / videoElem.duration * 100;
                    progressText.innerText = formatTime(videoElem.currentTime) + ' / ' +
                        formatTime(videoElem.duration);
                }
            });
            videoElem.addEventListener('pause', function () {
                updatePlayPauseButton(false);
            });
            videoElem.addEventListener('play', function () {
                updatePlayPauseButton(true);
            });
            videoElem.addEventListener('volumechange', updateVolumeButton);
            videoElem.addEventListener('durationchange', function () {
                progressText.innerText = '00:00 / ' + formatTime(videoElem.duration);
            });
            slider.addEventListener('input', function () {
                videoElem.currentTime = videoElem.duration * slider.value / 100;
            });
            slider.addEventListener('change', function () {
                videoElem.currentTime = videoElem.duration * slider.value / 100;
            });
        }

        function formatTime(seconds) {
            var hrs = ~~(seconds / 3600);
            var mins = ~~((seconds % 3600) / 60);
            var secs = Math.round(seconds % 60);
            return (hrs > 0 ? hrs + '' : '') + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + '' + secs;
        }

        function updatePlayPauseButton(playing) {
            var play = playPauseBtn.querySelector('.svg-play-play');
            var pause = playPauseBtn.querySelector('.svg-play-pause');
            if (playing) {
                pause.style.display = 'inline';
                play.style.display = 'none';
            } else {
                play.style.display = 'inline';
                pause.style.display = 'none';
            }
        }

        function updateVolumeButton() {
            var unmute = volumeBtn.querySelector('.svg-volume-mute');
            var mute = volumeBtn.querySelector('.svg-volume-unmute');
            if (videoElem.volume > 0) {
                mute.style.display = 'inline';
                unmute.style.display = 'none';
            } else {
                unmute.style.display = 'inline';
                mute.style.display = 'none';
            }
        }

        wrapperMethods.getStateProvider().setState(state);
    };


    // Public Methods
    PSImageWrapper.prototype.init = function () {};

}(window));