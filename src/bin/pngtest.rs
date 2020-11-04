extern crate image;

use image::{ImageBuffer, Rgba};

#[path = "../mandelbrot.rs"]
mod mandelbrot;

fn main() -> Result<(), std::io::Error> {
    // Create a new ImgBuf with width: imgx and height: imgy
    let cols = 500;
    let rows = 400;

    let mut img_buf = vec![Rgba([0, 0, 0, 0]); rows * cols];

    let step_size: i64 = 300;
    /*
    let x_start: i64 = (3681 * step_size)/10000 - cols as i64/2;
    let y_start: i64 = (150*step_size)/1000 - rows as i64/2;
    println!("x:{}", x_start as f64/step_size as f64);
    println!("y:{}", y_start as f64/step_size as f64);
     */
    mandelbrot::render(img_buf.iter_mut().enumerate(), store_pixel,
                       step_size, 0, cols, 0, rows);

    let mut img: image::ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(cols as u32, rows as u32);
    // it seems silly we have to do this but I couldn't get IterMut and PixelsMut to line up, type-wise
    for (index, pixel) in img.pixels_mut().enumerate() {
        *pixel = img_buf[index];
    }
    img.save("target/fractal.png").unwrap();
    Ok(())
}

fn store_pixel(r: u8, g: u8, b: u8) -> Rgba<u8> {
    image::Rgba([r, g, b, u8::MAX])
}

