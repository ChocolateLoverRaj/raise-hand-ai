use crate::{
    device_id_context::DEVICE_ID_CONTEXT,
    use_promise::{use_promise, PromiseState},
};
use js_sys::Reflect;
use serde::{Deserialize, Serialize};
use std::ops::Deref;
use wasm_react::{
    clones, h,
    hooks::{use_context, Deps},
    Callback, Component, VNode,
};
use web_sys::{window, Event};

pub struct ChooseCamera;

impl ChooseCamera {
    pub fn new() -> ChooseCamera {
        ChooseCamera {}
    }
}

impl Component for ChooseCamera {
    fn render(&self) -> wasm_react::VNode {
        let devices_promise = use_promise(
            move || {
                window()
                    .unwrap()
                    .navigator()
                    .media_devices()
                    .unwrap()
                    .enumerate_devices()
                    .unwrap()
            },
            Deps::none(),
        );
        let context = use_context(&DEVICE_ID_CONTEXT);
        let device_id = match context.as_ref() {
            Some(video_promise_and_id) => video_promise_and_id.video_promise.clone(),
            None => None,
        };

        let v_node = match devices_promise.value().deref() {
            PromiseState::NotStarted => "Will get list of cameras".into(),
            PromiseState::Pending => h!(select)
                .value("only")
                .disabled(true)
                .build(h!(option).value("only").build("Getting list of cameras")),
            PromiseState::Done(result) => match result {
                Ok(devices) => {
                    #[derive(Serialize, Deserialize)]
                    #[serde(rename_all = "camelCase")]
                    struct MediaDeviceInfo {
                        device_id: String,
                        kind: String,
                        label: String,
                    }
                    let devices: Vec<MediaDeviceInfo> =
                        serde_wasm_bindgen::from_value(devices.clone()).unwrap();
                    h!(select)
                        .value(device_id)
                        .on_change(&Callback::<Event>::new({
                            move |event| {
                                if let Some(device_id) = context.as_ref() {
                                    let device_id = &device_id.device_id;
                                    clones!(mut device_id);
                                    device_id.set(|_| {
                                        let target = event.target().unwrap();
                                        let value = Reflect::get(&target, &"value".into()).unwrap();
                                        value.as_string()
                                    });
                                };
                            }
                        }))
                        .build(
                            devices
                                .iter()
                                .filter(|device| device.kind == "videoinput")
                                .map(|device| {
                                    h!(option)
                                        .key(Some(device.device_id.clone()))
                                        .value(device.device_id.clone())
                                        .build(device.label.clone())
                                })
                                .collect::<VNode>(),
                        )
                }
                Err(_e) => h!(select).value("only").disabled(true).build(
                    h!(option)
                        .value("only")
                        .build("Error getting list of cameras"),
                ),
            },
        };
        v_node
    }
}
