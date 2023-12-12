use self::canvas::Canvas;
use crate::use_future::{use_future, FutureState};
use wasm_bindgen::JsValue;
use wasm_react::{hooks::Deps, Component, VNode};
use wasm_tensorflow_models_pose_detection::{
    create_detector,
    model::{ModelWithConfig, MoveNetModelConfig},
};
use wasm_tensorflow_tfjs_core::{set_backend, BackendName};
use web_sys::console::error_1;

mod canvas;

pub struct Detector;

impl Component for Detector {
    fn render(&self) -> VNode {
        let detector = use_future(
            move || async move {
                set_backend(BackendName::Webgl).await?;
                let detector =
                    create_detector(ModelWithConfig::MoveNet(Some(MoveNetModelConfig {
                        enable_smoothing: Some(true),
                        enable_tracking: Some(true),
                        min_pose_score: None,
                        model_type: None,
                        model_url: None,
                        multi_pose_max_dimension: None,
                        tracker_config: None,
                        tracker_type: None,
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
