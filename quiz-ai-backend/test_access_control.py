import unittest
from unittest.mock import patch
from app import app
from routes.video_routes import require_video

class TestAccessControl(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch("routes.video_routes.get_video_by_id")
    def test_require_video_ownership(self, mock_get_video):
        # When user B tries to access user A's video, get_video_by_id returns None
        mock_get_video.return_value = None
        result = require_video(video_id=101, user_id=2)
        self.assertIsNone(result)

        # When user A accesses their own video
        mock_get_video.return_value = {"id": 101, "user_id": 1, "title": "User A's Video"}
        result = require_video(video_id=101, user_id=1)
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 101)

    @patch("routes.video_routes.require_video")
    def test_chat_cross_user_returns_404(self, mock_require_video):
        mock_require_video.return_value = None  # user B has no access to user A's video
        with self.app.session_transaction() as sess:
            sess["user_id"] = 2  # logged in as user B

        response = self.app.post("/api/chat/101", json={"message": "hello"})
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Video not found or access denied", response.data)

    @patch("routes.video_routes.require_video")
    def test_generate_cross_user_returns_404(self, mock_require_video):
        mock_require_video.return_value = None  # user B has no access to user A's video
        with self.app.session_transaction() as sess:
            sess["user_id"] = 2  # logged in as user B

        response = self.app.post("/api/generate/101", json={"difficulty": "medium"})
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Video not found or access denied", response.data)

    @patch("routes.video_routes.require_video")
    def test_flashcards_cross_user_returns_404(self, mock_require_video):
        mock_require_video.return_value = None
        with self.app.session_transaction() as sess:
            sess["user_id"] = 2

        response = self.app.post("/api/flashcards/101", json={})
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Video not found or access denied", response.data)

    @patch("routes.video_routes.require_video")
    def test_mindmap_cross_user_returns_404(self, mock_require_video):
        mock_require_video.return_value = None
        with self.app.session_transaction() as sess:
            sess["user_id"] = 2

        response = self.app.post("/api/mindmap/101", json={})
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Video not found or access denied", response.data)

    @patch("routes.video_routes.get_quiz")
    def test_submit_quiz_cross_user_returns_404(self, mock_get_quiz):
        mock_get_quiz.return_value = None  # user B cannot access user A's quiz
        with self.app.session_transaction() as sess:
            sess["user_id"] = 2

        response = self.app.post("/api/quiz/999/submit", json={"answers": [0, 1]})
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Quiz not found or access denied", response.data)

if __name__ == "__main__":
    unittest.main()
