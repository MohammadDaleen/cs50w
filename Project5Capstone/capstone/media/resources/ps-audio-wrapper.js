(function (window) {
    function formatTime(seconds) {
        var min = Math.floor(seconds / 60);
        var sec = Math.floor(seconds % 60);
        return ('00' + min).substr(-2) + ':' + ('00' + sec).substr(-2);
    }

    function formatAudioTime(time, duration) {
        if (isNaN(duration) || duration <= 0) {
            return '00:00 / 00:00';
        }
        return formatTime(time) + ' / ' + formatTime(duration);
    }

    window.PSAudioWrapper = function (element, viewport, state) {
        var root = this;
        this.element = element;

        this.toolbarElements = [{
            type: 'element',
            name: 'playBtn',
            element: initPlayButton()
        }, {
            type: 'element',
            name: 'progressTime',
            element: initProgressText()
        }, {
            type: 'element',
            name: 'volumeSlider',
            element: initVolumeSlider()
        }, {
            type: 'element',
            name: 'volumeBtn',
            element: initVolumeButton()
        }, {
            type: 'element',
            name: 'seekSlider',
            element: initSeekSlider()
        }];

        function getStateTemplate() {
            return {
                type: 'STATE',
                volume: null,
                currentTime: null,
                muted: null,
                paused: null
            }
        }

        this.stateProvider = {
            setState: function (s) {
                if (!audioElem || !s) {
                    return;
                }

                if (s.paused) {
                    audioElem.pause();
                } else if(audioElem.readyState < 4){
                    audioElem.addEventListener("canplay", function() { audioElem.play(); }, true);
                }

                // checks if the video element is ready, otherwise an InvalidStateException is thrown in browsers other than Chrome
                var setStateValues = function setStateValues(s) {
                    if (audioElem.readyState < 1) {
                        setTimeout(setStateValues.bind(this, s), 100);
                    } else {
                        audioElem.currentTime = s.currentTime;
                        audioElem.volume = s.volume;
                        audioElem.muted = s.muted;
                    }
                };

                setStateValues(s);
            },
            getState: function () {
                var s = getStateTemplate();
                s.currentTime = audioElem.currentTime;
                s.pause = audioElem.paused;
                s.volume = audioElem.volume;
                s.muted = audioElem.muted;
                return s;
            }
        };

        var wrapperMethods = {
            getRealSize: function () {
                return {width: 0, height: 0};
            },
            getStateProvider: function(){
                return root.stateProvider;
            },
            beforePopout: function () {
                audioElem.pause();
            },
			getType: function () {
                return 'audio';
            }
        };

        var toolInstance = new PSToolWrapper(element, this.toolbarElements, wrapperMethods, viewport);
        this.wrapper = toolInstance.wrapperElement;
        var audioElem = element;

        var playPauseBtn = this.toolbarElements.filter(function (elem) {
            return elem.name === 'playBtn';
        })[0].element;

        var progressText = this.toolbarElements.filter(function (elem) {
            return elem.name === 'progressTime';
        })[0].element;
        
        var volumeSlider = this.toolbarElements.filter(function (elem) {
            return elem.name === 'volumeSlider';
        })[0].element;

        var volumeBtn = this.toolbarElements.filter(function (elem) {
            return elem.name === 'volumeBtn';
        })[0].element;

        var seekSlider = this.toolbarElements.filter(function (elem) {
            return elem.name === 'seekSlider';
        })[0].element.children[0];

        audioElem.controls = false;
        progressText.innerText = formatAudioTime(0, audioElem.duration);
        playPauseBtn.classList.remove('playing');
        seekSlider.value = 0;
        volumeSlider.value = 100;

        disableAll();
        initListeners();
        playPauseBtn.addEventListener('click', playToggle, false);

        function initPlayButton() {
            var btn = document.createElement('div');
            btn.className = 'audio_play_btn';
            return btn;
        }

        function initProgressText() {
            var label = document.createElement('div');
            label.className = 'audio_time';
            label.innerText = '00:00 / 00:00';
            return label;
        }

        function initVolumeSlider() {
            var slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'audio_volume_slider';
            slider.value = 0;
            slider.min = 0;
            slider.max = 100;
            return slider;
        }

        function initVolumeButton() {
            var btn = document.createElement('div');
            btn.className = 'audio_volume_btn';
            return btn;
        }

        function initSeekSlider() {
            var sliderContainer = document.createElement('span');
            sliderContainer.className = 'audio_seek_slider';
            var slider = document.createElement('input');
            slider.type = 'range';
            slider.value = 0;
            slider.min = 0;
            slider.max = 100;
            sliderContainer.appendChild(slider);
            return sliderContainer;
        }

        function playToggle() {
            if (audioElem.paused) {
                audioElem.play();
            } else {
                audioElem.pause();
            }
        }

        function disableAll() {
            volumeBtn.classList.add('disabled');
            playPauseBtn.classList.remove('playing');
            seekSlider.disabled = true;
            volumeSlider.disabled = true;
        }

        function enableAll() {
            volumeBtn.classList.remove('disabled');
            seekSlider.disabled = false;
            volumeSlider.disabled = false;

            initEvents();
        }

        function initEvents() {
            function muteToggle() {
                audioElem.muted = !audioElem.muted;

                if (audioElem.muted) {
                    volumeBtn.classList.add('muted');
                    volumeSlider.disabled = true;
                } else {
                    volumeBtn.classList.remove('muted');
                    volumeSlider.disabled = false;
                }
            }

            function volumeChange() {
                audioElem.volume = this.value / 100;
            }

            function seekChange() {
                audioElem.currentTime = audioElem.duration * this.value * 0.01;
            }

            volumeBtn.addEventListener('click', muteToggle, false);
            volumeSlider.addEventListener('input', volumeChange, false);
            volumeSlider.addEventListener('change', volumeChange, false);
            seekSlider.addEventListener('input', seekChange, false);
            seekSlider.addEventListener('change', seekChange, false);
        }

        function initListeners() {
            function audioError() {
                disableAll();
                audioElem.pause();
            }
            audioElem.addEventListener('error', audioError, false);
            audioElem.addEventListener('stalled', audioError, false);
            audioElem.addEventListener('abort', audioError, false);

            audioElem.addEventListener('canplay', enableAll, false);

            audioElem.addEventListener('durationchange', function() {
                progressText.innerText = formatAudioTime(
                    audioElem.currentTime, audioElem.duration);
            }, false);

            audioElem.addEventListener('playing', function () {
                playPauseBtn.classList.add('playing');
            }, false);

            audioElem.addEventListener('pause', function () {
                playPauseBtn.classList.remove('playing');
            }, false);

            audioElem.addEventListener('timeupdate', function () {
                var currentTime = audioElem.currentTime;
                var duration = audioElem.duration;

                progressText.innerText = formatAudioTime(currentTime, duration);
                
                seekSlider.value = duration > 0 ? Math.round(currentTime / duration * 100) : 0;
            }, false);

            audioElem.addEventListener('ended', function () {
                playPauseBtn.classList.remove('playing');
            }, false);
        }

        wrapperMethods.getStateProvider().setState(state);
    };


    // Public Methods
    PSAudioWrapper.prototype.init = function () {
    };

}(window));