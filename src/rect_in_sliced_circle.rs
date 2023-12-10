use real_float::Real;

use crate::quadratic_root::quadratic_root;

#[derive(PartialEq, Debug)]
pub struct Output {
    pub bottom_left_corner: (f64, f64),
    pub scale: f64,
}

pub struct Ratio {
    pub width: f64,
    pub height: f64,
}

pub struct Slice {
    pub position: f64,
    pub direction: f64,
}

pub fn rect_in_sliced_circle(
    ratio: Ratio,
    vertical_slice: Slice,
    horizontal_slice: Slice,
) -> Output {
    let diagonal = (ratio.width * ratio.height).powf(0.5);
    let with_horizontal_baseline = {
        // Try to make a rectangle centered x
        // For horizontal slice
        // y + mx = sqrt(1 - x^2)
        // (y + mx)^2 = 1 - x^2
        // y^2 + 2ymx + m^2 * x^2 = 1 - x^2
        // We get a quadratic equation
        // (m^2 + 1)*x^2 + 2ymx + (y^2-1) = 0
        let y_0 = horizontal_slice.position;
        let final_x = {
            let m = ratio.height / (0.5 * ratio.width);
            let (middle, difference) = quadratic_root(
                m.powi(2) + (1 as f64),
                (2 as f64) * y_0 * m,
                y_0.powi(2) - (1 as f64),
            );
            (middle + difference * horizontal_slice.direction).abs()
        };
        dbg!(final_x);
        let final_x = final_x.min(((1 as f64) - y_0.powi(2)).sqrt());
        dbg!(final_x);
        if final_x < vertical_slice.position {
            Output {
                bottom_left_corner: if horizontal_slice.direction == (1 as f64) {
                    (0 as f64, y_0)
                } else {
                    (-final_x, -((1 as f64) - final_x.powi(2)).sqrt())
                },
                scale: final_x * (2 as f64) / ratio.width,
            }
        } else {
            if vertical_slice.direction == (1 as f64) {
                let m = ratio.height / ratio.width;
                let x_0 = vertical_slice.position * vertical_slice.direction;
                let a = m.powi(2) + (1 as f64);
                let b = (2 as f64) * y_0 * m - (2 as f64) * m.powi(2) * x_0;
                let c =
                    y_0.powi(2) - (2 as f64) * y_0 * m * x_0 + m.powi(2) * x_0.powi(2) - (1 as f64);
                let (middle, difference) = quadratic_root(a, b, c);
                let final_x = middle + difference;
                Output {
                    bottom_left_corner: (x_0, y_0),
                    scale: (final_x - x_0) / ratio.width,
                }
            } else {
                let m = -(ratio.height / ratio.width);
                let x_0 = vertical_slice.position;

                let a = m.powi(2) + (1 as f64);
                let b = (2 as f64) * y_0 * m - (2 as f64) * m.powi(2) * x_0;
                let c =
                    y_0.powi(2) - (2 as f64) * y_0 * m * x_0 + m.powi(2) * x_0.powi(2) - (1 as f64);
                let (middle, difference) = quadratic_root(a, b, c);
                let final_x = middle - difference;
                Output {
                    bottom_left_corner: (final_x, y_0),
                    scale: (x_0 - final_x) / ratio.width,
                }
            }
        }
    };
    with_horizontal_baseline
    // Output {
    //     bottom_left_corner: (0.0, 0.0),
    //     scale: 0.0,
    // }
}

#[cfg(test)]
mod tests {
    use crate::rect_in_sliced_circle::{rect_in_sliced_circle, Output, Ratio, Slice};

    #[test]
    fn top_center_unrestricted() {
        // https://www.desmos.com/calculator/o2rt0jzjfh
        let result = rect_in_sliced_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 1 as f64,
                direction: -1 as f64,
            },
            Slice {
                position: 0.5,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (0 as f64, 0.5),
                scale: 0.04729528752827964
            }
        );
    }

    #[test]
    fn top_restricted_right_side() {
        // https://www.desmos.com/calculator/9h286kf4c0
        let result = rect_in_sliced_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 0.3,
                direction: -1 as f64,
            },
            Slice {
                position: 0.5,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (-0.42245787950963365, 0.5),
                scale: 0.045153617469352106
            }
        );
    }

    #[test]
    fn top_right() {
        //https://www.desmos.com/calculator/csdcd7shai
        let result = rect_in_sliced_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 0.3,
                direction: 1 as f64,
            },
            Slice {
                position: 0.5,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (0.3, 0.5),
                scale: 0.024557375917676417
            }
        );
    }

    #[test]
    fn huge_center_unrestricted() {
        // https://www.desmos.com/calculator/bjo9nejlts
        let result = rect_in_sliced_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 1 as f64,
                direction: -1 as f64,
            },
            Slice {
                position: 0.5,
                direction: -1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (-0.8749140243641682, -0.48427827740968893),
                scale: 0.10936425304552103
            }
        );
    }

    #[test]
    fn restricted_by_circle() {
        // https://www.desmos.com/calculator/8ywmkofj22
        let result = rect_in_sliced_circle(
            Ratio {
                width: 32 as f64,
                height: 9 as f64,
            },
            Slice {
                position: -0.8,
                direction: 1 as f64,
            },
            Slice {
                position: 1 as f64,
                direction: -1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (0 as f64, -0.8),
                scale: -0.034
            }
        );
    }
}
