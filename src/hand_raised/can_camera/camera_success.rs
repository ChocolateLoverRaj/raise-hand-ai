use wasm_react::{h, props::Style, Component, VNode};

use self::choose_camera::ChooseCamera;
mod choose_camera;

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
                    .height("100%")
                    .overflow("hidden"),
            )
            .build((
                ChooseCamera::new().build(),
                h!(div)
                    .style(&Style::new().flex_grow(1).height("100%"))
                    .build("detector"),
            ))
    }
}
