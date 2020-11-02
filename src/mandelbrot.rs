use std::slice::IterMut;
use std::iter::Enumerate;
use num_traits;
use num_rational::Rational64;
use num_traits::ToPrimitive;
use num_complex::Complex;

pub fn render<T, F>(iter: Enumerate<IterMut<T>>, store_pixel: F, step_size: i64,
                    center_x: i64, cols: usize, center_y:i64, rows: usize) where
    F: Fn(u8, u8, u8) ->  T {
    let x_start = center_x - cols as i64/2;
    let y_start = center_y - rows as i64/2;
    for (index, pixel) in iter {
        let cx = Rational64::new(x_start + (index%cols) as i64, step_size);
        let y_offset = index / cols;
        if y_offset >= rows {
            break;
        }
        let cy = Rational64::new(y_start + y_offset as i64, step_size);
        let z = calc_z(cx, cy);
        *pixel = store_pixel(z, z, z);
    }
}


fn calc_z(cx: Rational64, cy: Rational64) -> u8 {
    let fx = cx.to_f64().unwrap();
    let fy = cy.to_f64().unwrap();
    let c = Complex::new(fx, fy);
    let mut z = c.clone();

    let mut i = 0;
    while i < u8::MAX && z.norm() < 3.0 {
        z = z*z+c;
        i += 1;
    }
    return i;
}
