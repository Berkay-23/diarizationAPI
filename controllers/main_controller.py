from flask import render_template
import soundfile as sf
import uuid
import os
from nemoModel import diarization_json_results


def main_get():
    return render_template('main_views/main.html')


def example_get():
    return render_template('main_views/example.html')


def model_post(audio, sample_rate):
    input_dir = 'static/input'
    if not os.path.exists(input_dir):
        os.makedirs(input_dir)

    uid = str(uuid.uuid4())[:8]
    unique_filename = f'audio_{uid}.wav'
    file_path = os.path.join(input_dir, unique_filename)

    labels = []

    try:
        sf.write(file_path, audio, sample_rate)
        labels = run_model(file_path)
    except Exception as e:
        print(e)
        return {'status': 'error', 'message': 'Something went wrong with the model', 'labels': labels, 'uid': uid}
    finally:
        remove_files(uid)

    return {'status': 'success', 'labels': labels, 'uid': uid}


def run_model(path):
    uid = path.split('_')[1].split('.')[0]
    return diarization_json_results(uid, path)


def remove_files(uid, is_output=False):
    output_dir = 'static/output'
    input_dir = 'static/input'

    if os.path.exists(os.path.join(input_dir, f'audio_{uid}.wav')):
        os.remove(os.path.join(input_dir, f'audio_{uid}.wav'))

    if os.path.exists(os.path.join(output_dir, f'audio_{uid}.json')) and is_output:
        os.remove(os.path.join(output_dir, f'audio_{uid}.json'))
