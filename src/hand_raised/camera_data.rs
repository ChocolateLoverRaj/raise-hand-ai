use wasm_bindgen::JsValue;
use web_sys::MediaStream;

use crate::{get_set::GetSet, use_future::FutureState};

pub struct CameraData<G>
where
    G: GetSet<Option<String>>,
{
    pub video_promise: FutureState<Result<MediaStream, JsValue>>,
    pub device_id: G,
}
