use hand_raised::HandRaised;
use wasm_bindgen::JsValue;
use wasm_react::{export_components, import_components, Component, VNode};
mod hand_raised;
use wasm_bindgen::prelude::*;
mod draw_poses;
mod flip_horizontal;
mod get_set;
mod media_device_info;
mod quadratic_root;
mod rect_in_sliced_circle;
mod side_maps;
mod use_future;
mod use_future2;
mod use_local_storage_state;
mod use_resize_observer;

import_components! {
    #[wasm_bindgen(module = "react-head")]
    HeadProvider, Title
}
pub struct App;

impl Component for App {
    fn render(&self) -> VNode {
        HeadProvider::new().build((HandRaised {}.build(), Title::new().build("Hand Raised AI")))
    }
}

impl TryFrom<JsValue> for App {
    type Error = JsValue;

    fn try_from(_: JsValue) -> Result<Self, Self::Error> {
        console_error_panic_hook::set_once();
        Ok(App)
    }
}

export_components! { App }
