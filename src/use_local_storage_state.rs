use std::cell::Ref;

use serde::{de::DeserializeOwned, Serialize};
use wasm_react::hooks::{use_state, State};
use web_sys::window;

use crate::get_set::GetSet;

#[derive(Debug, Clone)]
pub struct LocalStorageState<'a, T>
where
    T: Serialize,
{
    key: &'a str,
    state: State<T>,
}

impl<'a, T: 'static> GetSet<T> for LocalStorageState<'a, T>
where
    T: Serialize,
{
    fn get(&self) -> Ref<'_, T> {
        self.state.value()
    }

    fn set(&mut self, mutator: Box<dyn FnOnce(T) -> T>) {
        self.state.set(mutator);
        window()
            .unwrap()
            .local_storage()
            .unwrap()
            .unwrap()
            .set_item(
                self.key,
                serde_json::to_string(&*self.state.value())
                    .unwrap()
                    .as_str(),
            )
            .unwrap();
    }
}

pub fn use_local_storage_state<'a, T: 'static>(
    key: &'a str,
    init: impl FnOnce() -> T,
) -> LocalStorageState<T>
where
    T: Serialize + DeserializeOwned + Clone,
{
    let state = use_state(|| {
        let get_item = window()
            .unwrap()
            .local_storage()
            .unwrap()
            .unwrap()
            .get_item(key)
            .unwrap();
        get_item.map_or(init(), |s| serde_json::from_str(s.as_str()).unwrap())
    });

    LocalStorageState { key, state }
}
