use js_sys::{Array, Reflect};
use serde::{Deserialize, Serialize};
use wasm_bindgen::{JsCast, JsValue};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaStreamTrackSettings {
    pub device_id: String,
}
pub struct MediaStreamTrack {
    js_value: JsValue,
}

impl MediaStreamTrack {
    pub fn get_settings(&self) -> MediaStreamTrackSettings {
        let get_settings = Reflect::get(&self.js_value, &"getSettings".into()).unwrap();
        let settings_js_value = Reflect::apply(
            &get_settings.dyn_ref().unwrap(),
            &self.js_value,
            &Array::new(),
        )
        .unwrap();
        serde_wasm_bindgen::from_value::<MediaStreamTrackSettings>(settings_js_value).unwrap()
    }
}

impl From<JsValue> for MediaStreamTrack {
    fn from(value: JsValue) -> Self {
        MediaStreamTrack { js_value: value }
    }
}

impl Into<JsValue> for MediaStreamTrack {
    fn into(self) -> JsValue {
        self.js_value
    }
}
