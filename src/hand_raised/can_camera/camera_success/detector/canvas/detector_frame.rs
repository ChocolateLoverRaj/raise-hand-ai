use aspect_fit::{aspect_fit::aspect_fit, size::Size};
use js_sys::{Array, Promise, Reflect};
use wasm_bindgen::prelude::*;
use wasm_bindgen::{convert::OptionIntoWasmAbi, JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;
use wasm_tensorflow_models_pose_detection::pose_detector::PoseDetector;
use web_sys::{
    console::{error_2, log_1, log_2, log_3},
    CanvasRenderingContext2d, HtmlCanvasElement, HtmlDivElement, HtmlVideoElement,
};

#[wasm_bindgen(module = "/js/main.js")]
extern "C" {
    #[wasm_bindgen(js_name = createDetector)]
    fn create_detector() -> Promise;
    #[wasm_bindgen(js_name = estimatePoses)]
    fn estimate_poses(detector: &JsValue, video: &JsValue) -> Promise;

}

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

    // let js: JsValue = detector.into();
    // let estimate_poses = Reflect::get(&js, &"estimatePoses".into()).unwrap();
    // let r = Reflect::apply(
    //     &estimate_poses.dyn_into().unwrap(),
    //     &js,
    //     &Array::from_iter(vec![video].iter()),
    // )
    // .unwrap();
    // let poses = detector.estimate_poses(&video.into(), None).await.unwrap();
    let detector = JsFuture::from(create_detector()).await.unwrap();
    let poses = JsFuture::from(estimate_poses(&detector, &video.into()))
        .await
        .unwrap();
    log_3(
        &detector.into(),
        &JsValue::undefined(),
        &Array::from_iter(vec![video].iter()),
    );

    // panic!()
    log_2(&"frame".into(), &poses.into());

    let transform_before = Reflect::apply(
        &Reflect::get(&ctx, &"getTransform".into())
            .unwrap()
            .dyn_into()
            .unwrap(),
        &ctx.clone().dyn_into().unwrap(),
        &Array::new(),
    )
    .unwrap();

    ctx.translate((canvas.width() as f64) / scale, 0 as f64)
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
}
