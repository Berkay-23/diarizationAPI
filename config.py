import os
import platform

SECRET_KEY = os.urandom(32)

# Grabs the folder where the script runs.
basedir = os.path.abspath(os.path.dirname(__file__))

# Enable debug mode.
DEBUG = True
HOST = '127.0.0.1'
PORT = 3000


if platform.system() == 'Windows':
    BASE_PATH = 'C:\\'
    PATH_SEPARATOR = '\\'

elif platform.system() == 'Linux':
    BASE_PATH = '/'
    PATH_SEPARATOR = '/'

else:
    BASE_PATH = ''

TYPES = ('*.wav', '*.flac', '*.mp3', '*.m4a', '*.wma')
