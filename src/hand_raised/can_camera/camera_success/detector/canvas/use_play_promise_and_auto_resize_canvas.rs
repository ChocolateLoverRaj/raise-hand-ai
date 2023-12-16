use wasm_bindgen_futures::JsFuture;
use wasm_react::hooks::Deps;
use web_sys::MediaStream;

use crate::{
    use_future::{use_future, FutureState},
    use_resize_observer::use_resize_observer,
};

use super::{resize_canvas::resize_canvas, resize_canvas_input::ResizeCanvasInput};

pub fn use_play_promise_and_auto_resize_canvas(
    input: ResizeCanvasInput,
    media_stream: MediaStream,
) -> FutureState<Result<(), ()>> {
    let future_state = use_future(
        {
            let input = input.clone();
            move || async move {
                let video = input.video_ref.current().unwrap();
                video.set_src_object(Some(&media_stream));
                match JsFuture::from(video.play().unwrap()).await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(()),
                }
            }
        },
        Deps::none(),
    );

    use_resize_observer(
        {
            let input = input.clone();
            move |_size| resize_canvas(&input)
        },
        input.container_ref,
    );

    *future_state.to_owned().value()
}
