extern crate image;

use image::{ImageBuffer, Rgba};

#[path = "../mandelbrot.rs"]
mod mandelbrot;

fn main() -> Result<(), std::io::Error> {
    // Create a new ImgBuf with width: imgx and height: imgy
    let cols = 500;
    let rows = 400;

    let mut img_buf = vec![Rgba([0,0,0,0]); rows * cols];

    mandelbrot::render(img_buf.iter_mut().enumerate(), render_pixel, cols, rows);

    let mut img: image::ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(cols as u32, rows as u32);
    for (index, pixel) in img.pixels_mut().enumerate() {
        *pixel = img_buf[index];
    }
    img.save("target/fractal.png").unwrap();
    Ok(())
}

fn render_pixel(z: u8) -> Rgba<u8> {
    image::Rgba([z, z, z, u8::MAX])
}

