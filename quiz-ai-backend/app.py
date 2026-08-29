

# from flask import Flask
# from flask_cors import CORS

# from routes.video_routes import video_bp

# app = Flask(__name__)
# CORS(app)  # allows the frontend (running on a different port) to call this API

# app.register_blueprint(video_bp)


# @app.route("/")
# def health_check():
#     return {"status": "AI Video Summarizer & Quiz Generator backend is running"}


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)



from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import limiter
from routes.video_routes import video_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

# Initialize Rate Limiter
limiter.init_app(app)

# supports_credentials=True lets the browser send/receive the session cookie.
CORS(app, supports_credentials=True, origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
])

app.register_blueprint(video_bp)
app.register_blueprint(auth_bp)


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Too many requests. Please slow down and wait a minute before trying again."
    }), 429


@app.route("/")
def health_check():
    return {"status": "AI Video Summarizer & Quiz Generator backend is running"}


if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)