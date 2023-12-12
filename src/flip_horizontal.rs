use wasm_tensorflow_models_pose_detection::pose::Pose;

pub fn flip_horizontal(poses: &mut Vec<Pose>, width: f64) {
    poses.iter_mut().for_each(|pose| {
        pose.keypoints.iter_mut().for_each(|keypoint| {
            keypoint.x = width - keypoint.x;
        });
    });
}
