use js_sys::Promise;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::{spawn_local, JsFuture};
use wasm_react::hooks::{use_effect, use_state, Deps, State};

pub enum PromiseState {
    NotStarted,
    Pending,
    Done(Result<JsValue, JsValue>),
}

pub fn use_promise<D>(
    effect: impl FnOnce() -> Promise + 'static,
    deps: Deps<D>,
) -> State<PromiseState>
where
    D: PartialEq + 'static,
{
    let state = use_state(|| PromiseState::NotStarted);
    {
        let mut state = state.clone();
        use_effect(
            move || {
                let promise = effect();
                spawn_local(async move {
                    state.set(|mut _state| PromiseState::Pending);
                    let result = JsFuture::from(promise).await;
                    state.set(|mut _state| PromiseState::Done(result));
                });
            },
            deps,
        );
    }
    state
}
