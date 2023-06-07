import json

from flask import Blueprint, request
from controllers import main_controller

page = Blueprint('main', __name__)


@page.route('/', methods=['GET'])
def index():
    return main_controller.main_get()


@page.route('/get_data/', methods=['GET'], defaults={'uid': None})
@page.route('/get_data/<uid>', methods=['GET'])
def get_data(uid):

    if uid is not None:
        with open(f'static/output/audio_{uid}.json', 'r') as f:
            data = json.load(f)
            main_controller.remove_files(uid, is_output=True)
        return data

    main_controller.remove_files(uid, is_output=True)

    return []


@page.route('/example/', methods=['GET'])
def example_get():
    return main_controller.example_get()


@page.route('/model', methods=['POST'])
def model_post():
    data = request.get_json()

    keys = ['audio', 'sample_rate']

    for key in keys:
        if key not in data:
            return {'status': 'error', 'message': f'{key} not in request'}

    return main_controller.model_post(data['audio'], data['sample_rate'])
