from flask import jsonify

def catch_internal_errors(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Log the error here if logging is set up
            return jsonify({"error": "Internal server error", "details": str(e)}), 500
    return wrapper
