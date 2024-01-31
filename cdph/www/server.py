import http.server

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_response_only(self, code, message=None):
        super().send_response_only(code, message)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')

PORT = 8080
httpd = http.server.HTTPServer(('', PORT), NoCacheHTTPRequestHandler)
print(f"Serving on http://localhost:{PORT}/")
httpd.serve_forever()
