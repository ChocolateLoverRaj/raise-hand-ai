use js_sys::{Array, Function};
use wasm_bindgen::{closure::Closure, JsCast};
use wasm_react::hooks::{use_effect, use_ref, Deps, JsRefContainer};
use web_sys::{Element, ResizeObserver, ResizeObserverEntry};

#[derive(Clone, Copy)]
pub struct Size {
    pub width: i32,
    pub height: i32,
}

pub fn use_resize_observer<F, T>(on_resize: F, target: JsRefContainer<T>)
where
    F: (Fn(ResizeObserverEntry)) + 'static,
    T: JsCast + 'static,
{
    let closure = use_ref({
        Closure::wrap(Box::new(move |sizes: Array| {
            let size = sizes.get(0).unchecked_into::<ResizeObserverEntry>();
            on_resize(size);
        }) as Box<dyn Fn(Array)>)
    });
    use_effect(
        {
            move || {
                let closure = closure.current();
                let resize_function: &Function = closure.as_ref().unchecked_ref();
                let resize_observer = ResizeObserver::new(resize_function).unwrap();
                let target: Element = target.current().unwrap().unchecked_into();
                resize_observer.observe(&target);

                move || {
                    resize_observer.unobserve(&target);
                }
            }
        },
        Deps::none(),
    )
}
