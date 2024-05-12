from flask import Flask
from flask_cors import CORS
from backend.entry_points.handler import api_v1  # Import the Blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(api_v1, url_prefix='')  # Register Blueprint

if __name__ == '__main__':
    app.run(debug=True)