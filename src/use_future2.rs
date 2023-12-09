use std::future::Future;
use wasm_bindgen_futures::spawn_local;
use wasm_react::hooks::{use_effect, use_state, Deps, IntoDestructor, State};

use crate::use_future::FutureState;

pub struct CreateFutureOutput<T, Fut, G>
where
    T: 'static,
    Fut: Future<Output = T> + 'static,
    G: IntoDestructor,
{
    pub future: Fut,
    pub destructor: G,
}

pub fn use_future2<T, F, Fut, D, G>(create_future: F, deps: Deps<D>) -> State<FutureState<T>>
where
    T: 'static,
    F: (FnOnce() -> CreateFutureOutput<T, Fut, G>) + 'static,
    Fut: Future<Output = T> + 'static,
    D: PartialEq + 'static,
    G: IntoDestructor,
{
    let state = use_state(|| FutureState::NotStarted);
    {
        let mut state = state.clone();
        use_effect(
            move || {
                let create_future_output = create_future();
                spawn_local(async move {
                    state.set(|mut _state| FutureState::Pending);
                    let value = create_future_output.future.await;
                    state.set(|mut _state| FutureState::Done(value));
                });
                create_future_output.destructor
            },
            deps,
        );
    }
    state
}
