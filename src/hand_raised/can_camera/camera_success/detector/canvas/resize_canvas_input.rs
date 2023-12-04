use wasm_react::hooks::JsRefContainer;
use web_sys::{HtmlCanvasElement, HtmlDivElement, HtmlVideoElement};

#[derive(Clone)]
pub struct ResizeCanvasInput {
    pub video_ref: JsRefContainer<HtmlVideoElement>,
    pub canvas_ref: JsRefContainer<HtmlCanvasElement>,
    pub container_ref: JsRefContainer<HtmlDivElement>,
}
