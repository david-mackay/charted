from flask import Flask, request, jsonify
import os
import io
import pyheif
from PIL import Image
import piexif
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def read_heic(file_bytes):
    # Read HEIC file from bytes
    heif_file = pyheif.read_heif(file_bytes)
    # Convert to an image PIL can handle
    image = Image.frombytes(
        heif_file.mode,
        heif_file.size,
        heif_file.data,
        "raw",
        heif_file.mode,
        heif_file.stride,
    )
    return image

def extract_metadata(image_bytes, file_extension):
    img = None
    if file_extension in ['.png', '.jpg', '.jpeg']:
        img = Image.open(io.BytesIO(image_bytes))
    elif file_extension == '.heic':
        img = read_heic(image_bytes)
    
    if img and 'exif' in img.info:
        # Extract EXIF data using piexif
        exif_dict = piexif.load(img.info['exif'])
        return parse_exif_data(exif_dict)
    return {}

def parse_exif_data(exif_dict):
    parsed_data = {}
    for ifd in exif_dict:
        if exif_dict[ifd]:
            parsed_data[ifd] = {}
            for tag in exif_dict[ifd]:
                try:
                    tag_name = piexif.TAGS[ifd][tag]["name"]
                    tag_value = exif_dict[ifd][tag]
                    parsed_data[ifd][tag_name] = tag_value
                except KeyError:
                    parsed_data[ifd][f"Unknown Tag {tag}"] = exif_dict[ifd][tag]
    return parsed_data

@app.route('/parse', methods=['POST'])
def parse_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        file_extension = os.path.splitext(file.filename)[1].lower()
        exif_data = extract_metadata(file.read(), file_extension)
        return jsonify(exif_data)

    return jsonify({"error": "Unsupported file type"}), 400

if __name__ == '__main__':
    app.run(debug=True)
