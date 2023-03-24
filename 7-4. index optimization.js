// ESR Rule
// equal -> sort -> range

// use sample_supplies

// 2015년 이후 발생한 거래 내역 조회
db.sales.find(
    {
        saleDate: {
            $gte: ISODate("2015-01-01T00:00:00.000Z")
        }
    }
).explain('executionStats')

db.sales.createIndex({saleDate: 1})

// 커버링 인덱스. saleDate 필드만 사용하기
db.sales.find(
    {
        saleDate: {
            $gte: ISODate("2015-01-01T00:00:00.000Z")
        }
    },
    {
        saleDate: 1,
        _id: 0
    }
).explain('executionStats')

/*
  winningPlan: {
      stage: 'PROJECTION_COVERED', // <-
      transformBy: { saleDate: 1, _id: 0 },
      inputStage: {
        stage: 'IXSCAN',
        keyPattern: { saleDate: 1 },
        indexName: 'saleDate_1',
        isMultiKey: false,
        multiKeyPaths: { saleDate: [] },
        isUnique: false,
 ...
  executionStats: {
    executionSuccess: true,
    nReturned: 3068,
    executionTimeMillis: 2, // 5 -> 2로 개선
    totalKeysExamined: 3068,
    totalDocsExamined: 0, // 인덱스의 필드만 사용하므로 반환된 도큐먼트를 순회하지 않음
    executionStages: {
      stage: 'PROJECTION_COVERED',
      nReturned: 3068,
      executionTimeMillisEstimate: 0,
      works: 3069,
      advanced: 3068,

*/


// 카디널리티에 따른 인덱스 최적화
// 카디널리티 : 데이터가 얼마나 유니크 한지, 고유성을 띄고있는지에 대한 정도
// 카디널리티가 낮은 필드는 복합 인덱스를 사용하여 고유성을 높이는 방법을 사용할 수 있음

db.sales.find(
    {
        storeLocation: 'Denver',
        'customer.age': 75
    }
).explain('executionStats')

/*
 executionStats: {
    executionSuccess: true,
    nReturned: 11,
    executionTimeMillis: 4,
    totalKeysExamined: 0,
    totalDocsExamined: 5000,
    executionStages: {
      stage: 'COLLSCAN',

컬렉션 스캔
5000개 도큐먼트 순회하고 11개 반환함
*/

db.sales.createIndex({storeLocation: 1})

db.sales.find(
    {
        storeLocation: 'Denver',
        'customer.age': 75
    }
).explain('executionStats')

/*
 executionStats: {
    executionSuccess: true,
    nReturned: 11,
    executionTimeMillis: 4,
    totalKeysExamined: 1549,
    totalDocsExamined: 1549, // 5000 -> 1549 개선
    executionStages: {
      stage: 'FETCH',
      filter: { 'customer.age': { '$eq': 75 } },
      nReturned: 11,
      executionTimeMillisEstimate: 0,
      works: 1550,
      advanced: 11,
      needTime: 1538,
      needYield: 0,
      saveState: 1,
      restoreState: 1,
      isEOF: 1,
      docsExamined: 1549,
      alreadyHasObj: 0,
      inputStage: {
        stage: 'IXSCAN', // collscan -> ixscan 개선
        nReturned: 1549,
*/

// 멀티키 인덱스로 카디널리티를 높이기
db.sales.createIndex(
    {
        storeLocation: 1,
        'customer.age': 1
    }
)

db.sales.find(
    {
        storeLocation: 'Denver',
        'customer.age': 75
    }
).explain('executionStats')
/*
 executionStats: {
    executionSuccess: true,
    nReturned: 11,
    executionTimeMillis: 1,
    totalKeysExamined: 11,
    totalDocsExamined: 11, // 1549 -> 11 개선
*/

// 복합인덱스도 storeLocation 순으로 먼저 정렬되어있으므로 필요없어진 인덱스 삭제
db.sales.dropIndex({storeLocation: 1})



// 지역 기반 쿼리 최적화 하기-----------------
// use sample_restaurants
db.restaurants.findOne()
db.restaurants.getIndexes()


explain = db.restaurants.aggregate([
    {
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: [-73.98241999999999, 40.579505 ]
            },
            key: 'address.coord',
            maxDistance: 30000, // 30 km
            query: {
                cuisine: 'Hamburgers'
            },
            distanceField: 'dist'
        }
    },
    {
        $project: {
            name: 1,
            cuisine: 1,
            dist: 1
        }
    }
]).explain('executionStats')

explain.stages

// 개선 방안
// 비즈니스 요구사항을 변경 : 검색범위를 줄인다 30 km -> 3 km
// 조건을 늘려서 복합 인덱스로 인덱스 키로 순회할 범위를 줄인다

db.restaurants.createIndex({
    cuisine: 1,
    'address.coord': '2dsphere'
})

explain = db.restaurants.aggregate([
    {
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: [-73.98241999999999, 40.579505 ]
            },
            key: 'address.coord',
            maxDistance: 30000, // 30 km
            query: {
                cuisine: 'Hamburgers'
            },
            distanceField: 'dist'
        }
    },
    {
        $project: {
            name: 1,
            cuisine: 1,
            dist: 1
        }
    }
]).explain('executionStats')

explain.stages