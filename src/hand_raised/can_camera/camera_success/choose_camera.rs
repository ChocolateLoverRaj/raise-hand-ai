use crate::{
    get_set::GetSet,
    hand_raised::camera_data::CameraData,
    media_device_info::MediaDeviceInfo,
    use_future::{use_future, FutureState},
};
use js_sys::{Array, Reflect};
use std::{ops::Deref, rc::Rc};
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use wasm_react::{h, hooks::Deps, Callback, Component, VNode};
use web_sys::{window, Event, MediaStreamTrack};

pub struct ChooseCamera<G: GetSet<Option<String>>> {
    pub camera_data: Rc<CameraData<G>>,
}

impl<G: GetSet<Option<String>> + 'static> Component for ChooseCamera<G> {
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
        let media_stream = self
            .camera_data
            .video_promise
            .as_ref()
            .get_result()
            .map(|v| v.as_ref().ok())
            .flatten()
            .unwrap();

        let v_node = match devices_promise.value().deref() {
            FutureState::NotStarted => "Will get list of cameras".into(),
            FutureState::Pending => h!(select)
                .value("only")
                .disabled(true)
                .build(h!(option).value("only").build("Getting list of cameras")),
            FutureState::Done(result) => match result {
                Ok(devices) => h!(select)
                    .value({
                        let video_track: MediaStreamTrack =
                            media_stream.get_video_tracks().get(0).dyn_into().unwrap();
                        let settings = video_track.get_settings();
                        let device_id = Reflect::get(&settings, &"deviceId".into())
                            .unwrap()
                            .as_string()
                            .unwrap();
                        device_id
                    })
                    .on_change({
                        let mut device_id = self.camera_data.device_id.clone();
                        &Callback::<Event>::new({
                            move |event| {
                                device_id.set(Box::new(move |_| {
                                    let target = event.target().unwrap();
                                    let value = Reflect::get(&target, &"value".into()).unwrap();
                                    value.as_string()
                                }));
                            }
                        })
                    })
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
