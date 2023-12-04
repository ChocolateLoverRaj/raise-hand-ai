use wasm_react::{h, props::Style, Component, VNode};

use self::{choose_camera::ChooseCamera, detector::Detector};
mod choose_camera;
mod detector;

pub struct CameraSuccess;

impl CameraSuccess {
    pub fn new() -> CameraSuccess {
        CameraSuccess {}
    }
}

impl Component for CameraSuccess {
    fn render(&self) -> VNode {
        h!(div)
            .style(
                &Style::new()
                    .display("flex")
                    .flex_direction("column")
                    .height("100%"),
            )
            .build((ChooseCamera::new().build(), Detector {}.build()))
    }
}
