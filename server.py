#!/usr/bin/env python3
"""
Predictive Engine local Python server.

Usage:
    py server.py [port]

This server does not require Node, npm, Vite, or a production build. It serves
the plain HTML/CSS/JavaScript app in this folder and exposes Supabase public
configuration from .env.local, .env, or the process environment.
"""

import argparse
import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent


def load_env_file(path):
    values = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def load_supabase_config():
    file_values = {}
    for name in (".env.local", ".env"):
        file_values.update(load_env_file(ROOT / name))

    supabase_url = (
        os.environ.get("SUPABASE_URL")
        or os.environ.get("VITE_SUPABASE_URL")
        or file_values.get("SUPABASE_URL")
        or file_values.get("VITE_SUPABASE_URL")
        or ""
    )
    supabase_anon_key = (
        os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("VITE_SUPABASE_ANON_KEY")
        or file_values.get("SUPABASE_ANON_KEY")
        or file_values.get("VITE_SUPABASE_ANON_KEY")
        or ""
    )

    return {
        "supabaseUrl": supabase_url,
        "supabaseAnonKey": supabase_anon_key,
    }


class PredictiveEngineHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed_path = urlparse(path).path
        safe_path = unquote(parsed_path).lstrip("/")
        target = (ROOT / safe_path).resolve()

        if target.is_dir():
            target = target / "index.html"

        if not str(target).startswith(str(ROOT)) or not target.exists():
            target = ROOT / "index.html"

        return str(target)

    def do_GET(self):
        if urlparse(self.path).path == "/assets/config.js":
            self.serve_config()
            return
        super().do_GET()

    def serve_config(self):
        payload = json.dumps(load_supabase_config())
        body = f"window.PREDICTIVE_ENGINE_CONFIG = {payload};\n".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def run_server(port):
    config = load_supabase_config()
    httpd = HTTPServer(("0.0.0.0", port), PredictiveEngineHandler)

    print("--------------------------------------------------")
    print(" Predictive Engine Python server running")
    print(f" PORT: {port}")
    print(f" URL:  http://localhost:{port}")
    if config["supabaseUrl"] and config["supabaseAnonKey"]:
        print(" AUTH: Supabase configuration detected")
    else:
        print(" AUTH: Supabase configuration missing")
        print("       Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local")
    print("--------------------------------------------------")
    print(" Press Ctrl+C to terminate.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Server stopped.\n")
        sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predictive Engine Python Server")
    parser.add_argument("port", type=int, nargs="?", default=3000, help="Port, default 3000")
    args = parser.parse_args()
    run_server(args.port)
