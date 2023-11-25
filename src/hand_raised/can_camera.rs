use js_sys::{Object, Reflect};
use std::{future::Future, thread};
use wasm_bindgen::{closure::Closure, convert::IntoWasmAbi, JsValue};
use wasm_bindgen_futures::{self, JsFuture};
use wasm_react::{
    clones, h,
    hooks::{use_effect, use_ref, use_state, Deps},
    Component, VNode,
};
use web_sys::{console::log_1, window, MediaStreamConstraints};

pub struct CanCamera {
    closure_resolved: Closure<dyn FnMut(JsValue)>,
    closure_rejected: Closure<dyn FnMut(JsValue)>,
}

impl CanCamera {
    pub fn new() -> CanCamera {
        CanCamera {
            closure_resolved: Closure::new(|v| {
                log_1(&"resolved".into());
            }),
            closure_rejected: Closure::new(|v| {
                log_1(&"rejected".into());
            }),
        }
    }
}

struct Magic {
    closure_resolved: Closure<dyn FnMut(JsValue)>,
    closure_rejected: Closure<dyn FnMut(JsValue)>,
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let resolved = use_state(|| false);
        let magic_ref = use_ref({
            let mut resolved_0 = resolved.clone();
            let mut resolved_1 = resolved.clone();
            Magic {
                closure_resolved: Closure::new(move |v| {
                    resolved_0.set(|mut _resolved| true);
                    log_1(&"resolved".into());
                    log_1(&v);
                }),
                closure_rejected: Closure::new(move |v| {
                    resolved_1.set(|mut _resolved| true);
                    log_1(&"rejected".into());
                }),
            }
        });
        use_effect(
            {
                log_1(&"effect".into());
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
                move || || ()
            },
            Deps::none(),
        );
        let resolved = resolved.value().to_owned();
        if resolved {
            log_1(&"rendering after promise resolved".into());
        }
        h!(h1).build(match resolved {
            true => "Got",
            false => "Getting camera",
        })
    }
}
