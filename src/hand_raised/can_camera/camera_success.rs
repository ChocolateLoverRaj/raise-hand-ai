use std::rc::Rc;

use wasm_react::{h, props::Style, Component, VNode};
use wasm_tensorflow_models_pose_detection::model::Model;

use crate::{get_set::GetSet, hand_raised::camera_data::CameraData};

use self::{choose_camera::ChooseCamera, choose_model::ChooseModel, detector::Detector};

use super::use_detector::DetectorData;
mod choose_camera;
mod choose_model;
mod detector;

pub struct CameraSuccess<G0: GetSet<Option<String>>, G1: GetSet<Model>> {
    pub camera_data: Rc<CameraData<G0>>,
    pub detector: Rc<DetectorData<G1>>,
}

impl<G0: GetSet<Option<String>> + 'static, G1: GetSet<Model> + 'static> Component
    for CameraSuccess<G0, G1>
{
    fn render(&self) -> VNode {
        h!(div)
            .style(
                &Style::new()
                    .display("flex")
                    .flex_direction("column")
                    .height("100%"),
            )
            .build((
                h!(div).build((
                    ChooseCamera {
                        camera_data: self.camera_data.clone(),
                    }
                    .build(),
                    ChooseModel {
                        detector: self.detector.clone(),
                    }
                    .build(),
                )),
                Detector {
                    detector: self.detector.clone(),
                    camera_data: self.camera_data.clone(),
                }
                .build(),
            ))
    }
}
