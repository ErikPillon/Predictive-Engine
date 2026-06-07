import os
import json
from pathlib import Path

def generate_config():
    # Read environment variables injected by Vercel
    supabase_url = (
        os.environ.get("SUPABASE_URL")
        or os.environ.get("VITE_SUPABASE_URL")
        or ""
    )
    supabase_anon_key = (
        os.environ.get("SUPABASE_PUBLISHABLE_KEY")
        or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("VITE_SUPABASE_ANON_KEY")
        or ""
    )
    supabase_data_api = (
        os.environ.get("SUPABASE_DATA_API")
        or ""
    )

    config = {
        "supabaseUrl": supabase_url,
        "supabaseAnonKey": supabase_anon_key,
        "supabaseDataApi": supabase_data_api,
    }

    # Ensure assets directory exists
    assets_dir = Path("assets")
    assets_dir.mkdir(exist_ok=True)

    # Write the config payload to assets/config.js
    config_path = assets_dir / "config.js"
    payload = json.dumps(config)
    config_path.write_text(f"window.PREDICTIVE_ENGINE_CONFIG = {payload};\n", encoding="utf-8")
    
    print("✅ Build complete: Generated assets/config.js with Vercel environment variables.")

if __name__ == "__main__":
    generate_config()
