use crate::{
    device_id_context::DEVICE_ID_CONTEXT,
    media_device_info::MediaDeviceInfo,
    use_future::{use_future, FutureState},
};
use js_sys::{Array, Reflect};
use std::ops::Deref;
use wasm_bindgen_futures::JsFuture;
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
        let devices_promise = use_future(
            move || async move {
                let devices = JsFuture::from(
                    window()
                        .unwrap()
                        .navigator()
                        .media_devices()
                        .unwrap()
                        .enumerate_devices()
                        .unwrap(),
                )
                .await;
                match devices {
                    Ok(devices) => Ok(Array::try_from(devices)
                        .unwrap()
                        .to_vec()
                        .into_iter()
                        .map(|device| MediaDeviceInfo::from(device))
                        .collect::<Vec<_>>()),
                    Err(e) => Err(e),
                }
            },
            Deps::none(),
        );
        let context = use_context(&DEVICE_ID_CONTEXT);
        let device_id = match context.as_ref() {
            Some(video_promise_and_id) => video_promise_and_id.video_promise.clone(),
            None => None,
        };

        let v_node = match devices_promise.value().deref() {
            FutureState::NotStarted => "Will get list of cameras".into(),
            FutureState::Pending => h!(select)
                .value("only")
                .disabled(true)
                .build(h!(option).value("only").build("Getting list of cameras")),
            FutureState::Done(result) => match result {
                Ok(devices) => h!(select)
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
                            .to_owned()
                            .into_iter()
                            .filter(|device| device.kind == "videoinput")
                            .map(|device| {
                                h!(option)
                                    .key(Some(device.device_id.to_owned()))
                                    .value(device.device_id.to_owned())
                                    .build(device.label.to_owned())
                            })
                            .collect::<VNode>(),
                    ),
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
