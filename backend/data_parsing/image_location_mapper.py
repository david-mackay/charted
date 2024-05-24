from dotenv import load_dotenv
import os
import io
#import pyheif
from PIL import Image
from flask import jsonify, request
import piexif
import base64
from datetime import datetime

import googlemaps
from datetime import datetime

from backend.utility.decorators import catch_internal_errors
from backend.utility.validators import InputImages

# Access your API key
api_key = os.getenv('API_KEY')
SUPPORTED_FILE_TYPES = ['.png', '.jpg', '.jpeg']

def coordinate_lookup(coordinates):
    """
    Look up an address based on GPS coordinates using Google Maps API.
    Input: @davidmackay to fill out
    Output: list of reverse geocoding results
    """
    gmaps = googlemaps.Client(key=api_key)

    # Look up an address with reverse geocoding
    address   = gmaps.reverse_geocode(coordinates)

    if address:
        # The formatted address
        formatted_address = address[0].get('formatted_address', 'No address found')
        
        # Check for business or building name
        # Usually, it is under 'premise' or 'point_of_interest' in address components
        address_components = address[0].get('address_components')
        business_name = None
        for component in address_components:
            if 'premise' in component['types'] or 'point_of_interest' in component['types']:
                business_name = component['long_name']
                break
        return {
            'formatted_address': formatted_address,
            'business_or_building': business_name
        }

    #Do not throw an error because we can still iterate over other images
    return {}

def dms_to_decimal(degrees, minutes, seconds):
    """Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees."""
    return degrees + (minutes / 60) + (seconds / 3600)

def convert_gps_to_decimal(gps_data):
    """Convert GPS EXIF data to a decimal coordinate string for Google Maps."""
    # Extract latitude and longitude in DMS format
    lat_dms = gps_data[2]  # ((degrees, 1), (minutes, 1), (seconds, 100))
    lon_dms = gps_data[4]  # ((degrees, 1), (minutes, 1), (seconds, 100))

    # Convert DMS to decimal
    latitude = dms_to_decimal(lat_dms[0][0] / lat_dms[0][1], 
                              lat_dms[1][0] / lat_dms[1][1], 
                              lat_dms[2][0] / lat_dms[2][1])
    longitude = dms_to_decimal(lon_dms[0][0] / lon_dms[0][1], 
                               lon_dms[1][0] / lon_dms[1][1], 
                               lon_dms[2][0] / lon_dms[2][1])

    # Apply hemisphere data
    if gps_data[1] == b'S':
        latitude = -latitude
    if gps_data[3] == b'W':
        longitude = -longitude

    # Format as a string suitable for Google Maps query
    return f"{latitude},{longitude}"


def decode_datetime(byte_string):
    # Decode the byte string to a regular string
    datetime_str = byte_string.decode('ascii')
    
    # Parse the datetime string into a datetime object
    # The EXIF datetime format is 'YYYY:MM:DD HH:MM:SS'
    dt_format = '%Y:%m:%d %H:%M:%S'
    datetime_obj = datetime.strptime(datetime_str, dt_format)
    
    return datetime_obj

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
    if file_extension in SUPPORTED_FILE_TYPES:
        img = Image.open(io.BytesIO(image_bytes))
    elif file_extension == '.heic':
        img = read_heic(image_bytes)
    
    if img:
        # Convert image to base64 for JSON serialization
        buffered = io.BytesIO()
        img_format = 'JPEG' if 'jpeg' in file_extension else 'PNG'
        img.save(buffered, format=img_format)
        image_string = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Prepare response with image and simplified EXIF
        response = {
            "image_bytes": f"data:image/{img_format.lower()};base64,{image_string}"
        }
        exif_data = {}
        if 'exif' in img.info:
            exif_data = piexif.load(img.info['exif'])
        response.update({"exif_data": parse_exif_data(exif_data)})
        return response
    
    return {"error": "No valid image data found"}

def parse_exif_data(exif_dict):
    parsed_data = {
        "gps": None,
        "timestamp": None,
    }
    print("parsed_data", parsed_data)
    if "GPS" in exif_dict and exif_dict["GPS"] != {}:
        gps = exif_dict["GPS"]
        parsed_data["gps"] = convert_gps_to_decimal(gps)
    if "0th" in exif_dict and exif_dict["0th"] != {}:
        if 306 in exif_dict["0th"]:
            parsed_data["timestamp"] = (decode_datetime(exif_dict["0th"][306]))
    return parsed_data

def augment_results(results: list):
    imagesWithExifData = []
    for result in results:
        result["parsed_data"] = {}
        exif_data = result["exif_data"]
        
        # We need to check if the timestamp exists and it is not none
        if exif_data["timestamp"] and exif_data["gps"]:
            print(exif_data)
            gps = exif_data["gps"]
            # TODO: @maggiez to validate GPS coordinates for lat/long
            gpslookup = coordinate_lookup(gps)
            result["parsed_data"]["location"] = gpslookup
            imagesWithExifData.append(result)

    if len(imagesWithExifData) == 0:
        return jsonify({"error": "No images with EXIF data found"}), 422
    
    return jsonify(sorted(imagesWithExifData, key= lambda x: x["exif_data"]["timestamp"])), 200

@catch_internal_errors
def find_location_and_chronologically_sort_images():
    files = request.files.getlist('files[]')  # Use getlist to handle multiple files
    if not files:
        return jsonify({"error": "No files provided"}), 400

    # Validate files using InputImages
    validated_images = InputImages(images=files)

    results = []
    for file in validated_images.images:
        if file.filename == '':
            continue  # Skip empty files, if any
        file_extension = os.path.splitext(file.filename)[1].lower()
        response_data = extract_metadata(file.read(), file_extension)
        results.append(response_data)

    augmented_response, status_code = augment_results(results)
    if "error" in augmented_response.json:
        print("Error found:", augmented_response.json["error"])  # Log or handle the error
        return augmented_response, status_code  # Return the error response directly

    return augmented_response, 200  # Return with status code 200 on success