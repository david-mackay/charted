import attr
from werkzeug.datastructures import FileStorage

@attr.s
class InputImages:
    images: list = attr.ib()

    @images.validator
    def check_images(self, attribute, value):
        if not all(isinstance(image, FileStorage) for image in value):
            raise ValueError("All items must be files.")

        valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'}
        for image in value:
            ext = image.filename.rsplit('.', 1)[1].lower() if '.' in image.filename else ''
            if f".{ext}" not in valid_extensions:
                raise ValueError(f"Invalid file extension: {ext}. Allowed extensions: {valid_extensions}")
