use aspect_fit::{aspect_fit::aspect_fit, size::Size};
use js_sys::{Array, Reflect};
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use wasm_tensorflow_models_pose_detection::pose_detector::{
    CommonEstimationConfig, EstimationConfig, PoseDetector,
};
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement, HtmlDivElement, HtmlVideoElement};

use crate::draw_poses::draw_poses;

struct Config {
    pub show_threshold_line: bool,
    pub show_key_points: bool,
    pub show_reach_circle: bool,
    pub show_reach_box: bool,
    pub show_wrist_point: bool,
    pub show_pointer_on_screen: bool,
}

static CONFIG: Config = Config {
    show_threshold_line: false,
    show_key_points: true,
    show_reach_box: false,
    show_reach_circle: false,
    show_wrist_point: false,
    show_pointer_on_screen: true,
};

pub async fn detector_frame(
    video: &HtmlVideoElement,
    canvas: &HtmlCanvasElement,
    container: &HtmlDivElement,
    pointer_canvas: &HtmlCanvasElement,
    detector: &PoseDetector,
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
    // let poses = JsFuture::from(estimate_poses()).await.unwrap();
    let poses = detector
        .estimate_poses(
            &video.dyn_ref().unwrap(),
            EstimationConfig::BlazePoseOrMoveNet(CommonEstimationConfig {
                flip_horizontal: Some(true),
                max_poses: None,
            }),
            None,
        )
        .await
        .unwrap();

    // log_1(&format!("{:#?}", poses).into());

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
        draw_poses(&ctx, 0.5, &poses);
    }
}
