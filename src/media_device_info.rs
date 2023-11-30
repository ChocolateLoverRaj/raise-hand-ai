use serde::{Deserialize, Serialize};
use wasm_bindgen::JsValue;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaDeviceInfo {
    pub device_id: String,
    pub kind: String,
    pub label: String,
}

impl From<JsValue> for MediaDeviceInfo {
    fn from(value: JsValue) -> Self {
        serde_wasm_bindgen::from_value::<MediaDeviceInfo>(value).unwrap()
    }
}
