const MAX_DIM: usize = 2200;
const MAX_PIXELS: usize = MAX_DIM * MAX_DIM;

#[no_mangle]
static mut IMG_BUFFER: [u32; MAX_PIXELS] = [0; MAX_PIXELS];

#[no_mangle]
pub unsafe extern fn render_js() {
    // This is called from JavaScript, and should *only* be
    // called from JavaScript. If you maintain that condition,
    // then we know that the &mut we're about to produce is
    // unique, and therefore safe.
    render_safe(&mut IMG_BUFFER);
}

fn render_safe(buffer: &mut [u32; MAX_PIXELS]) {
    for pixel in buffer.iter_mut() {
        *pixel = 0xFF_FF_00_FF;
    }
}

