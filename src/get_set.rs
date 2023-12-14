use std::cell::Ref;

use wasm_react::hooks::State;

pub trait GetSet<T> {
    fn get(&self) -> Ref<'_, T>;
    fn set(&mut self, mutator: Box<dyn FnOnce(T) -> T>);
}

impl<T: 'static> GetSet<T> for State<T> {
    fn set(&mut self, mutator: Box<dyn FnOnce(T) -> T>) {
        State::set(self, mutator);
    }

    fn get(&self) -> Ref<'_, T> {
        State::value(&self)
    }
}
