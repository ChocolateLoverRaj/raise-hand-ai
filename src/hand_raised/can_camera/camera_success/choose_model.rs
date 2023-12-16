use std::{rc::Rc, str::FromStr};

use wasm_bindgen::JsCast;
use wasm_react::{h, Callback, Component, VNode};
use wasm_tensorflow_models_pose_detection::model::Model;
use web_sys::{Event, HtmlSelectElement};

use crate::{get_set::GetSet, hand_raised::can_camera::use_detector::DetectorData};

pub struct ChooseModel<G: GetSet<Model>> {
    pub detector: Rc<DetectorData<G>>,
}

impl<G: GetSet<Model> + 'static> Component for ChooseModel<G> {
    fn render(&self) -> VNode {
        h!(select)
            .value(self.detector.model.get().clone())
            .on_change({
                let mut model_state = self.detector.model.clone();
                &Callback::new({
                    move |event: Event| {
                        let model = Model::from_str(
                            event
                                .target()
                                .unwrap()
                                .dyn_into::<HtmlSelectElement>()
                                .unwrap()
                                .value()
                                .as_str(),
                        )
                        .unwrap();
                        model_state.set(Box::new(|_model| model));
                    }
                })
            })
            .build(
                enum_iterator::all::<Model>()
                    .map(|model| {
                        h!(option)
                            .value(model.clone())
                            .disabled(model == Model::PoseNet)
                            .build(<Model as Into<&'static str>>::into(model.clone()))
                    })
                    .collect::<VNode>(),
            )
    }
}
