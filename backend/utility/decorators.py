from flask import jsonify

def catch_internal_errors(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Retrieve the type of exception
            exc_type = type(e).__name__

            # Optionally, log the full error including traceback for internal use
            # This can be useful for debugging but should be handled securely
            import traceback
            traceback_details = traceback.format_exc()

            # Log the error here if logging is set up
            # Example: logger.error(f"Error of type {exc_type}: {traceback_details}")

            return jsonify({
                "error": "Internal server error",
                "exception_type": exc_type,
                "details": str(e),
                "traceback": traceback_details  # Consider security implications of sending traceback to the client
            }), 500
    return wrapper
