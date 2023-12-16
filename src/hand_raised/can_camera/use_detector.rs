use wasm_bindgen::JsValue;
use wasm_react::hooks::Deps;
use wasm_tensorflow_models_pose_detection::{
    create_detector,
    model::{
        BlazePoseMediaPipeModelConfig, BlazePoseModelConfig, BlazePoseModelType, Model,
        ModelWithConfig, MoveNetModelConfig, Runtime,
    },
    pose_detector::PoseDetector,
};
use wasm_tensorflow_tfjs_core::{set_backend, BackendName};

use crate::{
    get_set::GetSet,
    use_future::FutureState,
    use_future2::{use_future2, CreateFutureOutput},
};

pub struct DetectorData<M: GetSet<Model>> {
    pub create_detector: FutureState<Result<PoseDetector, JsValue>>,
    pub model: M,
}

pub static DEFAULT_MODEL: &Model = &Model::MoveNet;

pub fn use_detector<M: GetSet<Model> + Clone + 'static>(model: M) -> DetectorData<M> {
    let future = use_future2(
        {
            let model = model.clone();
            move || CreateFutureOutput {
                future: async move {
                    set_backend(BackendName::Webgl).await?;
                    let detector = create_detector(match model.get().clone() {
                        Model::MoveNet => ModelWithConfig::MoveNet(Some(MoveNetModelConfig {
                            enable_smoothing: Some(true),
                            enable_tracking: Some(true),
                            min_pose_score: None,
                            model_type: None,
                            model_url: None,
                            multi_pose_max_dimension: None,
                            tracker_config: None,
                            tracker_type: None,
                        })),
                        Model::BlazePose => {
                            ModelWithConfig::BlazePose(Some(BlazePoseModelConfig {
                                enable_segmentation: None,
                                enable_smoothing: Some(true),
                                model_type: Some(BlazePoseModelType::Lite),
                                runtime: Runtime::Mediapipe(BlazePoseMediaPipeModelConfig {
                                    solution_path: Some("_node_modules/@mediapipe/pose".into()),
                                }),
                                smooth_segmentation: None,
                            }))
                        }
                        Model::PoseNet => panic!("PoseNet node implemented yet"),
                    })
                    .await?;
                    Ok::<_, JsValue>(detector)
                },
                destructor: (),
            }
        },
        Deps::some(model.get().clone()),
    );
    let value = future.value();
    DetectorData {
        create_detector: (*value).clone(),
        model,
    }
}
