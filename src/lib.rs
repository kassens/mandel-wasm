extern crate num_complex;

//use num_rational::{Ratio, BigRational};
//use num_bigint::BigInt;

const MAX_DIM: usize = 2200;
const MAX_PIXELS: usize = MAX_DIM * MAX_DIM;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

#[no_mangle]
pub unsafe extern fn render_js(cols:usize, rows: usize) {
    // This is function called from JavaScript, and should *only* be
    // called from JavaScript. This is not thread safe
    render_safe(&mut IMG_BUFFER, cols, rows);
}

fn render_safe(buffer: &mut [u32; MAX_PIXELS], cols: usize, rows: usize) {
    //let row_count = rows as u64;
    for (index, pixel) in buffer.iter_mut().enumerate() {
        let step_size:f64 = 0.006;
        let cx = -2.0 + step_size * (index % cols) as f64;
        let y_offset = index / cols;
        if y_offset >= rows {
            break;
        }
        let cy = -1.0 + y_offset as f64 * 0.006;
        let z = calc_z(cx, cy, 3.0);
        *pixel = as_u32_le([z,z,z,u8::MAX]);
    }
}

fn as_u32_le(array: [u8; 4]) -> u32 {
    ((array[0] as u32) << 0) +
        ((array[1] as u32) << 8) +
        ((array[2] as u32) << 16) +
        ((array[3] as u32) << 24)
}


fn calc_z(cx: f64, cy: f64, clamp: f64) -> u8 {
    let c = num_complex::Complex::new(cx, cy);
    let mut z = num_complex::Complex::new(cx, cy);

    let mut i = 0;
    while i < u8::MAX && z.norm() < clamp {
        z = z * z + c;
        i += 1;
    }
    return i;
}
