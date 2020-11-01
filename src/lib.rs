extern crate num_complex;
extern crate num_rational;

use num_rational::{Ratio, BigRational};
use num_bigint::BigInt;

const MAX_DIM: usize = 2200;
const MAX_PIXELS: usize = MAX_DIM * MAX_DIM;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

// This is function called from JavaScript, and should *only* be
// called from JavaScript. This is not thread safe
#[no_mangle]
pub unsafe extern fn render_js(step_size: i64, x: i64, y: i64, cols: usize, rows: usize) {
    // 1/step_size = distance between pixels
    // x,y = signed number of steps from origin in x,y
    render_safe(&mut IMG_BUFFER, step_size, x, y, rows, cols);
}

fn render_safe(buffer: &mut [u32; MAX_PIXELS], step_size: i64, start_x: i64, start_y: i64, cols: usize, rows: usize) {
    let row_count = rows as u64;
    for (index, pixel) in buffer.iter_mut().enumerate() {
        /*
        let x = start_x + (index % cols) as u64;
        let y_offset = (index / cols) as u64;
        if y_offset >= row_count || index > 20000 {
            break;
        }
        let y = start_y + y_offset;
        let cx = Ratio::new(x, step_size);
        let cy = Ratio::new(y, step_size);
        let z = calc_z(cx, cy, clamp);
         */

        // go from x = -2 to 1 over 500 cols
        // go from y = -1 to 1 over 200 rows
        const tcol: usize = 500;
        const trow: usize = 400;
        let cx = -2.0 + 0.006 * (index % tcol) as f64;
        let y_offset = index / tcol;
        if y_offset >= trow {
            break;
        }
        let cy = -1.0 + y_offset as f64 * 0.006;
        let z = calc_z(cx, cy, 64.0);
        /*
        let rx = Ratio::from_float(cx).unwrap();
        let ry = Ratio::from_float(cy).unwrap();
        let z = calc_z(rx, ry, clamp);
        */

        /*
        const tcol : usize = 500;
        const trow : usize = 400;
        let x_offset= (index % tcol) as i64;
        let y_offset= (index / tcol) as i64;
        if y_offset >= trow as i64 {
            break;
        }
        let cx: Ratio<i64> = Ratio::new(x_offset-250, 250);
        let cy: Ratio<i64> = Ratio::new(y_offset-200, 200);
        let z = calc_z(cx, cy, clamp);

         */
        *pixel = as_u32_le([z, z, z, 255]);
    }
}

fn as_u32_le(array: [u8; 4]) -> u32 {
    ((array[0] as u32) << 0) +
        ((array[1] as u32) << 8) +
        ((array[2] as u32) << 16) +
        ((array[3] as u32) << 24)
}


//fn calc_z(cx: Ratio<i64>, cy: Ratio<i64>, clamp: Ratio<i64>) -> u8 {
fn calc_z(cx: f64, cy: f64, clamp: f64) -> u8 {
    let c = num_complex::Complex::new(cx, cy);
    let mut z = num_complex::Complex::new(cx, cx);

    let mut i = 0;
    while i < u8::MAX && z.norm() < 3.0 {
        z = z * z + c;
        i += 1;
    }
    return i;
}
