from abc import abstractmethod
import http.server
import os
import socketserver
import subprocess
import sys
import urllib.parse
from abc import ABC

PORT = int(os.getenv("PORT", "8000"))


class ServerHandler(ABC):
    @abstractmethod
    def do_GET(self):
        pass


class HttpRouter:
    def __init__(self, routes: dict):
        self.routes = routes

    def __strip_slashes(self, endpoint: str) -> str:
        endpoint = endpoint.lstrip("/").rstrip("/")
        if not endpoint.endswith("/"):
            endpoint = f"{endpoint}/"

        return endpoint

    def get_handler(self, endpoint: str):
        endpoint = self.__strip_slashes(endpoint)
        pathparts = endpoint.split("/")
        params = {}

        # traverse the list and find the last matching
        root = self.routes["head"]
        caller = None
        fullmatch = False

        path_exhausted = lambda i: i == len(pathparts) - 2

        for i, part in enumerate(pathparts):
            # print("matching part", part)

            if part in root:
                root = root[part]
                # print(
                #     "l", len(pathparts) - 2, "i", i, "fm", path_exhausted(i - 1), root
                # )
                fullmatch = path_exhausted(i - 1)

                if fullmatch:
                    caller = root if callable(root) else None
                    # print("path exhaused")
                    break

                continue

            # print("looking for paramterized routes")
            for param, handler in root.items():
                # print("matcher", param, "urlpart", part, "ssup", root[param])
                if not param.startswith(":"):
                    continue

                # if param.startswith(":"):
                param_name = param[1:]

                # print("check if this is the last element ", i, len(pathparts) - 2)
                if path_exhausted(i):
                    # print("last element to match, returning", part)
                    params[param_name] = part
                    caller = handler if callable(handler) else None
                    return (True, caller, params)

                # print(
                #     "if this is not the last element, then further path has to be a dict"
                # )
                if isinstance(root[param], dict) and i < len(pathparts) - 2:
                    # print("more matches to find", root[param], part)
                    params[param_name] = part
                    root = root[param]

        # print("root", root, fullmatch)
        if fullmatch:
            return (True, caller, params)
        else:
            return (False, None, params)


class HTTPServer(http.server.SimpleHTTPRequestHandler):
    @classmethod
    def set_router(cls, router: HttpRouter):
        cls.router = router

    def __set_headers(self, status):
        self.send_response(status)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def set_success(self):
        self.__set_headers(200)

    def set_failure(self):
        self.__set_headers(404)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        print("accessing", parsed_path.path)
        router = self.__class__.router

        found, handler, params = router.get_handler(parsed_path.path)
        if found and handler:
            # print("calling handler with params", params)
            handler(self, params)
            return

        self.set_failure()
        return


# Read the man page content from stdin
class ManPageHandler:
    html_content = """
        <html>
        <head>
            <title>Man Page</title>
            <style>
                * {{ white-space: pre-wrap; }}
                html {{ font-size: 16px; background: #121111; color: #ebfcfa; }}
                body {{ 
                    font-family: monospace;
                    font-size: 1.4rem;
                    padding: 1.4rem;
                    display: flex;
                    width: fit-content;
                    justify-content: center;
                    }}
            </style>
        </head>
        <body>
            <pre>{man_content}</pre>
        </body>
        </html>
        """

    @classmethod
    def __get_man_page(cls, command):
        try:
            # Run the man command and capture its output
            result = subprocess.run(["man", command], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout
            else:
                return None
        except Exception as e:
            return None

    @classmethod
    def index(cls, httphandler: HTTPServer, params: dict) -> None:
        man_content = sys.stdin.read()
        httphandler.set_success()
        httphandler.wfile.write(
            cls.html_content.format(man_content=man_content).encode("utf-8")
        )

    @classmethod
    def get(cls, httphandler: HTTPServer, params: dict) -> None:
        man_content = cls.__get_man_page(params["page"])
        httphandler.set_success()
        httphandler.wfile.write(
            cls.html_content.format(man_content=man_content).encode("utf-8")
        )


routes = {
    "head": {"man": {"pages": {"": ManPageHandler.index, ":page": ManPageHandler.get}}}
}
router = HttpRouter(routes)


def run_server():
    handler = HTTPServer
    handler.set_router(router)
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    run_server()
