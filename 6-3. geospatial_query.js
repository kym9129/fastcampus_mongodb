// 시각화된 데이터 스터디 자료에 있음
db.grids.insertMany([
    {
        _id: 1,
        loc: [0,0]
    },
    {
        _id: 2,
        loc: [3,4]
    },
    {
        _id: 3,
        loc: [15,2]
    },
    {
        _id: 5,
        loc: {
            type: "Point", // 점
            coordinates: [5,5]
        }
    },
    {
        _id: 6,
        loc: {
            type: "Point",
            coordinates: [14, 8]
        }
    },
    {
        _id: 7,
        loc: {
            type: "LineString", // 직선
            coordinates: [
                [6,6],
                [13,13]
            ]
        }
    },
    {
        _id: 8,
        loc: {
            type: "Point",
            coordinates: [
                [0,12],
                [5,12]
            ]
        }
    },
    {
        _id: 9,
        loc: {
            type: "Polygon", // 다각형
            coordinates: [
                [
                    [2,2],
                    [3,3],
                    [4,2],
                    [2,2]
                ]

            ]
        }
    },
    {
        _id: 10,
        loc: {
            type: "Polygon", // 다각형
            coordinates: [
                [
                    [9,0],
                    [5,13],
                    [14,6],
                    [9,0]
                ]
            ]
        }
    }

]);

// 사각형 범위에 겹치는 데이터 조회
db.grids.find({
    loc: {
        $geoIntersects: { // <-
            $geometry: {
                type: "Polygon", // 다각형
                coordinates: [
                    [
                        [0,0],
                        [10,0],
                        [10,10],
                        [0,10],
                        [0,0], // 다시 닫아줌
                    ]
                ]
            }
        }
    }
});

// 사각형 범위 안에 완전히 들어오는 데이터만 조회
db.grids.find({
    loc: {
        $geoWithin: { // <-
            $geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [0,0],
                        [10,0],
                        [10,10],
                        [0,10],
                        [0,0], // 다시 닫아줌
                    ]
                ]
            }
        }
    }
});


// near 사용하기. 지역기반 인덱스 필요
db.grids.find({
    loc: {
        $near: {
            $geometry: { 
                type: "Point",
                coordinates: [5,5]
            },
            $maxDistance: 3
        }
    }
});