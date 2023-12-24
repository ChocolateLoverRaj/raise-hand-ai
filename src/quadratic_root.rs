/// Returns `(middle, difference)`. To get the two solutions just do middle + difference or middle - difference, whatever u want.
pub fn quadratic_root(a: f64, b: f64, c: f64) -> (f64, f64) {
    (
        -b / ((2 as f64) * a),
        (b.powi(2) - (4 as f64) * a * c).sqrt() / ((2 as f64) * a),
    )
}

#[cfg(test)]
mod tests {
    use crate::quadratic_root::quadratic_root;

    #[test]
    fn x_squared() {
        // x^2
        let result = quadratic_root(1 as f64, 0 as f64, 0 as f64);
        assert_eq!(result, (0 as f64, 0 as f64));
    }

    #[test]
    fn x_squared_minus_4() {
        // x^2 - 4
        let result = quadratic_root(1 as f64, 0 as f64, -4 as f64);
        assert_eq!(result, (0 as f64, 2 as f64));
    }

    #[test]
    fn two_x_squared_minus_two_x_minus_24() {
        // x^2 - 4
        let result = quadratic_root(2 as f64, -2 as f64, -24 as f64);
        assert_eq!(result, (0.5 as f64, 3.5 as f64));
    }
}
