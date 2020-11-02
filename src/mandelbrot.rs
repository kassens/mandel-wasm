use std::slice::IterMut;
use std::iter::Enumerate;
use num_traits;
use num_rational::Rational64;
use num_traits::ToPrimitive;
use num_complex::Complex;

pub fn render<T, F>(iter: Enumerate<IterMut<T>>, store_pixel: F, cols: usize, rows: usize) where
    F: Fn(u8, u8, u8) ->  T {
    let denom = 180 as i64;
    let x_start = -2 * denom;
    let y_start = denom * -1;
    for (index, pixel) in iter {
        let cx = Rational64::new(x_start + (index%cols) as i64, denom);
        let y_offset = index / cols;
        if y_offset >= rows {
            break;
        }
        let cy = Rational64::new(y_start + y_offset as i64, denom);
        let z = calc_z(cx, cy);
        *pixel = store_pixel(z, z, z);
    }
}


fn calc_z(cx: Rational64, cy: Rational64) -> u8 {
    let fx = cx.to_f64().unwrap();
    let fy = cy.to_f64().unwrap();
    let c = num_complex::Complex::new(fx, fy);
    let mut z = c.clone();

    let mut i = 0;
    while i < u8::MAX && z.norm_sqr() < 3.0 {
        z = z*z+c;
        i += 1;
    }
    return i;
}
