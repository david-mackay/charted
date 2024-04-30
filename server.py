from flask import Flask, request, jsonify
import os
from flask_cors import CORS

from functions.helpers import extract_metadata, augment_results

app = Flask(__name__)
CORS(app)

@app.route('/parse', methods=['POST'])
def parse_images():
    files = request.files.getlist('files[]')  # Use getlist to handle multiple files
    if not files:
        return jsonify({"error": "No files provided"}), 400

    results = []
    for file in files:
        if file.filename == '':
            continue  # Skip empty files, if any
        file_extension = os.path.splitext(file.filename)[1].lower()
        response_data = extract_metadata(file.read(), file_extension)
        results.append(response_data)


    augmented_results = augment_results(results)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
