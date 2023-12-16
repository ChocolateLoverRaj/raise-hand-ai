use std::rc::Rc;

use crate::{
    hand_raised::can_camera::camera_success::CameraSuccess, use_future::FutureState,
    use_local_storage_state::use_local_storage_state,
};
use wasm_react::{Component, VNode};

use self::use_detector::{use_detector, DEFAULT_MODEL};

use super::use_camera::use_camera;
mod camera_success;
mod use_detector;

pub struct CanCamera {}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let detector = use_detector(use_local_storage_state("model", || DEFAULT_MODEL.clone()));
        let camera_data = use_camera(use_local_storage_state("device_id", || None));
        let v_node = match &camera_data.video_promise {
            FutureState::NotStarted => "Will get camera".into(),
            FutureState::Pending => "Getting camera".into(),
            FutureState::Done(_result) => CameraSuccess {
                camera_data: Rc::new(camera_data),
                detector: Rc::new(detector),
            }
            .build(),
        };
        v_node
    }
}
