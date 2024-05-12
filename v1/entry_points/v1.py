from flask import Blueprint, request, jsonify
import os
from functions.helpers import extract_metadata, augment_results
from v1.data_parsing.v1 import find_location_and_chronologically_sort_images

api_v1 = Blueprint('api_v1', __name__)

@api_v1.route('/parse', methods=['POST'])
def parse_images():
    return find_location_and_chronologically_sort_images()