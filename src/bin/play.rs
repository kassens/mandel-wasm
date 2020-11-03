use fixed::{types::extra::U123, FixedI128};
use num_complex::Complex;

type Fix = FixedI128<U123>;
type MaybeComplex = Option<Complex<Fix>>;

#[test]
fn it_works() {
    println!("{}", Fix::MIN);
    println!("{}", Fix::MAX);
    let one = Fix::from_num(1);
    let oneone = Fix::from_num(1);
    let max = Fix::MAX;
    let maxbb = Fix::MAX;
    let checked = max.checked_mul(max);
    println!("cehck {:#?}", checked);
    println!("one {} {}", one, oneone);
    println!("one {} {}", max, maxbb);
    //let zz = calc_zf(zero, zero);
    //let zz = calc_zf(Fix::MIN, Fix::MAX);
    //println!("zzz {}", zz);


    /*
    assert_eq!(eleven, FixedI128::<U3>::from_bits(11 << 3));
    assert_eq!(eleven, 11);
    assert_eq!(eleven.to_string(), "11");
    let two_point_75 = eleven / 5;
    assert_eq!(two_point_75, FixedI128::<U3>::from_bits(11 << 1));
    assert_eq!(two_point_75, 2.75);
    assert_eq!(two_point_75.to_string(), "2.8");
     */
}

fn _calc_zf(cx: Fix, cy: Fix) -> u8 {
    let bx: Fix = Fix::from_num(cx);
    let by: Fix = Fix::from_num(cy);
    let clamp: Fix = Fix::from_num(9);
    let c = Complex::new(bx, by);

    let mut i = 0;
    let mut z = Some(c);
    while i < u8::MAX && in_bounds(z, clamp) {
        //(a+biw(c+di) = (ac−bd) + (ad+bc)i
        z = iter_z(z, c);
        i += 1;
    }
    return i;
}

fn in_bounds(opt_lz: MaybeComplex, clamp:Fix) -> bool {
    fn inner(o:MaybeComplex) -> Option<Fix> {
        let lz = o?;
        Some(lz.re.checked_mul(lz.re)? + lz.im.checked_mul(lz.im)?)
    };
    match inner(opt_lz) {
        Some(n) => n < clamp,
        None => false
    }
}

fn iter_z(opt_lz: MaybeComplex, c:Complex<Fix>) -> MaybeComplex {
    let lz = opt_lz?;
    let sqr_re = lz.re.checked_mul(lz.re)? - lz.im.checked_mul(lz.im)?;
    let sqr_im = lz.re.checked_mul(lz.im.checked_mul(Fix::from_num(2))?)?;
    Some(Complex::new(sqr_re + c.re, sqr_im + c.im))
}

fn main() -> Result<(), std::io::Error> {
    Ok(())
}
