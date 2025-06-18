import http.server
import socketserver
from google.cloud import secretmanager
import json

client = secretmanager.SecretManagerServiceClient()


# Access the secret version.
response = client.access_secret_version(request={"name": "projects/448051169534/secrets/firestore-creds/versions/latest"})
payload = response.payload.data.decode("UTF-8")
auth_dict = json.loads(payload)

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/get-sensitive-data":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(json.dumps(json.loads(payload)).encode())
        else:
            super().do_GET()

PORT = 8080
with socketserver.TCPServer(('', PORT), NoCacheHTTPRequestHandler) as httpd:
    print(f"Serving on http://localhost:{PORT}/")
    httpd.serve_forever()


