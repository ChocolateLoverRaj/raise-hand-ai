use std::f64::consts::PI;

use average::Mean;
use coloriz::{Gradient, RGB};
use js_sys::Array;
use wasm_bindgen::JsValue;
use wasm_tensorflow_models_pose_detection::{model::Model, pose::Pose, util::get_adjacent_pairs};
use web_sys::CanvasRenderingContext2d;

fn rgb_to_js_value(rgb: &RGB) -> JsValue {
    format!("rgb({}, {}, {})", rgb.r, rgb.g, rgb.b).into()
}

pub fn draw_poses(
    ctx: &CanvasRenderingContext2d,
    min_pose_score: f64,
    min_point_score: f64,
    poses: &Vec<Pose>,
    model: &Model,
) {
    let worst_score_color = RGB::new(255, 0, 0);
    let best_score_color = RGB::new(0, 255, 0);
    let gradient = Gradient::new(worst_score_color, best_score_color);

    for pose in poses {
        if pose.score.map_or(true, |score| score >= min_pose_score) {
            for point in &pose.keypoints {
                if point.score.map_or(true, |score| score >= min_point_score) {
                    ctx.set_fill_style(&rgb_to_js_value(
                        &gradient.at(point.score.as_ref().unwrap().clone() as f32),
                    ));
                    ctx.begin_path();
                    ctx.arc(point.x, point.y, 5 as f64, 0 as f64, (2 as f64) * PI)
                        .unwrap();
                    ctx.fill();
                }
            }

            for (a, b) in get_adjacent_pairs(model.clone()) {
                let point_a = &pose.keypoints[a as usize];
                let point_b = &pose.keypoints[b as usize];
                if point_a.score.map_or(true, |score| score > min_point_score)
                    && point_b.score.map_or(true, |score| score > min_point_score)
                {
                    ctx.set_line_dash(&Array::new()).unwrap();
                    ctx.set_line_width(2 as f64);
                    let score_for_color = vec![
                        point_a.score.unwrap_or(1 as f64),
                        point_b.score.unwrap_or(1 as f64),
                    ]
                    .into_iter()
                    .collect::<Mean>()
                    .mean();

                    ctx.set_stroke_style(&rgb_to_js_value(&gradient.at(score_for_color as f32)));
                    ctx.begin_path();
                    ctx.move_to(point_a.x, point_a.y);
                    ctx.line_to(point_b.x, point_b.y);
                    ctx.stroke();
                }
            }
        }
    }
}
