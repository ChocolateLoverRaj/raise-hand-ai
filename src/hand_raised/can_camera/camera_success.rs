use wasm_react::{h, hooks::use_js_ref, props::Style, Component, VNode};
use web_sys::Element;

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
        let container_ref = use_js_ref::<Element>(None);
        h!(div)
            .style(
                &Style::new()
                    .display("flex")
                    .flex_direction("column")
                    .height("100%")
                    .overflow("hidden"),
            )
            .build((
                ChooseCamera::new().build(),
                h!(div)
                    .ref_container(&container_ref)
                    .style(&Style::new().flex_grow(1).height("100%"))
                    .build(Detector { container_ref }.build()),
            ))
    }
}
