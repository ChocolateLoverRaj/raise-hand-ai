use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{spawn_local, JsFuture};
use wasm_react::hooks::Deps;
use web_sys::{
    window, MediaStream, MediaStreamConstraints, MediaStreamTrack, MediaTrackConstraints,
};

use crate::{
    get_set::GetSet,
    use_future2::{use_future2, CreateFutureOutput},
};

use super::camera_data::CameraData;

pub fn use_camera<G>(device_id: G) -> CameraData<G>
where
    G: GetSet<Option<String>> + Clone + 'static,
{
    let device_id_clone = device_id.clone();
    let video_promise = use_future2(
        move || {
            let (s, r) = async_channel::unbounded::<MediaStream>();
            CreateFutureOutput {
                future: async move {
                    let js_promise = window()
                        .unwrap()
                        .navigator()
                        .media_devices()
                        .unwrap()
                        .get_user_media_with_constraints(
                            &MediaStreamConstraints::new().video(
                                match device_id_clone.get().as_ref() {
                                    Some(device_id) => {
                                        let mut c = MediaTrackConstraints::new();
                                        c.device_id(&device_id.into());
                                        c
                                    }
                                    None => {
                                        let mut c = MediaTrackConstraints::new();
                                        c.facing_mode(&"user".into());
                                        c
                                    }
                                }
                                .dyn_ref()
                                .unwrap(),
                            ),
                        )
                        .unwrap();
                    let result: Result<
                        wasm_bindgen::prelude::JsValue,
                        wasm_bindgen::prelude::JsValue,
                    > = JsFuture::from(js_promise).await;
                    match result {
                        Ok(media_stream) => {
                            let media_stream: MediaStream = media_stream.dyn_into().unwrap();
                            s.send(media_stream.to_owned()).await.unwrap();
                            Ok(media_stream)
                        }
                        Err(e) => Err(e),
                    }
                },
                destructor: move || {
                    spawn_local(async move {
                        let media_stream = r.recv().await.unwrap();
                        for track in media_stream.get_video_tracks().to_vec() {
                            let track: MediaStreamTrack = track.dyn_into().unwrap();
                            track.stop();
                        }
                    })
                },
            }
        },
        Deps::some(device_id.get().clone()),
    );

    let video_promise_value = video_promise.value();
    CameraData {
        device_id,
        video_promise: video_promise_value.clone(),
    }
}
