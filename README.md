# Diarization API

DiarizationAPI is a Python application that performs speakers diarization using the Nvidia Nemo toolkit. It provides a
web interface for users to upload audio recordings, and it processes the audio using the Nemo diarization model to
identify speaker intervals.

## Prerequisites

- Python 3.9 is required to run this application. Make sure you have Python 3.9 installed on your system.

- The required packages and dependencies can be installed using the `requirements.txt` file. Please ensure that you have
  the necessary dependencies by running the following command:

pip install -r requirements.txt

Note: The torch versions specified in the `requirements.txt` file are compatible with NVIDIA CUDA 11.8. If you have a
different CUDA version, please make sure to install the appropriate packages compatible with your CUDA version.

## Usage

1. Clone the repository:
```shell
git clone https://github.com/Berkay-23/diarizationAPI.git
```
2. Navigate to the project directory:
```shell
cd diarizationAPI
```
3. Install the required dependencies:
```shell
pip install -r requirements.txt
```
4. Run the application:
```shell
python app.py
```

This will start the Flask web server and make the application accessible through the web interface.
5. Access the application in your web browser:

> http://localhost:3000



The web interface allows you to upload audio recordings and view the diarization results.

## Contributing

Contributions to this project are welcome. If you encounter any issues or have suggestions for improvements, please feel
free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Screenshots
#### Home Page
![main page](https://github.com/Berkay-23/diarizationAPI/assets/64416591/9f47f30a-308d-4c6f-ae59-caa2809ddcd9)

#### Audio Edit
![edit audio file](https://github.com/Berkay-23/diarizationAPI/assets/64416591/0228942b-c9c6-47dc-8a66-58accdadf167)

#### 1 Speaker Results
![result 1 (1 speaker](https://github.com/Berkay-23/diarizationAPI/assets/64416591/3decbc59-a0d1-4eb7-aed0-2c4c23694aa6)

#### 2 Speaker Results
![result 2 (2 speaker)](https://github.com/Berkay-23/diarizationAPI/assets/64416591/7c233b14-b19d-4ded-911e-c604778fb5f7)

#### 3 Speaker Results
![result 3 (3 speaker](https://github.com/Berkay-23/diarizationAPI/assets/64416591/5cacea36-2485-4522-800b-1f03b295e316)





