import os
from PIL import Image

def extract_metadata(directory):
    metadata_list = []

    # Loop through all files in the directory
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            # Construct the full file path
            file_path = os.path.join(directory, filename)
            
            try:
                # Open the image file
                with Image.open(file_path) as img:
                    # Extract EXIF data
                    exif_data = img._getexif()
                    
                    # Convert EXIF data to a more readable format (if it exists)
                    if exif_data:
                        exif = {
                            PIL.ExifTags.TAGS[k]: v
                            for k, v in exif_data.items()
                            if k in PIL.ExifTags.TAGS
                        }
                        metadata_list.append({'filename': filename, 'metadata': exif})
                    else:
                        metadata_list.append({'filename': filename, 'metadata': 'No EXIF data'})
            except IOError:
                print(f"Error opening or reading image file {filename}")

    return metadata_list

# Directory containing images
image_directory = './sample_images/'

# Extract metadata
extracted_metadata = extract_metadata(image_directory)
for data in extracted_metadata:
    print(data)
