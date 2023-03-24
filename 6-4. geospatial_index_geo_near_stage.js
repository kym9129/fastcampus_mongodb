// 6-3에 이어서...

// geospatial index 생성
db.grids.createIndex({loc: "2d"}) // 레거시 용도
db.grids.createIndex({loc: "2dshpere"}) // geo..어쩌구 용도 

db.grids.drop()

// lineString, polygon 이런 애덜 빼고 레거시만
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
    }
])

db.grids.find({
    loc: {
        $near: [5,5],
        $maxDistance: 10
    }
})

// use sample_restaurants

// 음식점이 있는 동네 찾기
var restaurant = db.restaurants.findOne()
db.neighborhoods.find(
    {
        geometry: {
            $geoIntersects: {
                $geometry: {
                    type: "Point",
                    coordinates: restaurant.address.coord
                }
            }
        }
    },
    {
        name: 1
    }
)

// 특정 동네에 있는 음식점들 조회
var neighborhood = db.neighborhoods.findOne()
db.restaurants.find(
    {
    "address.coord": {
        $geoWithin: {
            $geometry: neighborhood.geometry
            }
        }
    },
    {
        name: 1, _id: 0
    }
)

// geoNear stage 사용하기

db.restaurants.createIndex({"address.coord": "2dsphere"})

db.restaurants.aggregate([
    {
        $geoNear: {
            near: {
                type: "Point",
                coordinates: [ -73.8845166, 40.744772]
            },
            key: "address.coord",
            maxDistance: 3000, // 미터 단위
            query: {
                cuisine: "Hamburgers"
            },
            distanceField: "dist"
        }
    },
    {
        $project: {
            name: 1,
            cuisine: 1,
            dist: 1
        }
    },
    {
        $count: "cnt"
    }
])