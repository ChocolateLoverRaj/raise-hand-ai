use wasm_react::{create_context, Context};
use web_sys::MediaStream;

use crate::use_local_storage_state::LocalStorageState;

pub struct VideoPromiseAndId<'a> {
    pub video_promise: Option<MediaStream>,
    pub device_id: LocalStorageState<'a, Option<String>>,
}

thread_local! {
  pub static DEVICE_ID_CONTEXT: Context<Option<VideoPromiseAndId<'static>>> = create_context(None.into());
}
