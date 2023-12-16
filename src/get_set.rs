use std::cell::Ref;

use wasm_react::hooks::State;

pub trait Get<T> {
    fn get(&self) -> Ref<'_, T>;
}

pub trait Set<T> {
    fn set(&mut self, mutator: Box<dyn FnOnce(T) -> T>);
}

pub trait GetSet<T>: Get<T> + Set<T> + Clone {}

impl<T: 'static> Set<T> for State<T> {
    fn set(&mut self, mutator: Box<dyn FnOnce(T) -> T>) {
        State::set(self, mutator);
    }
}

impl<T: 'static> Get<T> for State<T> {
    fn get(&self) -> Ref<'_, T> {
        State::value(&self)
    }
}
