const modal = $('#diarizeModal');
let wavesurfer = null;
let recordedAudioURL = null;
let uid = null;

function reFormatTime(time) {
    const millisecod = parseInt(time.split('.')[1]);
    time = time.split('.')[0];
    const timeComponents = time.split(':');
    const hours = parseInt(timeComponents[0]);
    const minutes = parseInt(timeComponents[1]);
    const seconds = parseInt(timeComponents[2]);
    return (hours * 60 * 60) + (minutes * 60) + seconds + (millisecod / 10);
}

function getColorPalette(id) {
    const colorList = [
        'rgba(0,0,255,0.3)', 'rgba(0,255,0,0.3)',
        'rgba(39,129,217,0.4)', 'rgba(155,26,125,0.3)',
        'rgba(253,26,27,0.3)', 'rgba(255,234,0,0.3)',
        'rgba(255,0,255,0.3)', 'rgba(255,255,255,0.3)',
        'rgba(0,0,0,0.3)', 'rgba(255,255,0,0.3)',
    ];
    return colorList[id % colorList.length];
}

function changeIcon() {
    const play_pause_btn = $('#btn_play_pause');
    if (play_pause_btn.prop('checked')) {
        play_pause_btn.siblings('i').removeClass('fa-play').addClass('fa-pause');
    } else {
        play_pause_btn.siblings('i').removeClass('fa-pause').addClass('fa-play');
    }
}


function initAudioControls() {
    const volume_slider = $('#volume_slider');
    const volume_value = $('#volume_value');
    const zoom_slider = $('#zoom_slider');
    const play_pause_btn = $('#btn_play_pause');

    let slider_volume = new Slider(volume_slider, volume_value, options = {min: 0, max: 100, cur: 85});
    slider_volume.init();

    let slider_zoom = new Slider(zoom_slider, null, options = {min: 0, max: 100, cur: 15});
    slider_zoom.init();


    zoom_slider.on('input', function () {
        wavesurfer.zoom(Number(this.value));
    });

    volume_slider.on('input', function () {
        wavesurfer.setVolume(Number(this.value) / 100);
    });

    play_pause_btn.change(() => {
        changeIcon();
        wavesurfer.playPause();
    });

}

function initWaveSurfer() {
    const play_pause_btn = $('#btn_play_pause');

    let timeline = WaveSurfer.timeline.create({
        container: "#wave-timeline",
        primaryColor: "#FFFFFF",
        secondaryColor: "rgba(255,255,255,0.8)",
        primaryFontColor: "#FFFFFF",
        secondaryFontColor: "rgba(255,255,255,0.8)",
        primaryLabelInterval: 5,
        // secondaryLabelInterval: 2,
    });

    let cursor = WaveSurfer.cursor.create({
        showTime: true,
        opacity: 1,
        customShowTimeStyle: {
            'background-color': '#000',
            color: '#fff',
            padding: '2px',
            'font-size': '10px'
        }
    });

    let regions = WaveSurfer.regions.create({
        regionsMinLength: 0,
        color: 'rgba(121,224,238,0.4)',
        regions: [],
        dragSelection: {
            slop: 2,
        }
    });

    wavesurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        backend: 'MediaElement',
        barGap: 2,
        barHeight: 2,
        barMinHeight: 0.1,
        barRadius: 3,
        barWidth: 5,
        scrollParent: true,
        cursorColor: '#FFFFFF',
        waveColor: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.7)'],
        progressColor: ['#9a1a7e', '#fd1a1b', '#9a1a7e'],
        plugins: [timeline, cursor, regions],
    });

    wavesurfer.load(recordedAudioURL || 'https://wavesurfer-js.org/example/media/demo.wav');

    wavesurfer.on('ready', function () {
        let url = `${dataURL}${uid}`;

        $.getJSON(url, function (data) {
            data.forEach(item => {
                const region = {
                    start: reFormatTime(item.Start),
                    end: reFormatTime(item.End),
                    color: getColorPalette(item.ID),
                    loop: false,
                };
                wavesurfer.addRegion(region);
            });
        });
    });

    wavesurfer.on('region-click', function (region, e) {
        e.stopPropagation();
        e.shiftKey ? region.playLoop() : region.play();
    });

    wavesurfer.on('region-dblclick', function (region, e) {
        e.stopPropagation();
        region.remove();
    });

    wavesurfer.on('region-update-end', function (region, e) {
        // console.log(region);
    });

    wavesurfer.on('region-in', function (region, e) {
        // console.log(`in ${region.start}`);
        play_pause_btn.prop('checked', true);
        changeIcon();
    });

    wavesurfer.on('region-out', function (region, e) {
        // console.log(`out ${region.end}`);
        play_pause_btn.prop('checked', false);
        changeIcon();
    });

    wavesurfer.on('finish', function () {
        play_pause_btn.prop('checked', false);
        changeIcon();
    });
}

modal.on('show.bs.modal', function (event) {
    const body = modal.find('.modal-body');
    body.append(getModalBody());
    initWaveSurfer();
    initAudioControls();
});

modal.on('hide.bs.modal', function (event) {
    modal.find('.modal-body').empty();
});

// -----------------  wavesurferRec ----------------- //

const recordButton = $('#btn_record');
const recordIcon = $('#record_icon');
const btnRecPlayPause = $('#btn_rec_play_pause');
const btnTrim = $('#btn_trim');
const btnDelete = $('#btn_delete');
const recordContainer = $('.record-container');
const btnSubmit = $('#sendToModel');

let selectedRegion = null;
let regions = WaveSurfer.regions.create({
    regions: [],
    dragSelection: true,
    slop: 10,
    color: 'hsla(200, 50%, 70%, 0.3)',
    loop: false,
});
let cursor = WaveSurfer.cursor.create({
    showTime: true,
    opacity: 1,
    customShowTimeStyle: {
        'background-color': '#000',
        color: '#fff',
        padding: '2px',
        'font-size': '10px'
    }
});
let wavesurferRec = WaveSurfer.create({
    container: '#waveformRec',
    waveColor: '#46a6d8',
    progressColor: '#FFF',
    barWidth: 3,
    barGap: 2,
    height: 130,
    cursorWidth: 1,
    cursorColor: "white",
    responsive: 1000,
    normalize: true,
    plugins: [
        cursor,
        regions,
    ],
});

wavesurferRec.on('region-click', function (region, e) {
    e.stopPropagation();
    e.shiftKey ? region.playLoop() : region.play();
});

wavesurferRec.on('region-dblclick', function (region, e) {
    e.stopPropagation();
    region.remove();
});

wavesurferRec.on("ready", () => {
    wavesurferRec.regions.clear();
});

wavesurferRec.on('finish', function () {
    btnRecPlayPause.prop('checked', false);
    changeRecordIcon();
});

wavesurferRec.on('region-in', function (region, e) {
    btnRecPlayPause.prop('checked', true);
    changeRecordIcon();
    btnTrim.css('display', 'block');
    btnDelete.css('display', 'block');
    selectedRegion = region;
});

wavesurferRec.on('region-out', function (region, e) {
    btnRecPlayPause.prop('checked', false);
    changeRecordIcon();
});

wavesurferRec.on('region-update-end', function (region, e) {
    btnTrim.css('display', 'block');
    btnDelete.css('display', 'block');
    selectedRegion = region;
});

function trimLeft() {

    if (selectedRegion != null) {
        const start = selectedRegion.start.toFixed(2);
        const end = selectedRegion.end.toFixed(2);
        const originalBuffer = wavesurferRec.backend.buffer;

        let emptySegment = wavesurferRec.backend.ac.createBuffer(
            originalBuffer.numberOfChannels,
            (end - start) * (originalBuffer.sampleRate * 1),
            originalBuffer.sampleRate
        );

        for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
            let chanData = originalBuffer.getChannelData(i);
            let segmentChanData = emptySegment.getChannelData(i);
            for (let j = 0, len = chanData.length; j < end * originalBuffer.sampleRate; j++) {
                segmentChanData[j] = chanData[j + (start * originalBuffer.sampleRate)];
            }
        }
        wavesurferRec.loadDecodedBuffer(emptySegment); // Here you go!
    }
}

function deleteChunk() {

    if (selectedRegion != null) {

        const start = selectedRegion.start.toFixed(2);
        const end = selectedRegion.end.toFixed(2);
        const originalBuffer = wavesurferRec.backend.buffer;

        let emptySegment = wavesurferRec.backend.ac.createBuffer(
            originalBuffer.numberOfChannels,
            (wavesurferRec.getDuration() - (end - start)) * (originalBuffer.sampleRate * 1),
            originalBuffer.sampleRate
        );

        for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
            let chanData = originalBuffer.getChannelData(i);
            let segmentChanData = emptySegment.getChannelData(i);
            let offset = end * originalBuffer.sampleRate;
            for (let j = 0; j < originalBuffer.length; j++) {
                if (j < (start * originalBuffer.sampleRate)) {
                    //TODO: contemplate other cases when the region is at the end
                    segmentChanData[j] = chanData[j];
                } else {
                    segmentChanData[j] = chanData[offset];
                    offset++;
                }
            }
        }
        wavesurferRec.loadDecodedBuffer(emptySegment);
    }
}

function changeRecordIcon() {
    if (btnRecPlayPause.prop('checked')) {
        btnRecPlayPause.siblings('i').removeClass('fa-play').addClass('fa-pause');
    } else {
        btnRecPlayPause.siblings('i').removeClass('fa-pause').addClass('fa-play');
    }
}

function startRecording() {
    if (!player.record().isRecording() || (player.record().isRecording() && player.record().paused)) {
        player.record().start();
        recordIcon.removeClass('fa-microphone');
        recordIcon.addClass('fa-microphone-lines');
        recordButton.addClass('recording');
    } else {
        player.record().stop();
        recordIcon.removeClass('fa-microphone-lines');
        recordIcon.addClass('fa-microphone');
        recordButton.removeClass('recording');
    }
}


btnTrim.on('click', function () {
    selectedRegion = null
    btnTrim.css('display', 'none');
    btnDelete.css('display', 'none');
});

btnDelete.on('click', function () {
    selectedRegion = null;
    btnTrim.css('display', 'none');
    btnDelete.css('display', 'none');
});

btnRecPlayPause.change(() => {
    changeRecordIcon();
    wavesurferRec.playPause();
});

btnSubmit.on('click', function () {
    let wavBlob = bufferToWav(wavesurferRec.backend.buffer);
    recordedAudioURL = URL.createObjectURL(wavBlob);

    let wavBuffer = wavesurferRec.backend.buffer;
    let sampleRate = wavBuffer.sampleRate;
    let audioData = wavBuffer.getChannelData(0);

    // Float32Array to shape (1) list
    audioData = Array.from(audioData);

    showAlert({
        'title': 'Processing',
        'html': 'Please wait while we process your audio...',
        'allowOutsideClick': false,
        'showConfirmButton': false,
        'didOpen': () => {
            Swal.showLoading();
        }
    });

    $.ajax({
        url: '/model',
        type: 'POST',
        data: JSON.stringify({
            'audio': audioData,
            'sample_rate': sampleRate
        }),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            showAlert({
                'title': 'Success',
                'text': 'Your audio has been processed successfully!',
                'icon': 'success',
                'showCancelButton': false,
                'confirmButtonText': 'Show Results',
                'callback': () => {
                    uid = data['uid'];
                    modal.modal('show');
                }
            });
        },
        error: function (error) {
            showAlert({
                'title': 'Error',
                'text': 'Something went wrong! \nPlease try again later.',
                'icon': 'error',
            });
        }
    });
});


// ----------------- Microphone  Recorder ----------------- //

let player = videojs("forRecord", {
    controls: true,
    width: 600,
    height: 300,
    plugins: {
        wavesurfer: {
            src: "live",
            waveColor: "#fffa00",
            progressColor: "#FAFCD2",
            debug: false,
            cursorWidth: 1,
            msDisplayMax: 20,
            hideScrollbar: true
        },
        record: {
            audio: true,
            video: false,
            maxLength: 20,
            debug: false,
        }
    }
});

player.on('startRecord', () => recordContainer.show());

player.on('finishRecord', function () {
    recordContainer.hide();
    btnRecPlayPause.prop('checked', false);
    changeRecordIcon();
    let fileReader = new FileReader();
    fileReader.addEventListener('load', function (e) {
        wavesurferRec.loadArrayBuffer(e.target.result);
    });
    fileReader.readAsArrayBuffer(player.recordedData);

    let recordedBlob = new Blob([player.recordedData], {type: 'audio/ogg'});
    recordedAudioURL = URL.createObjectURL(recordedBlob);
});

player.on('ready', () => player.record().getDevice());

// ----------------- Load File Functions ----------------- //

const inpLoadElement = $('#formFileSm');
const btnLoadAudio = $('#btnLoadAudio');

inpLoadElement.on('change', function () {
    if (inpLoadElement[0].files[0].type.split('/')[0] !== 'audio') {
        showAlert({
            'title': 'Error',
            'message': 'Please select an audio file!',
            'icon': 'error',
        });
        inpLoadElement.val('');
        return;
    }

    let fileReader = new FileReader();
    fileReader.addEventListener('load', function (e) {
        let audioContext = new AudioContext();
        audioContext.decodeAudioData(e.target.result, function (buffer) {
            if (buffer.duration < 20) {
                showAlert({
                    'title': 'Error',
                    'message': 'Please select an audio file that is 20 seconds or less!',
                    'icon': 'error',
                });
                inpLoadElement.val('');
            }
            console.log(buffer.duration);
        });
    });
});

btnLoadAudio.on('click', function () {
    let fileReader = new FileReader();
    fileReader.addEventListener('load', function (e) {
        wavesurferRec.loadArrayBuffer(e.target.result);
    });
    fileReader.readAsArrayBuffer(inpLoadElement[0].files[0]);
});

function deleteSelectedFile() {
    let inputElement = document.getElementById("formFileSm");
    inputElement.value = ""; // Dosya seçimi sıfırlanır
}

function handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;

    // if file audio type
    if (files[0].type.split('/')[0] !== 'audio') {
        showAlert({
            'title': 'Error',
            'message': 'Please select an audio file!',
            'icon': 'error',
        });
        return;
    }

    // load formFileSm with file
    let fileReader = new FileReader();
    fileReader.addEventListener('load', function (e) {
        let audioContext = new AudioContext();
        audioContext.decodeAudioData(e.target.result, function (buffer) {
            if (buffer.duration < 20) {
                showAlert({
                    'title': 'Error',
                    'message': 'Please select an audio file that is 20 seconds or less!',
                    'icon': 'error',
                });
                inpLoadElement.val('');
            }
            console.log(buffer.duration);
        });
    });
    fileReader.readAsArrayBuffer(files[0]);
}

function handleDragOver(event) {
    event.preventDefault();
}


// ----------------- other functions ----------------- //
function bufferToWav(buffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        arrayBuffer = new ArrayBuffer(length),
        view = new DataView(arrayBuffer);

    // RIFF/WAVE header
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    // write the PCM samples
    let index = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            view.setInt16(index, buffer.getChannelData(channel)[i] * 0x7FFF, true);
            index += 2;
        }
    }

    function writeUTFBytes(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    return new Blob([view], {type: 'audio/wav'});
}

function showAlert(args) {
    Swal.fire({
        icon: args.icon,
        title: args.title,
        text: args.message,
        html: args.html,
        allowEscapeKey: args.allowEscapeKey,
        allowOutsideClick: args.allowOutsideClick,
        confirmButtonText: args.confirmButtonText || 'Tamam',
        confirmButtonColor: args.confirmButtonColor || '#3085d6',
        cancelButtonText: args.cancelButtonText || 'İptal',
        cancelButtonColor: args.cancelButtonColor || '#d33',
        showCancelButton: args.showCancelButton,
        showCloseButton: args.showCloseButton,
        showConfirmButton: args.showConfirmButton === undefined ? true : args.showConfirmButton,
        didOpen: args.didOpen,
        reverseButtons: true,
    }).then((result) => {
        if (result['isConfirmed']) {
            args.callback ? args.callback_args ? args.callback(args.callback_args) : args.callback() : null;
        } else if (result['isDismissed'] && args['isDismissed']) {
            args.isDismissed ? args.isDismissed() : null;
        }
    });
}

function getModalBody() {
    return `
    <div id="audio_timeline">
                    <div id="waveform"></div>
                    <div id="wave-timeline"></div>
                </div>

                <div id="audio_controller">

                    <div class="slider_container">
                        <div class="slider-item range__value_l">
                            <i id="volume-button" class="fa fa-volume-high"></i>
                        </div>
                        <div class="form-group range__slider">
                            <label for="volume_slider"></label><input class="slider" id="volume_slider" type="range">
                        </div>

                        <div id="volume_value" class="form-group range__value_r slider-item">
                            <span class="badge rounded-pill bg-dark">%100</span>
                        </div>
                    </div>


                    <label class="my-2" for="btn_play_pause" id="button_label">
                        <input type="checkbox" id="btn_play_pause" style="display: none">
                        <i class="fa-solid fa-play"></i>
                    </label>


                    <div class="slider_container">
                        <div class="slider-item range__value_l">
                            <i class="fa-solid fa-magnifying-glass-minus"></i>
                        </div>

                        <div class="form-group range__slider">
                            <label for="zoom_slider"></label><input id="zoom_slider" class="slider" type="range">
                        </div>

                        <div class="slider-item range__value_r">
                            <i class="fa-solid fa-magnifying-glass-plus"></i>
                        </div>
                    </div>
                </div>
    `
}
