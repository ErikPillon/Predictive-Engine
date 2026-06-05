<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/007e47df-fad2-4613-8fc6-6a8425deb07f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app in development mode:
   `npm run dev`

## Run With The Python Static Server

`server.py` serves the compiled production files from `dist/`. Build the app
before starting the Python server:

1. Install dependencies:
   `npm install`
2. Build the app:
   `npm run build`
3. Start the static server:
   `py server.py`

If you accidentally run `py servery.py`, it forwards to `server.py`.
