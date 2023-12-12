use std::collections::HashMap;

use lazy_static::lazy_static;
use wasm_tensorflow_models_pose_detection::model::Model;

pub struct SideKeypoints {
    pub wrist: usize,
    pub elbow: usize,
    pub shoulder: usize,
    pub waist: usize,
}

lazy_static! {
    pub static ref SIDE_MAPS: HashMap<Model, [SideKeypoints; 2]> = {
        let mut m = HashMap::new();
        m.insert(
            Model::BlazePose,
            [
                SideKeypoints {
                    wrist: 16,
                    elbow: 14,
                    shoulder: 12,
                    waist: 24,
                },
                SideKeypoints {
                    wrist: 15,
                    elbow: 13,
                    shoulder: 11,
                    waist: 23,
                },
            ],
        );
        m.insert(
            Model::MoveNet,
            [
                SideKeypoints {
                    wrist: 10,
                    elbow: 8,
                    shoulder: 6,
                    waist: 12,
                },
                SideKeypoints {
                    wrist: 9,
                    elbow: 7,
                    shoulder: 5,
                    waist: 11,
                },
            ],
        );
        m
    };
}
