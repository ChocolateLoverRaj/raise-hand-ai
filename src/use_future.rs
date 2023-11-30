use std::future::Future;
use wasm_bindgen_futures::spawn_local;
use wasm_react::hooks::{use_effect, use_state, Deps, State};

#[derive(Clone, Copy)]
pub enum FutureState<T> {
    NotStarted,
    Pending,
    Done(T),
}

pub fn use_future<T, F, Fut, D>(create_future: F, deps: Deps<D>) -> State<FutureState<T>>
where
    T: 'static,
    F: (FnOnce() -> Fut) + 'static,
    Fut: Future<Output = T> + 'static,
    D: PartialEq + 'static,
{
    let state = use_state(|| FutureState::NotStarted);
    {
        let mut state = state.clone();
        use_effect(
            move || {
                spawn_local(async move {
                    state.set(|mut _state| FutureState::Pending);
                    let value = create_future().await;
                    state.set(|mut _state| FutureState::Done(value));
                });
            },
            deps,
        );
    }
    state
}
