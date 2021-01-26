# WASM WebGL Mandelbrot Renderer

## Run
Build wasm library:
`cargo build --target wasm32-unknown-unknown --release`
Start python server:
`python serve.py`
Open Chrome web browser:
`http://localhost:8000/www/`

## Test
Run binary (not wasm):
`cargo run`
Open resulting png image;
`open target/fractal.png`
