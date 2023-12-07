use js_sys::Reflect;
use wasm_bindgen::{closure::Closure, JsCast};
use wasm_bindgen_futures::spawn_local;
use wasm_react::{
    create_element, h,
    hooks::{use_context, use_effect, use_js_ref, Deps},
    props::{Props, Style},
    Component, VNode,
};
use wasm_repeated_animation_frame::RafLoop;
use wasm_tensorflow_models_pose_detection::pose_detector::PoseDetector;
use web_sys::{
    console::{log_1, log_2},
    window, CanvasRenderingContext2d, HtmlCanvasElement, HtmlDivElement, HtmlVideoElement,
    MediaStream, MediaStreamTrack,
};

use crate::{device_id_context::DEVICE_ID_CONTEXT, use_future::FutureState};

use self::{
    detector_frame::detector_frame, resize_canvas_input::ResizeCanvasInput,
    use_play_promise_and_auto_resize_canvas::use_play_promise_and_auto_resize_canvas,
};
mod detector_frame;
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

        let media_stream_promise = &video_context.as_ref().as_ref().unwrap().video_promise;
        let media_stream = media_stream_promise.as_ref().unwrap();

        use_effect(
            {
                let video_context = video_context.clone();
                let video_ref = video_ref.clone();
                let canvas_ref = canvas_ref.clone();
                let container_ref = container_ref.clone();
                let pointer_canvas_ref = pointer_canvas_ref.clone();
                let detector = self.detector.clone();

                move || {
                    let video = video_ref.current().unwrap();
                    let canvas = canvas_ref.current().unwrap();
                    let container = container_ref.current().unwrap();
                    let pointer_canvas = pointer_canvas_ref.current().unwrap();

                    let (mut raf_loop, canceler) = RafLoop::new();
                    spawn_local(async move {
                        // let mut fps_counter = FPSCounter::new();
                        loop {
                            if !raf_loop.next().await {
                                log_1(&"break loop".into());
                                break;
                            };
                            detector_frame(&video, &canvas, &container, &pointer_canvas, &detector)
                                .await;
                            // if !raf_loop.next().await {
                            //     log_1(&"break loop".into());
                            //     break;
                            // };
                            // fps.set(|_| fps_counter.tick());
                        }
                    });
                    move || {
                        spawn_local(async move {
                            canceler.cancel().await;
                            log_1(&"stopped raf loop".into());
                        });
                        log_1(&"stop raf loop".into());
                    }
                }
            },
            Deps::none(),
        );

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
                            .pointer_events("none")
                            .into(),
                    ),
                    ().into(),
                ),
            )
                .into(),
        )
    }
}
