

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



from flask import Flask
from flask_cors import CORS

from config import Config
from routes.video_routes import video_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

# supports_credentials=True lets the browser send/receive the session cookie.
# NOTE: with credentials enabled, origins can't be "*" — list your actual
# frontend origin(s) here. Adjust the port below to match your Live Server port.
CORS(app, supports_credentials=True, origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
])

app.register_blueprint(video_bp)
app.register_blueprint(auth_bp)


@app.route("/")
def health_check():
    return {"status": "AI Video Summarizer & Quiz Generator backend is running"}


if __name__ == "__main__":
    app.run(debug=True, port=5000, threaded=True)