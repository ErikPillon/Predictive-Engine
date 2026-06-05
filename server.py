#!/usr/bin/env python3
"""
Predictive Engine Local Python Server
-------------------------------------
An elegant, zero-dependency Python script to serve the pre-compiled React 
production files with full Single Page Application (SPA) routing fallback.

Usage:
    python server.py [port]

Ensure you run 'npm run build' inside your compilation environment before using
this server so that the static 'dist/' folder is generated.
"""

import os
import sys
import argparse
from io import BytesIO
from http.server import SimpleHTTPRequestHandler, HTTPServer

class SPARequestHandler(SimpleHTTPRequestHandler):
    """
    Subclass that gracefully intercepts path requests and falls back to
    index.html to support single-page client side routers without HTTP 404s.
    """

    def _dist_dir(self):
        return os.path.join(os.getcwd(), 'dist')

    def _dist_missing(self):
        return not os.path.isdir(self._dist_dir())

    def do_GET(self):
        if self._dist_missing():
            self._serve_missing_dist_page()
            return

        super().do_GET()

    def _serve_missing_dist_page(self):
        body = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Predictive Engine Setup Needed</title>
    <style>
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f7f9fb;
        color: #191c1e;
        font-family: Arial, sans-serif;
      }}
      main {{
        width: min(760px, calc(100vw - 48px));
        padding: 32px;
        border: 1px solid #d8dee6;
        border-radius: 18px;
        background: white;
        box-shadow: 0 24px 60px rgba(25, 28, 30, 0.08);
      }}
      code {{
        display: block;
        margin: 10px 0;
        padding: 12px 14px;
        border-radius: 10px;
        background: #101820;
        color: #f4f7fb;
        overflow-x: auto;
      }}
      p {{ line-height: 1.55; }}
    </style>
  </head>
  <body>
    <main>
      <h1>The Python server is running, but the app is not built yet.</h1>
      <p>
        This server only serves the compiled Vite output from <strong>dist/</strong>.
        The raw repository contains <strong>src/main.tsx</strong>, which a browser
        cannot run directly without Vite or a production build.
      </p>
      <p>For development, install Node.js and run:</p>
      <code>npm install</code>
      <code>npm run dev</code>
      <p>For the Python static server, build first and then start it:</p>
      <code>npm run build</code>
      <code>py server.py</code>
      <p>If you meant to run <strong>servery.py</strong>, that file now forwards to <strong>server.py</strong>.</p>
    </main>
  </body>
</html>
"""
        encoded = body.encode('utf-8')
        self.send_response(503)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.copyfile(BytesIO(encoded), self.wfile)
    
    def translate_path(self, path):
        # We serve all static files exclusively out of the compiled 'dist' directory.
        root = self._dist_dir()

        # Isolate the original request path
        translated = super().translate_path(path)
        relative_path = os.path.relpath(translated, os.getcwd())
        
        # Build the targeted path relative to our preferred root
        target_path = os.path.join(root, relative_path)
        
        # If the file doesn't exist on disk, fall back to index.html to protect the SPA routing
        if not os.path.exists(target_path):
            target_path = os.path.join(root, 'index.html')
            
        return target_path

    def end_headers(self):
        # Prevent caching during local corporate simulation runs
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server(port):
    server_address = ('0.0.0.0', port)
    
    # Check if build directory is available
    dist_dir = os.path.join(os.getcwd(), 'dist')
    if not os.path.isdir(dist_dir):
        print("\n\033[33m[WARNING] Local static 'dist' directory not found!\033[0m")
        print("This server will show a setup page until the app is compiled.")
        print("Install Node.js, run 'npm install', then use either:")
        print("  npm run dev       # development server")
        print("  npm run build     # generate dist/ for this Python server\n")
    else:
        print("\n\033[32m[OK] Pre-compiled static 'dist/' directory detected.\033[0m")

    httpd = HTTPServer(server_address, SPARequestHandler)
    
    print("--------------------------------------------------")
    print(f" \033[36mPredictive Engine Corporate Server running...\033[0m")
    print(f" PORT: \033[1;37m{port}\033[0m")
    print(f" URL:  \033[1;34mhttp://localhost:{port}\033[0m")
    print("--------------------------------------------------")
    print(" Press Ctrl+C to terminate the local daemon.\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\033[31m[SHUTDOWN] Terminating server pool... Goodbye.\033[0m\n")
        sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predictive Engine Python Server")
    parser.add_argument(
        'port', 
        type=int, 
        nargs='?', 
        default=3000, 
        help="Specify port (default: 3000)"
    )
    args = parser.parse_args()
    run_server(args.port)
