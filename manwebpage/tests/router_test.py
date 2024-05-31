import unittest
import sys, os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import HttpRouter


class MockHandler:
    @classmethod
    def index(cls, endpoint):
        pass


class TestHttpRouter(unittest.TestCase):
    def setUp(self):
        self.routes = {
            "head": {
                "man": {
                    "pages": {
                        "": MockHandler.index,
                        ":page": 1,
                        ":name": {":page": 2, "section": {":page": 3}},
                    },
                }
            }
        }
        self.router = HttpRouter(self.routes)

    def test_static_route(self):
        # return
        result, handler, params = self.router.get_handler("/man/pages")
        self.assertTrue(result)
        self.assertEqual(handler, MockHandler.index)
        self.assertEqual(params, {})

    def test_dynamic_route_single_param(self):
        # return
        result, handler, params = self.router.get_handler("/man/pages/1")
        self.assertTrue(result)
        self.assertIsNone(handler)
        self.assertEqual(params, {"page": "1"})

    def test_dynamic_route_multiple_params(self):
        # return
        result, handler, params = self.router.get_handler("/man/pages/lsof/5")
        self.assertTrue(result)
        self.assertIsNone(handler)
        self.assertEqual(params, {"name": "lsof", "page": "5"})

    def test_invalid_route(self):
        # return
        result, handler, params = self.router.get_handler("/man/page/xyz")
        self.assertFalse(result)
        self.assertIsNone(handler)
        self.assertEqual(params, {})

    def test_invalid_dynamic_route(self):
        # return
        result, handler, params = self.router.get_handler("/man/pages/lsof/section/3")
        self.assertTrue(result)
        self.assertIsNone(handler)
        self.assertEqual(params, {"name": "lsof", "page": "3"})


if __name__ == "__main__":
    unittest.main()
