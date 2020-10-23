extern crate num_complex;

const MAX_DIM: usize = 2200;
const MAX_PIXELS: usize = MAX_DIM * MAX_DIM;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

#[no_mangle]
pub unsafe extern fn render_js() {
    // This is function called from JavaScript, and should *only* be
    // called from JavaScript. This is not thread safe
    render_safe(&mut IMG_BUFFER);
}

fn render_safe(buffer: &mut [u32; MAX_PIXELS]) {
    let width = 800;
    let height = 800;
    let ax = -2.0;
    let ay = -2.0;
    let bx = 2.0;
    let by = 2.0;
    let scale_x = width as f64/(bx-ax);
    let scale_y = height as f64/(by-ay);

    //console::log_2(&"Rogging arbitrary values looks like".into(), &width.into());

    for px in 0..width {
        for py in 0..height {
            let cx = ax + px as f64 / scale_x;
            let cy = ay + py as f64 / scale_y;
            let z = calc_z(cx, cy);
            buffer[px + py * width] = as_u32_le( [z, 0, 0, 255]);
        }
    }
}

fn as_u32_le(array: [u8; 4]) -> u32 {
    ((array[0] as u32) << 0) +
        ((array[1] as u32) << 8) +
        ((array[2] as u32) << 16) +
        ((array[3] as u32) << 24)
}


fn calc_z(cx: f64, cy: f64) -> u8 {
    let c = num_complex::Complex::new(cx, cy);
    let mut z = num_complex::Complex::new(cx, cy);

    let mut i = 0;
    while i < u8::MAX && z.norm() <= 3.0 {
        z = z * z + c;
        i += 1;
    }
    return i;
}
