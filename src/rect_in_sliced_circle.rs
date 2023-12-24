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

/// Returns the x coordinates of the intersections, least to greatest
fn circle_line_intersection(m: f64, point: (f64, f64)) -> (f64, f64) {
    let (x_0, y_0) = point;
    let a = m.powi(2) + (1 as f64);
    let b = (2 as f64) * y_0 * m - (2 as f64) * m.powi(2) * x_0;
    let c = y_0.powi(2) - (2 as f64) * y_0 * m * x_0 + m.powi(2) * x_0.powi(2) - (1 as f64);
    let (middle, difference) = quadratic_root(a, b, c);
    (middle - difference, middle + difference)
}

pub fn rect_in_sliced_unit_circle(
    ratio: Ratio,
    vertical_slice: Slice,
    horizontal_slice: Slice,
) -> Output {
    // Try putting the center of the rectangle at the origin first
    let m = ratio.height / ratio.width;
    let a = m.powi(2) + (1 as f64);
    let b = 0 as f64;
    let c = -1 as f64;
    let (middle, difference) = quadratic_root(a, b, c);
    let right_x = middle + difference;
    let scale = right_x / (ratio.width / (2 as f64));
    let left_x = right_x - ratio.width * scale;
    let top_y = ratio.height / (2 as f64) * scale;
    let bottom_y = -top_y;

    if !(horizontal_slice.direction * horizontal_slice.position.signum() > (0 as f64)
        || horizontal_slice.position.abs() < top_y)
    {
        if vertical_slice.position.abs() < right_x {
            let m = (ratio.height / (2 as f64)) / ratio.width;
            let solution = ((1 as f64) / (m.powi(2) + (1 as f64))).powf(0.5);
            let scale = solution / ratio.width;
            let bottom_y = -ratio.height / (2 as f64) * scale;

            if vertical_slice.direction == 1 as f64 {
                Output {
                    bottom_left_corner: (0 as f64, bottom_y),
                    scale,
                }
            } else {
                Output {
                    bottom_left_corner: (-solution, bottom_y),
                    scale,
                }
            }
        } else {
            Output {
                bottom_left_corner: (left_x, bottom_y),
                scale,
            }
        }
    } else {
        let m = ratio.height / (0.5 as f64) / ratio.width;
        let y_0 = horizontal_slice.position;
        let a = m.powi(2) + (1 as f64);
        let b = (2 as f64) * y_0 * m - (2 as f64) * m.powi(2) * (0 as f64);
        let c = y_0.powi(2) - (2 as f64) * y_0 * m * (0 as f64) + m.powi(2) * (0 as f64).powi(2)
            - (1 as f64);
        let (middle, difference) = quadratic_root(a, b, c);
        let x_intersect = middle + difference;

        if vertical_slice.direction * vertical_slice.position.signum() > (0 as f64) {
            let m = ratio.height / ratio.width;
            let x_0 = vertical_slice.position;
            let final_x = circle_line_intersection(m, (x_0, y_0)).1;
            Output {
                bottom_left_corner: (x_0, y_0),
                scale: (final_x - x_0) / ratio.width,
            }
        } else if vertical_slice.position.abs() < x_intersect {
            let m = -ratio.height / ratio.width;
            let x_0 = vertical_slice.position;
            let final_x = circle_line_intersection(m, (x_0, y_0)).0;
            let scale = (x_0 - final_x) / ratio.width;
            Output {
                bottom_left_corner: (final_x, y_0),
                scale,
            }
        } else {
            Output {
                bottom_left_corner: (0 as f64, y_0),
                scale: x_intersect / (ratio.width / (2 as f64)),
            }
        }
    }
}

pub fn rect_in_sliced_circle(
    ratio: Ratio,
    vertical_slice: Slice,
    horizontal_slice: Slice,
    position: (f64, f64),
    radius: f64,
) -> Output {
    let vertical_slice = Slice {
        position: (vertical_slice.position - position.0) / radius,
        direction: vertical_slice.direction,
    };
    let horizontal_slice = Slice {
        position: (horizontal_slice.position - position.1) / radius,
        direction: horizontal_slice.direction,
    };
    let output = rect_in_sliced_unit_circle(ratio, vertical_slice, horizontal_slice);
    Output {
        bottom_left_corner: (
            output.bottom_left_corner.0 * radius + position.0,
            output.bottom_left_corner.1 * radius + position.1,
        ),
        scale: output.scale * radius,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn top_center_unrestricted() {
        // https://www.desmos.com/calculator/o2rt0jzjfh
        let result = rect_in_sliced_unit_circle(
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
        let result = rect_in_sliced_unit_circle(
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
        let result = rect_in_sliced_unit_circle(
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
        let result = rect_in_sliced_unit_circle(
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
                bottom_left_corner: (-0.8715755371245493, -0.49026123963255896),
                scale: 0.10894694214056866
            }
        );
    }

    #[test]
    fn restricted_by_circle() {
        // https://www.desmos.com/calculator/8ywmkofj22
        let result = rect_in_sliced_unit_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 1 as f64,
                direction: -1 as f64,
            },
            Slice {
                position: 0.5 as f64,
                direction: -1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (-0.8715755371245493, -0.49026123963255896),
                scale: 0.10894694214056866
            }
        );
    }

    #[test]
    fn right_side() {
        // https://www.desmos.com/calculator/yzkkhxpte6
        let result = rect_in_sliced_unit_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 0 as f64,
                direction: 1 as f64,
            },
            Slice {
                position: -0.6 as f64,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (0.0, -0.2707455769182841),
                scale: 0.060165683759618685
            }
        );
    }

    #[test]
    fn right_side_higher() {
        // https://www.desmos.com/calculator/uhk23e0n7e
        let result = rect_in_sliced_unit_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 0 as f64,
                direction: 1 as f64,
            },
            Slice {
                position: -0.2 as f64,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (0.0, -0.2),
                scale: 0.05898072429316711
            }
        );
    }

    #[test]
    fn left_side() {
        // https://www.desmos.com/calculator/hwgkjqeajd
        let result = rect_in_sliced_unit_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 0 as f64,
                direction: -1 as f64,
            },
            Slice {
                position: -0.6 as f64,
                direction: 1 as f64,
            },
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (-0.962650940153899, -0.2707455769182841),
                scale: 0.060165683759618685
            }
        );
    }

    #[test]
    fn scale_of_10() {
        let result = rect_in_sliced_circle(
            Ratio {
                width: 16 as f64,
                height: 9 as f64,
            },
            Slice {
                position: 10 as f64,
                direction: -1 as f64,
            },
            Slice {
                position: 5 as f64,
                direction: -1 as f64,
            },
            (0.0, 0.0),
            10.0,
        );
        assert_eq!(
            result,
            Output {
                bottom_left_corner: (-0.8715755371245493 * 10.0, -0.49026123963255896 * 10.0),
                scale: 0.10894694214056866 * 10.0
            }
        );
    }
}
