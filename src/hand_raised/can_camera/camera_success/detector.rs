use std::rc::Rc;

use self::canvas::Canvas;
use crate::{
    get_set::GetSet,
    hand_raised::{camera_data::CameraData, can_camera::use_detector::DetectorData},
    use_future::FutureState,
};
use wasm_react::{Component, VNode};
use wasm_tensorflow_models_pose_detection::model::Model;
use web_sys::console::error_1;

mod canvas;

pub struct Detector<G0: GetSet<Option<String>>, G1: GetSet<Model>> {
    pub camera_data: Rc<CameraData<G0>>,
    pub detector: Rc<DetectorData<G1>>,
}

impl<G0: GetSet<Option<String>> + 'static, G1: GetSet<Model> + 'static> Component
    for Detector<G0, G1>
{
    fn render(&self) -> VNode {
        let v_node = match self.detector.create_detector.as_ref() {
            FutureState::NotStarted => "Will set up detector".into(),
            FutureState::Pending => "Setting up detector".into(),
            FutureState::Done(result) => match result {
                Ok(_detector) => Canvas {
                    camera_data: self.camera_data.clone(),
                    detector: self.detector.clone(),
                }
                .build(),
                Err(e) => {
                    error_1(&e);
                    "Error setting up detector".into()
                }
            },
        };
        v_node
    }
}
