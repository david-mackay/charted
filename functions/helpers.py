import io
import pyheif
from PIL import Image
import piexif
import base64

from datetime import datetime

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
    if file_extension in ['.png', '.jpg', '.jpeg']:
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
        
        if 'exif' in img.info:
            exif_data = piexif.load(img.info['exif'])
            response.update({"exif_data": parse_exif_data(exif_data)})
        
        return response
    return {"error": "No valid image data found"}

def parse_exif_data(exif_dict):
    parsed_data = {}
    gps = exif_dict["GPS"]
    gps = convert_gps_to_decimal(gps)
    timestamp = (decode_datetime(exif_dict["0th"][306]))

    print(gps)

    return parsed_data