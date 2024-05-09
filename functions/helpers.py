import io
#import pyheif
from PIL import Image
import piexif
import base64

from datetime import datetime

import googlemaps
from datetime import datetime

SUPPORTED_FILE_TYPES = ['.png', '.jpg', '.jpeg']

def coordinate_lookup(coordinates):

    gmaps = googlemaps.Client(key='AIzaSyCs15m1JY0Sr9xOUtY4XDFym0R2ww-kyT8')

    # Look up an address with reverse geocoding
    address = gmaps.reverse_geocode(coordinates)

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
        print(formatted_address, business_name)
        return {
            'formatted_address': formatted_address,
            'business_or_building': business_name
        }


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
    parsed_data = {}
    parsed_data["gps"] = None
    parsed_data["timestamp"] = None

    if "GPS" in exif_dict:
        gps = exif_dict["GPS"]
        parsed_data["gps"] = convert_gps_to_decimal(gps)
    if "0th" in exif_dict:
        parsed_data["timestamp"] = (decode_datetime(exif_dict["0th"][306]))

    return parsed_data

def augment_results(results: list):
    imagesWithExifData = []
    for result in results:
        result["parsed_data"] = {}
        exif_data = result["exif_data"]
        
        if exif_data:
            gps = exif_data["gps"]
            gpslookup = coordinate_lookup(gps)
            result["parsed_data"]["location"] = gpslookup
            imagesWithExifData.append(result)
            
    if not imagesWithExifData:
        return KeyError("No images with EXIF data found")
    
    return sorted(imagesWithExifData, key= lambda x: x["exif_data"]["timestamp"])