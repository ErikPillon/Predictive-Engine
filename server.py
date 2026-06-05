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
from http.server import SimpleHTTPRequestHandler, HTTPServer

class SPARequestHandler(SimpleHTTPRequestHandler):
    """
    Subclass that gracefully intercepts path requests and falls back to
    index.html to support single-page client side routers without HTTP 404s.
    """
    
    def translate_path(self, path):
        # We serve all static files exclusively out of the compiled 'dist' directory.
        root = os.path.join(os.getcwd(), 'dist')
        
        # If the compiled 'dist' folder is missing, gracefully serve from the root directory
        if not os.path.isdir(root):
            root = os.getcwd()

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
        print("Please compile the application using 'npm run build' if you have access to node,")
        print("otherwise the server will serve raw repository source files directly.\n")
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
