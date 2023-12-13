use wasm_bindgen_futures::JsFuture;
use wasm_react::hooks::{use_context, Deps};

use crate::{
    hand_raised::can_camera::CAMERA_CONTEXT,
    use_future::{use_future, FutureState},
    use_resize_observer::use_resize_observer,
};

use super::{resize_canvas::resize_canvas, resize_canvas_input::ResizeCanvasInput};

pub fn use_play_promise_and_auto_resize_canvas(
    input: ResizeCanvasInput,
) -> FutureState<Result<(), ()>> {
    let context = use_context(&CAMERA_CONTEXT);
    let future_state = use_future(
        {
            let input = input.clone();
            move || async move {
                let video = input.video_ref.current().unwrap();
                let media_stream = context
                    .as_ref()
                    .as_ref()
                    .unwrap()
                    .video_promise
                    .get_result()
                    .unwrap()
                    .as_ref()
                    .unwrap();
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
