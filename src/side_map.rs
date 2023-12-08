pub struct SideKeypoints {
    pub wrist: usize,
    pub elbow: usize,
    pub shoulder: usize,
    pub waist: usize,
}

pub static SIDE_MAP: &'static [SideKeypoints] = &[
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
];
