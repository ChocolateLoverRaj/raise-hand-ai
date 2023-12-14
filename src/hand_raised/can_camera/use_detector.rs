use wasm_bindgen::JsValue;
use wasm_react::{create_context, hooks::Deps, Context};
use wasm_tensorflow_models_pose_detection::{
    create_detector,
    model::{ModelWithConfig, MoveNetModelConfig},
    pose_detector::PoseDetector,
};
use wasm_tensorflow_tfjs_core::{set_backend, BackendName};

use crate::{
    get_set::GetSet,
    use_future::FutureState,
    use_future2::{use_future2, CreateFutureOutput},
};

pub type DetectorContext = Option<Box<dyn GetSet<FutureState<Result<PoseDetector, JsValue>>>>>;

thread_local! {
    pub static DETECTOR_CONTEXT: Context<DetectorContext> = create_context(None.into());
}

pub fn use_detector() -> DetectorContext {
    Some(Box::new(use_future2(
        move || CreateFutureOutput {
            future: async {
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
            destructor: (),
        },
        Deps::none(),
    )))
}
