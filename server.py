from flask import Flask, request, jsonify
import os
from flask_cors import CORS

from functions.helpers import extract_metadata

app = Flask(__name__)
CORS(app)

@app.route('/parse', methods=['POST'])
def parse_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_extension = os.path.splitext(file.filename)[1].lower()
    response_data = extract_metadata(file.read(), file_extension)
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)
