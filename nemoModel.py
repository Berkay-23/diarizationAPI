from nemo.collections.asr.models import ClusteringDiarizer
from pyannote.database.util import load_rttm
from omegaconf import OmegaConf
from pathlib import Path
import soundfile as sf
import pandas as pd
import librosa
import pathlib
import json
import wget
import os


def wav_to_mono_16khz(wav_path):
    y, s = librosa.load(wav_path, sr=16000)  # Downsample 44.1kHz to 16kHz
    if y.shape[0] == 2:
        y = librosa.to_mono(y)
    return y, s


def delete_folder(pth):
    for path in pathlib.Path(pth).iterdir():

        if path.is_file():
            os.remove(path)
        else:
            delete_folder(path)

    os.rmdir(pth)


def formating_time(seconds: float) -> str:
    hh = str(int(seconds // 3600)).zfill(2)
    mm = str(int((seconds // 60) % 60)).zfill(2)
    ss = str(int(seconds % 60)).zfill(2)
    ms = str(int((seconds % 1) * 10)).zfill(1)
    return f'{hh}:{mm}:{ss}.{ms}'


def DiarizationWithNemo(requestId, Wav_File_PATH, Output_File):
    ROOT = os.getcwd()
    data_dir = os.path.join(ROOT, 'data')
    os.makedirs(data_dir, exist_ok=True)

    original_wav_file = os.path.split(Wav_File_PATH)[1]

    Resampled_Path = os.path.join(ROOT, "resampled")
    os.makedirs(Resampled_Path, exist_ok=True)

    y, s = wav_to_mono_16khz(Wav_File_PATH)
    audio_file = os.path.join(Resampled_Path, requestId + ".wav")
    sf.write(audio_file, y, 16000, )

    rttm_file = requestId + ".rttm"
    rttm_uri = requestId

    meta = {
        'audio_filepath': audio_file,
        'offset': 0,
        'duration': None,
        'label': 'infer',
        'text': '-',
        'num_speakers': None,
        'rttm_filepath': None,
        'uem_filepath': None
    }
    with open('data/input_manifest.json', 'w') as fp:
        json.dump(meta, fp)
        fp.write('\n')

    output_dir_oracle = os.path.join(ROOT, 'oracle_vad')
    os.makedirs(output_dir_oracle, exist_ok=True)

    MODEL_CONFIG = os.path.join(data_dir, 'offline_diarization.yaml')
    if not os.path.exists(MODEL_CONFIG):
        config_url = "https://raw.githubusercontent.com/NVIDIA/NeMo/main/examples/speaker_tasks/diarization/conf/inference/diar_infer_meeting.yaml"
        MODEL_CONFIG = wget.download(config_url, data_dir)

    config = OmegaConf.load(MODEL_CONFIG)

    pretrained_vad = 'vad_marblenet'
    pretrained_speaker_model = 'titanet_large'

    config.num_workers = 1  # Workaround for multiprocessing hanging with ipython issue

    output_dir = os.path.join(ROOT, Output_File)
    config.diarizer.manifest_filepath = 'data/input_manifest.json'
    config.diarizer.out_dir = output_dir  # Directory to store intermediate files and prediction outputs

    config.diarizer.speaker_embeddings.model_path = pretrained_speaker_model
    # config.diarizer.speaker_embeddings.parameters.window_length_in_sec = 1.3  # 1.5
    # config.diarizer.speaker_embeddings.parameters.shift_length_in_sec = 0.85  # 0.75
    # config.diarizer.oracle_vad = False  # compute VAD provided with model_path to vad config
    # config.diarizer.clustering.parameters.oracle_num_speakers = False
    #
    # config.diarizer.vad.model_path = 'vad_multilingual_marblenet'
    # config.diarizer.asr.model_path = 'stt_en_conformer_ctc_large'
    # config.diarizer.vad.window_length_in_sec = 1.2  # 0.15
    # config.diarizer.vad.shift_length_in_sec = 0.01  # 0.01
    # config.diarizer.vad.parameters.onset = 0.8
    # config.diarizer.vad.parameters.offset = 0.6
    # config.diarizer.vad.parameters.min_duration_on = 0.1
    # config.diarizer.vad.parameters.min_duration_off = 0.4

    sd_model = ClusteringDiarizer(cfg=config)

    rttm_df = pd.DataFrame(columns=["Start", "Duration", "Counter", "Label"])

    try:
        sd_model.diarize()

        # Rttm'yi Df'e dönüştürme:

        rttm_dir = os.path.join(output_dir, "pred_rttms", rttm_file)

        rttm_original = load_rttm(rttm_dir)[rttm_uri]

        Start_list = []
        Duration_list = []
        Counter_list = []
        Label_list = []

        for segment, t, label in rttm_original.itertracks(yield_label=True):
            Start_list.append(segment.start)
            Duration_list.append(segment.duration)
            Counter_list.append(t)
            Label_list.append(label)

        rttm_df.Start = Start_list
        rttm_df.Duration = Duration_list
        rttm_df.Counter = Counter_list
        rttm_df.Label = Label_list

    except Exception as e:
        print(e)

    finally:
        # Fonksiyon içinde oluşan path'leri silme:
        for folder in [output_dir, output_dir_oracle, Resampled_Path, data_dir]:
            delete_folder(folder)

    return rttm_df


def diarization_json_results(request_id, filename):
    df = DiarizationWithNemo(request_id, filename, "outputs")
    output = []
    for i in range(0, df.shape[0]):
        json_dict = {}
        row = df.iloc[i]

        start = row[0]
        end = row[0] + row[1]
        label = row[3]

        formated_start = formating_time(start)
        formated_end = formating_time(end)

        json_dict["ID"] = label[8:]
        json_dict["Start"] = formated_start
        json_dict["End"] = formated_end

        output.append(json_dict)

    # Json dosyasının path hazırlığı ve listenin yazdırılması:
    ROOT = os.getcwd()

    results_path = os.path.join(ROOT, 'static/output')
    os.makedirs(results_path, exist_ok=True)

    json_path = f'{results_path}/audio_{request_id}.json'
    json_path = Path(json_path)

    # os.makedirs(json_path,exist_ok=True)
    with open(json_path, "w") as file:
        json.dump(output, file)

    return output

# requestId = str(shortuuid.uuid())
#
# diarization_json_results(requestId, 'static/test_0.wav')
#
# with open(os.path.join(os.getcwd(), f'static/output/audio_{requestId}.json')) as f:
#     data = json.load(f)
#     print(data)
