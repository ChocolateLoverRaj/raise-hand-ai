use crate::{
    hand_raised::can_camera::camera_success::CameraSuccess,
    use_future::FutureState,
    use_local_storage_state::{use_local_storage_state, LocalStorageState},
};
use wasm_react::{create_context, Component, Context, ContextProvider, VNode};

use self::use_detector::{use_detector, DETECTOR_CONTEXT};

use super::{camera_context::CameraContext, use_camera::use_camera};
mod camera_success;
mod use_detector;

pub struct CanCamera {}

thread_local! {
    pub static CAMERA_CONTEXT: Context<Option<CameraContext<LocalStorageState<'static, Option<String>>>>> = create_context(None.into());
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let detector = use_detector();
        let camera_context = use_camera(use_local_storage_state("device_id", || None));
        let v_node = match &camera_context.video_promise {
            FutureState::NotStarted => "Will get camera".into(),
            FutureState::Pending => "Getting camera".into(),
            FutureState::Done(_result) => CameraSuccess::new().build(),
        };
        ContextProvider::from(&DETECTOR_CONTEXT)
            .value(Some(detector.into()))
            .build(
                ContextProvider::from(&CAMERA_CONTEXT)
                    .value(Some(Some(camera_context).into()))
                    .build(v_node),
            )
    }
}
