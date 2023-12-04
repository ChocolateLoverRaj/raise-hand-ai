use aspect_fit::{aspect_fit::aspect_fit, scale_size::scale_size, size::Size};

use super::resize_canvas_input::ResizeCanvasInput;

pub fn resize_canvas(input: &ResizeCanvasInput) {
    let video = input.video_ref.current().unwrap();
    let canvas = input.canvas_ref.current().unwrap();
    let container = input.container_ref.current().unwrap();

    let video_scale = Size {
        width: video.video_width(),
        height: video.video_height(),
    };
    let fit = scale_size(
        &aspect_fit::<f64, u32>(
            &video_scale,
            &Size {
                width: container.offset_width() as u32,
                height: container.offset_height() as u32,
            },
        ),
        &video_scale,
    );
    canvas.set_width(fit.width);
    canvas.set_height(fit.height);
}
