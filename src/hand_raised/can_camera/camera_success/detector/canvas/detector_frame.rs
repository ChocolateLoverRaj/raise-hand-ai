use aspect_fit::{aspect_fit::aspect_fit, size::Size};
use js_sys::{Array, Reflect};
use real_float::Real;
use std::f64::consts::PI;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use wasm_tensorflow_models_pose_detection::{
    model::Model,
    pose_detector::{CommonEstimationConfig, EstimationConfig, PoseDetector},
};
use web_sys::{
    window, CanvasRenderingContext2d, HtmlCanvasElement, HtmlDivElement, HtmlVideoElement,
};

use crate::{
    draw_poses::draw_poses,
    flip_horizontal::flip_horizontal,
    rect_in_sliced_circle::{rect_in_sliced_circle, Ratio, Slice},
    side_maps::SIDE_MAPS,
};

struct Config {
    pub show_threshold_line: bool,
    pub show_key_points: bool,
    pub show_reach_circle: bool,
    pub show_reach_box: bool,
    pub show_pointer_on_screen: bool,
    pub threshold: f64,
}

static CONFIG: Config = Config {
    show_threshold_line: true,
    show_key_points: true,
    show_reach_box: true,
    show_reach_circle: true,
    show_pointer_on_screen: true,
    threshold: 0.75,
};

pub async fn detector_frame(
    video: &HtmlVideoElement,
    canvas: &HtmlCanvasElement,
    container: &HtmlDivElement,
    pointer_canvas: &HtmlCanvasElement,
    detector: &PoseDetector,
    model: &Model,
) {
    let ctx = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>()
        .unwrap();
    let pointer_ctx = pointer_canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>()
        .unwrap();
    let scale: f64 = aspect_fit(
        &Size {
            width: video.video_width(),
            height: video.video_height(),
        },
        &Size {
            width: container.offset_width() as u32,
            height: container.offset_height() as u32,
        },
    );
    ctx.reset_transform().unwrap();
    ctx.scale(scale, scale).unwrap();

    // VERY IMPORTANT: estimating poses before the video plays results in the error
    // RuntimeError: Aborted(native code called abort(). To avoid this error, just await video.play().
    JsFuture::from(video.play().unwrap()).await.unwrap();
    let poses = {
        let mut poses = detector
            .estimate_poses(
                &video.dyn_ref().unwrap(),
                EstimationConfig::BlazePoseOrMoveNet(CommonEstimationConfig {
                    flip_horizontal: Some(false),
                    max_poses: None,
                }),
                None,
            )
            .await
            .unwrap();
        flip_horizontal(&mut poses, video.video_width() as f64);
        poses
    };

    let transform_before = Reflect::apply(
        &Reflect::get(&ctx, &"getTransform".into())
            .unwrap()
            .dyn_into()
            .unwrap(),
        &ctx.clone().dyn_into().unwrap(),
        &Array::new(),
    )
    .unwrap();

    ctx.translate(f64::from(canvas.width()) / scale, 0 as f64)
        .unwrap();
    ctx.scale(-1 as f64, 1 as f64).unwrap();
    ctx.draw_image_with_html_video_element(video, 0 as f64, 0 as f64)
        .unwrap();

    Reflect::apply(
        &Reflect::get(&ctx, &"setTransform".into())
            .unwrap()
            .dyn_into()
            .unwrap(),
        &ctx.clone().dyn_into().unwrap(),
        &Array::from_iter(vec![&transform_before].iter()),
    )
    .unwrap();

    if CONFIG.show_key_points {
        draw_poses(&ctx, 0.3, 0.3, &poses, model);
    }

    if let Some(pose) = poses.get(0) {
        let (pointer_hand, pointer_wrist_y) = SIDE_MAPS
            .get(model)
            .unwrap()
            .into_iter()
            .map(|points| (points, pose.keypoints[points.wrist].y))
            .enumerate()
            .min_by_key(|(_side, (_points, y))| Real::new(*y))
            .map(|(side, (_side, y))| (side, y))
            .unwrap();
        // log_2(&pointer_hand.into(), &pointer_wrist_y.into());
        let threshold_y = SIDE_MAPS
            .get(model)
            .unwrap()
            .iter()
            .map(|points| {
                let shoulder_y = pose.keypoints[points.shoulder].y;
                let waist_y = pose.keypoints[points.waist].y;
                shoulder_y + (waist_y - shoulder_y) * CONFIG.threshold
            })
            .min_by_key(|y| Real::new(*y))
            .unwrap();
        if CONFIG.show_threshold_line {
            ctx.begin_path();
            ctx.move_to(0 as f64, threshold_y);
            ctx.line_to(video.video_width().into(), threshold_y);
            ctx.set_line_width(3 as f64);
            ctx.set_stroke_style(&"mediumseagreen".into());
            ctx.stroke();
        }

        let pointer_hand = {
            if Real::new(pointer_wrist_y) > Real::new(threshold_y) {
                None
            } else {
                Some(pointer_hand)
            }
        };
        let screen_width = window().unwrap().inner_width().unwrap().as_f64().unwrap() as u32;
        let screen_height = window().unwrap().inner_height().unwrap().as_f64().unwrap() as u32;
        pointer_canvas.set_width(screen_width as u32);
        pointer_canvas.set_height(screen_height);
        pointer_ctx.clear_rect(
            0 as f64,
            0 as f64,
            pointer_canvas.width().into(),
            pointer_canvas.height().into(),
        );
        if let Some(pointer_hand) = pointer_hand {
            let point_indexes = &SIDE_MAPS.get(model).unwrap()[pointer_hand];
            let shoulder = &pose.keypoints[point_indexes.shoulder];
            let elbow = &pose.keypoints[point_indexes.elbow];
            let wrist = &pose.keypoints[point_indexes.wrist];
            let aspect_ratio = Size {
                width: screen_width,
                height: screen_height,
            };

            let radius = (((elbow.x - shoulder.x) as f64).powi(2)
                + ((elbow.y - shoulder.y) as f64).powi(2))
            .powf(0.5)
                + (((wrist.x - elbow.x) as f64).powi(2) + ((wrist.y - elbow.y) as f64).powi(2))
                    .powf(0.5);
            let rect = rect_in_sliced_circle(
                Ratio {
                    width: aspect_ratio.width as f64,
                    height: aspect_ratio.height as f64,
                },
                Slice {
                    position: 0.0,
                    direction: match pointer_hand {
                        0 => 1 as f64,
                        1 => -1 as f64,
                        _ => panic!(),
                    },
                },
                Slice {
                    position: -(threshold_y - shoulder.y),
                    direction: 1 as f64,
                },
                (0.0, 0.0),
                radius,
            );

            if CONFIG.show_reach_circle {
                ctx.begin_path();
                ctx.arc(shoulder.x, shoulder.y, radius, 0 as f64, PI * (2 as f64))
                    .unwrap();
                ctx.set_stroke_style(&"purple".into());
                ctx.stroke();
            }

            if CONFIG.show_reach_box {
                ctx.begin_path();
                ctx.arc(wrist.x, wrist.y, 10 as f64, 0 as f64, PI * (2 as f64))
                    .unwrap();
                ctx.set_fill_style(&"red".into());
                ctx.fill();
            }

            let left_x = rect.bottom_left_corner.0 + shoulder.x;
            let right_x = left_x + (aspect_ratio.width as f64) * rect.scale;
            let bottom_y = -rect.bottom_left_corner.1 + shoulder.y;
            let top_y = bottom_y - (aspect_ratio.height as f64) * rect.scale;

            let (normalized_x, normalized_y) = {
                let mut x = wrist.x;
                let mut y = wrist.y;
                x = x.max(left_x);
                y = y.max(top_y);
                x = x.min(right_x);
                y = y.min(bottom_y);
                (x, y)
            };

            let box_width = (aspect_ratio.width as f64) * rect.scale;
            let box_height = (aspect_ratio.height as f64) * rect.scale;

            if CONFIG.show_reach_box {
                ctx.begin_path();
                ctx.arc(
                    normalized_x,
                    normalized_y,
                    10 as f64,
                    0 as f64,
                    PI * (2 as f64),
                )
                .unwrap();
                ctx.set_fill_style(&"pink".into());
                ctx.fill();

                ctx.set_stroke_style(&"blue".into());
                ctx.stroke_rect(left_x, top_y, box_width, box_height);
            }

            if CONFIG.show_pointer_on_screen {
                let x_on_screen = (normalized_x - left_x) / box_width;
                let y_on_screen = (normalized_y - top_y) / box_height;

                pointer_ctx.begin_path();
                let screen_diagonal = ((screen_width * screen_height) as f64).powf(0.5);
                pointer_ctx
                    .arc(
                        x_on_screen * (screen_width as f64),
                        y_on_screen * (screen_height as f64),
                        screen_diagonal * 0.05,
                        0 as f64,
                        PI * (2 as f64),
                    )
                    .unwrap();
                pointer_ctx.set_fill_style(&"dodgerblue".into());
                pointer_ctx.fill();
            }
        }
    }
}
