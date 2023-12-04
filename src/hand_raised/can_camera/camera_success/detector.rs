use wasm_bindgen::JsValue;
use wasm_react::{hooks::Deps, Component, VNode};
use wasm_tensorflow_models_pose_detection::{
    create_detector,
    model::{
        BlazePoseMediaPipeModelConfig, BlazePoseModelConfig, BlazePoseModelType, Model, Runtime,
    },
};
use wasm_tensorflow_tfjs_core::{set_backend, BackendName};
use web_sys::console::error_1;

use crate::use_future::{use_future, FutureState};

use self::canvas::Canvas;
mod canvas;

pub struct Detector;

impl Component for Detector {
    fn render(&self) -> VNode {
        let detector = use_future(
            move || async move {
                set_backend(BackendName::Webgl).await?;
                let detector = create_detector(Model::BlazePose(Some(BlazePoseModelConfig {
                    runtime: Runtime::Mediapipe(BlazePoseMediaPipeModelConfig {
                        solution_path: Some("./_node_modules/@mediapipe/pose".into()),
                    }),
                    enable_smoothing: Some(true),
                    model_type: Some(BlazePoseModelType::Lite),
                    enable_segmentation: None,
                    smooth_segmentation: None,
                })))
                .await?;
                Ok::<_, JsValue>(detector)
            },
            Deps::none(),
        );

        let v_node = match detector.value().clone() {
            FutureState::NotStarted => "Will set up detector".into(),
            FutureState::Pending => "Setting up detector".into(),
            FutureState::Done(result) => match result {
                Ok(detector) => Canvas { detector }.build(),
                Err(e) => {
                    error_1(&e);
                    "Error setting up detector".into()
                }
            },
        };
        v_node
    }
}
