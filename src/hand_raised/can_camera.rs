use js_sys::{Object, Reflect};
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::{spawn_local, JsFuture};
use wasm_react::{
    clones, h,
    hooks::{use_effect, use_state, Deps},
    Component, VNode,
};
use web_sys::{console::log_1, window, MediaStreamConstraints};

pub struct CanCamera {}

impl CanCamera {
    pub fn new() -> CanCamera {
        CanCamera {}
    }
}

pub enum PromiseState {
    NotStarted,
    Pending,
    Done(Result<JsValue, JsValue>),
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let resolved = use_state(|| PromiseState::NotStarted);
        {
            clones!(mut resolved);
            use_effect(
                move || {
                    spawn_local(async move {
                        resolved.set(|mut _resolved| PromiseState::Pending);
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
                        let result = JsFuture::from(js_promise).await;
                        match result {
                            Ok(ref v) => log_1(&v),
                            Err(ref v) => log_1(&v),
                        }
                        resolved.set(|_resolved| PromiseState::Done(result));
                    });
                },
                Deps::none(),
            );
        }
        let text = match *resolved.value() {
            PromiseState::NotStarted => "Will get camera",
            PromiseState::Pending => "Getting camera",
            PromiseState::Done(_) => "Got",
        };
        h!(h1).build(text)
    }
}
