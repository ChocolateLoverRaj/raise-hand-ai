use wasm_react::{h, hooks::use_state, props::Style, Callback, Component, VNode};

pub struct HandRaised;

impl Component for HandRaised {
    fn render(&self) -> VNode {
        h!(h1).build("TODO")
    }
}
