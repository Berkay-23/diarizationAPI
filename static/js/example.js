const recordButton = $('#btn_record')
const recordIcon = $('#record_icon')
const btnRecPlayPause = $('#btn_rec_play_pause')
const btnTrim = $('#btn_trim')
const btnDelete = $('#btn_delete')
const recordContainer = $('.record-container')
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
    // wavesurferRec.regions.add({
    //     start: 0,
    //     end: wavesurferRec.getDuration() - (wavesurferRec.getDuration() / 60),
    //     color: 'hsla(200, 50%, 70%, 0.3)',
    // });
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
    // btnTrim.css('display', 'none');
    // btnDelete.css('display', 'none');
});

wavesurferRec.on('region-update-end', function (region, e) {
    btnTrim.css('display', 'block');
    btnDelete.css('display', 'block');
    selectedRegion = region;
});

wavesurferRec.on('region-mouseleave', function (region, e) {

});
function trimLeft() {

    if (selectedRegion != null) {
        const start = selectedRegion.start.toFixed(2);
        const end = selectedRegion.end.toFixed(2);
        const originalBuffer = wavesurferRec.backend.buffer;

        let emptySegment = wavesurferRec.backend.ac.createBuffer(
            originalBuffer.numberOfChannels,
            //segment duration
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
        console.log("total nueva wave", wavesurferRec.getDuration(), end, start)

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

let player = videojs("forRecord", {
    controls: true,
    width: 600,
    height: 300,
    plugins: {
        wavesurfer: {
            src: "live",
            waveColor: "#fffa00",
            progressColor: "#FAFCD2",
            debug: true,
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


    // Todo save file
    // player.record().saveAs({'audio': 'my-audio-file-name.ogg'});
});

player.on('ready', () =>  player.record().getDevice());

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

function changeRecordIcon() {
    if (btnRecPlayPause.prop('checked')) {
        btnRecPlayPause.siblings('i').removeClass('fa-play').addClass('fa-pause');
    } else {
        btnRecPlayPause.siblings('i').removeClass('fa-pause').addClass('fa-play');
    }
}

btnRecPlayPause.change(() => {
    changeRecordIcon();
    wavesurferRec.playPause();
});
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