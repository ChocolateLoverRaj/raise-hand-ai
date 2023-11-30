use crate::{
    device_id_context::{VideoPromiseAndId, DEVICE_ID_CONTEXT},
    hand_raised::can_camera::camera_success::CameraSuccess,
    media_stream::MediaStream,
    use_future::{use_future, FutureState},
};

use js_sys::{Object, Reflect};
use wasm_bindgen_futures::JsFuture;
use wasm_react::{
    clones,
    hooks::{use_state, Deps},
    Component, ContextProvider, VNode,
};
use web_sys::{console::log_1, window, MediaStreamConstraints};
mod camera_success;

pub struct CanCamera {}

impl CanCamera {
    pub fn new() -> CanCamera {
        CanCamera {}
    }
}

impl Component for CanCamera {
    fn render(&self) -> VNode {
        let device_id = use_state(|| {
            let device_id: Option<String> = None;
            device_id
        });
        let device_id_clone = device_id.clone();
        let video_promise = use_future(
            move || async move {
                let video_object = Object::new();
                match device_id_clone.value().clone() {
                    Some(device_id) => {
                        log_1(&device_id[..].into());
                        Reflect::set(&video_object, &"deviceId".into(), &device_id.into()).unwrap();
                    }
                    None => {
                        Reflect::set(&video_object, &"facingMode".into(), &"user".into()).unwrap();
                    }
                }
                let js_promise = window()
                    .unwrap()
                    .navigator()
                    .media_devices()
                    .unwrap()
                    .get_user_media_with_constraints(
                        &MediaStreamConstraints::new().video(&video_object),
                    )
                    .unwrap();
                let result: Result<wasm_bindgen::prelude::JsValue, wasm_bindgen::prelude::JsValue> =
                    JsFuture::from(js_promise).await;
                match result {
                    Ok(media_stream) => {
                        let media_stream = MediaStream::from(media_stream);
                        Ok(media_stream.get_video_tracks()[0].get_settings().device_id)
                    }
                    Err(e) => Err(e),
                }
            },
            Deps::some(device_id.value().clone()),
        );
        let v_node = match video_promise.value().clone() {
            FutureState::NotStarted => "Will get camera".into(),
            FutureState::Pending => "Getting camera".into(),
            FutureState::Done(result) => {
                clones!(mut device_id);
                ContextProvider::from(&DEVICE_ID_CONTEXT)
                    .value(Some(
                        Some(VideoPromiseAndId {
                            video_promise: match result {
                                Ok(device_id) => Some(device_id.to_owned()),
                                Err(_e) => None,
                            },
                            device_id,
                        })
                        .into(),
                    ))
                    .build(CameraSuccess::new().build())
            }
        };
        v_node
    }
}
