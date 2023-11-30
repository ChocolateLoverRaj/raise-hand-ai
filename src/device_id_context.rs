use wasm_react::{create_context, hooks::State, Context};

pub struct VideoPromiseAndId {
    pub video_promise: Option<String>,
    pub device_id: State<Option<String>>,
}

thread_local! {
  pub static DEVICE_ID_CONTEXT: Context<Option<VideoPromiseAndId>> = create_context(None.into());
}
