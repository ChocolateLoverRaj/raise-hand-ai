use wasm_react::{Component, VNode};
mod camera_data;
mod can_camera;
mod use_camera;

pub struct HandRaised;

use web_sys::window;

use self::can_camera::CanCamera;

fn can_access_camera() -> bool {
    match window() {
        Some(window) => match window.navigator().media_devices() {
            Ok(_media_devices) => true,
            Err(_e) => false,
        },
        None => false,
    }
}

impl Component for HandRaised {
    fn render(&self) -> VNode {
        match can_access_camera() {
            true => CanCamera {}.build(),
            false => VNode::from("Your browser cannot give this page camera access"),
        }
    }
}
