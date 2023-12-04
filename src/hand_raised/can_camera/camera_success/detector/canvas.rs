use js_sys::Reflect;
use wasm_bindgen::JsCast;
use wasm_react::{
    create_element, h,
    hooks::{use_context, use_js_ref},
    props::{Props, Style},
    Component, VNode,
};
use wasm_tensorflow_models_pose_detection::pose_detector::PoseDetector;
use web_sys::{HtmlCanvasElement, HtmlDivElement, HtmlVideoElement, MediaStreamTrack};

use crate::{device_id_context::DEVICE_ID_CONTEXT, use_future::FutureState};

use self::{
    resize_canvas_input::ResizeCanvasInput,
    use_play_promise_and_auto_resize_canvas::use_play_promise_and_auto_resize_canvas,
};
mod resize_canvas;
mod resize_canvas_input;
mod use_play_promise_and_auto_resize_canvas;

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

pub struct Canvas {
    pub detector: PoseDetector,
}

impl Component for Canvas {
    fn render(&self) -> VNode {
        let container_ref = use_js_ref::<HtmlDivElement>(None);
        let video_ref = use_js_ref(None::<HtmlVideoElement>);
        let canvas_ref = use_js_ref(None::<HtmlCanvasElement>);
        let canvas_container_ref = use_js_ref(None::<HtmlDivElement>);
        let pointer_canvas_ref = use_js_ref(None::<HtmlCanvasElement>);

        let play_future_state = use_play_promise_and_auto_resize_canvas(ResizeCanvasInput {
            canvas_ref: canvas_ref.clone(),
            container_ref: canvas_container_ref.clone(),
            video_ref: video_ref.clone(),
        });

        let video_context = use_context(&DEVICE_ID_CONTEXT);
        let media_stream = video_context
            .as_ref()
            .as_ref()
            .unwrap()
            .video_promise
            .as_ref()
            .unwrap();

        create_element(
            &"div".into(),
            &Props::new()
                .key(Some("container"))
                .ref_container(&container_ref)
                .insert(
                    "style",
                    &Style::new()
                        .flex_grow(1)
                        .display("flex")
                        .flex_direction("column")
                        .overflow("hidden")
                        .into(),
                ),
            (
                create_element(
                    &"video".into(),
                    &Props::new()
                        .key(Some("video"))
                        .ref_container(&video_ref)
                        .insert("hidden", &true.into()),
                    ().into(),
                ),
                h!(span).build((
                    VNode::from("Video FPS: "),
                    h!(code).build(
                        Reflect::get(
                            &media_stream
                                .get_video_tracks()
                                .get(0)
                                .unchecked_into::<MediaStreamTrack>()
                                .get_settings(),
                            &"frameRate".into(),
                        )
                        .unwrap()
                        .as_f64()
                        .unwrap()
                        .to_string(),
                    ),
                )),
                create_element(
                    &"div".into(),
                    &Props::new()
                        .key(Some("div"))
                        .ref_container(&canvas_container_ref)
                        .insert(
                            "style",
                            &Style::new()
                                .position("relative")
                                .flex_grow(1)
                                .overflow("hidden")
                                .into(),
                        ),
                    create_element(
                        &"canvas".into(),
                        &Props::new()
                            .key(Some("canvas"))
                            .ref_container(&canvas_ref)
                            .insert("style", &Style::new().background_color("orange").into()),
                        ().into(),
                    ),
                ),
                match play_future_state {
                    FutureState::NotStarted => VNode::from("Will play video"),
                    FutureState::Pending => "Playing video".into(),
                    FutureState::Done(result) => match result {
                        Err(_) => "Error playing video".into(),
                        _ => ().into(),
                    },
                },
                create_element(
                    &"canvas".into(),
                    &Props::new().ref_container(&pointer_canvas_ref).insert(
                        "style",
                        &Style::new()
                            .position("fixed")
                            .width("100vw")
                            .height("100vh")
                            .left(0)
                            .top(0)
                            .into(),
                    ),
                    ().into(),
                ),
            )
                .into(),
        )
    }
}
