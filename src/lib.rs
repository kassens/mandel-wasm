mod mandelbrot;

const MAX_PIXELS: usize = 800 * 800;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

#[no_mangle]
pub unsafe extern fn render_js(step_size:i64, center_x:i64, cols: usize, center_y:i64, rows: usize) {
    // render_js is called from JavaScript, and should *only* be
    // called from JavaScript. It is not thread safe
    mandelbrot::render(IMG_BUFFER.iter_mut().enumerate(),
                       to_rgba_32, step_size as i128,
                      center_x as i128, cols, center_y as i128, rows);
}

fn to_rgba_32(r: u8, g: u8, b: u8) -> u32 {
    ((r as u32) << 0) +
        ((g as u32) << 8) +
        ((b as u32) << 16) +
        ((u8::MAX as u32) << 24)
}
