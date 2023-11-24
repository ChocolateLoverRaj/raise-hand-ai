use hand_raised::HandRaised;
use wasm_bindgen::JsValue;
use wasm_react::{export_components, import_components, Component, VNode};
mod hand_raised;
use wasm_bindgen::prelude::*;

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
        Ok(App)
    }
}

export_components! { App }
