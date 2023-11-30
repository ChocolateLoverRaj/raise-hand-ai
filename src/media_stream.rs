use js_sys::{Array, Reflect};
use wasm_bindgen::{JsCast, JsValue};

use crate::media_stream_track::MediaStreamTrack;

pub struct MediaStream {
    js_value: JsValue,
}

impl MediaStream {
    pub fn get_video_tracks(&self) -> Vec<MediaStreamTrack> {
        let get_video_tracks = Reflect::get(&self.js_value, &"getVideoTracks".into()).unwrap();
        Array::try_from(
            Reflect::apply(
                &get_video_tracks.dyn_ref().unwrap(),
                &self.js_value,
                &Array::new(),
            )
            .unwrap(),
        )
        .unwrap()
        .to_vec()
        .iter()
        .map(|media_stream_track_js_value| {
            MediaStreamTrack::from(media_stream_track_js_value.to_owned())
        })
        .collect()
    }
}

impl From<JsValue> for MediaStream {
    fn from(value: JsValue) -> Self {
        MediaStream { js_value: value }
    }
}

impl Into<JsValue> for MediaStream {
    fn into(self) -> JsValue {
        self.js_value
    }
}
