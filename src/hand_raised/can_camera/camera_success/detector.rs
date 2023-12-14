use self::canvas::Canvas;
use crate::{hand_raised::can_camera::use_detector::DETECTOR_CONTEXT, use_future::FutureState};
use wasm_react::{hooks::use_context, Component, VNode};
use web_sys::console::error_1;

mod canvas;

pub struct Detector;

impl Component for Detector {
    fn render(&self) -> VNode {
        let context = &use_context(&DETECTOR_CONTEXT);
        let detector = context.as_ref().as_ref().expect(
            "No detector context!. Place this component inside a detector context provider.",
        );

        let v_node = match detector.get().clone() {
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
