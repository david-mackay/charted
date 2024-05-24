from flask import Blueprint, jsonify
from backend.data_parsing.image_location_mapper import find_location_and_chronologically_sort_images

api_v1 = Blueprint('api_v1', __name__)

@api_v1.route('/parse', methods=['POST'])
def parse_images():
    augmented_results, errCode = find_location_and_chronologically_sort_images()
    if errCode == 200:
        return augmented_results
    else:
        # Handle different types of errors based on errCode or other conditions
        if errCode == 422:
            return jsonify({"error": "No images with EXIF data found"})
        else:
            return []
