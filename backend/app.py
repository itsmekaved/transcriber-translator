from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import speech_v1 as speech
from google.cloud import translate_v2 as translate
from pydub import AudioSegment
import wave
import os

app = Flask(__name__)
CORS(app)

speech_client = speech.SpeechClient.from_service_account_file('/home/kaved/Downloads/key.json')
translate_client = translate.Client.from_service_account_json('/home/kaved/Downloads/key.json')

def convert_to_mono(input_path, output_path):
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1)
    audio.export(output_path, format="wav")

@app.route('/upload', methods=['POST'])
def upload():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    languages = request.form.getlist('languages')  # works now

    
    audio_path = 'temp_audio.wav'
    mono_path = 'mono_audio.wav'
    audio_file.save(audio_path)

    convert_to_mono(audio_path, mono_path)

    with wave.open(mono_path, "rb") as wav_file:
        sample_rate = wav_file.getframerate()

    with open(mono_path, 'rb') as f:
        content = f.read()
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate,
            language_code='en-US',
        )
        response = speech_client.recognize(config=config, audio=audio)

    transcript = ""
    for result in response.results:
        if result.alternatives:
            transcript += result.alternatives[0].transcript + " "

    transcript = transcript.strip()
    translations = {}
    for lang in languages:
        result = translate_client.translate(transcript, target_language=lang)
        translations[lang] = f"\n[{lang}]\n{result['translatedText']}"

    os.remove(audio_path)
    os.remove(mono_path)

    return jsonify({
        "transcript": transcript,
        "translations": translations
    })

if __name__ == '__main__':
    app.run(debug=True)