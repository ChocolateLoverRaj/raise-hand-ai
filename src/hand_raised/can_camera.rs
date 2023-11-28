use js_sys::{Object, Reflect};
use wasm_bindgen::{closure::Closure, JsValue};
use wasm_react::{
    clones, h,
    hooks::{use_effect, use_ref, use_state, Deps},
    Component, VNode,
};
use web_sys::{console::log_1, window, MediaStreamConstraints};

pub struct CanCamera {}

impl CanCamera {
    pub fn new() -> CanCamera {
        CanCamera {}
    }
}

struct Magic {
    closure_resolved: Closure<dyn FnMut(JsValue)>,
    closure_rejected: Closure<dyn FnMut(JsValue)>,
}

pub enum PromiseState {
    NotStarted,
    Pending,
    Done(Result<JsValue, JsValue>),
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let resolved = use_state(|| PromiseState::NotStarted);
        let magic_ref = use_ref({
            let mut resolved_0 = resolved.clone();
            let mut resolved_1 = resolved.clone();
            Magic {
                closure_resolved: Closure::new(move |v| {
                    log_1(&v);
                    resolved_0.set(|mut _resolved| PromiseState::Done(Ok(v)));
                }),
                closure_rejected: Closure::new(move |v| {
                    resolved_1.set(|mut _resolved| PromiseState::Done(Err(v)));
                }),
            }
        });
        {
            clones!(mut resolved);
            use_effect(
                move || {
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
                    drop(js_promise.then2(
                        &magic_ref.current().closure_resolved,
                        &magic_ref.current().closure_rejected,
                    ));
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
