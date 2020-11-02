use std::slice::IterMut;
use std::iter::Enumerate;

pub fn render<T, F>(iter: Enumerate<IterMut<T>>, render_pixel: F, cols: usize, rows: usize) where
    F: Fn(u8) -> T {
//pub fn render_safe(buffer: &mut [u32; MAX_PIXELS], cols: usize, rows: usize) {
    //let row_count = rows as u64;
    for (index, pixel) in iter {
        let step_size: f64 = 0.006;
        let cx = -2.0 + step_size * (index % cols) as f64;
        let y_offset = index / cols;
        if y_offset >= rows {
            break;
        }
        let cy = -1.0 + y_offset as f64 * 0.006;
        let z = calc_z(cx, cy, 3.0);
        *pixel = render_pixel(z);
    }
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
