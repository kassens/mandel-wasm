mod mandelbrot;

extern crate num_complex;

//use num_rational::{Ratio, BigRational};
//use num_bigint::BigInt;

const MAX_DIM: usize = 2200;
const MAX_PIXELS: usize = MAX_DIM * MAX_DIM;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

#[no_mangle]
pub unsafe extern fn render_js(cols: usize, rows: usize) {
    // This is function called from JavaScript, and should *only* be
    // called from JavaScript. This is not thread safe
    mandelbrot::render_safe(IMG_BUFFER.iter_mut().enumerate(),
                            |z| as_u32_le([z, z, z, u8::MAX]),
                             cols, rows);
}

fn as_u32_le(array: [u8; 4]) -> u32 {
    ((array[0] as u32) << 0) +
        ((array[1] as u32) << 8) +
        ((array[2] as u32) << 16) +
        ((array[3] as u32) << 24)
}
