from flask import Blueprint
from backend.data_parsing.image_location_mapper import find_location_and_chronologically_sort_images

api_v1 = Blueprint('api_v1', __name__)

@api_v1.route('/parse', methods=['POST'])
def parse_images():
    return find_location_and_chronologically_sort_images()