use self::use_promise::{use_promise, PromiseState};
use js_sys::{Object, Reflect};
use wasm_react::{h, hooks::Deps, Component, VNode};
use web_sys::{window, MediaStreamConstraints};
mod use_promise;

pub struct CanCamera {}

impl CanCamera {
    pub fn new() -> CanCamera {
        CanCamera {}
    }
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let promise = use_promise(
            move || {
                let video_object = Object::new();
                Reflect::set(&video_object, &"facingMode".into(), &"user".into()).unwrap();
                let js_promise = window()
                    .unwrap()
                    .navigator()
                    .media_devices()
                    .unwrap()
                    .get_user_media_with_constraints(
                        &MediaStreamConstraints::new().video(&video_object),
                    )
                    .unwrap();
                js_promise
            },
            Deps::none(),
        );
        let text = match *promise.value() {
            PromiseState::NotStarted => "Will get camera",
            PromiseState::Pending => "Getting camera",
            PromiseState::Done(_) => "Got",
        };
        h!(h1).build(text)
    }
}
