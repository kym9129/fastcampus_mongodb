// use test
db.survey.insertMany([
    {item: 'ABC', ratings: [2, 9], category_id: 10},
    {item: 'XUZ', ratings: [4, 3], category_id: 10},
    {item: 'ABC', ratings: [9], category_id: 20},
    {item: 'ABC', ratings: [9, 10], category_id: 30},
    {item: 'ABC', ratings: [2, 4], category_id: 30},
])

for(var i=0; i<15; i++){
    arr = []
    db.survey.find({}, {_id: 0}).forEach(function(document){
        arr.push(document);
    })
    db.survey.insertMany(arr)
}

db.survey.estimatedDocumentCount()

db.survey.createIndex({category_id: 1})

db.survey.find({
    category_id: {
        $gt: 15,
        $lt: 25
    }
}).explain('executionStats')
// indexBounds: { category_id: [ '(15, 25)' ] },

// 멀티 키 인덱스 생성할 경우
db.survey.createIndex({ ratings: 1 })

db.survey.find({
    ratings:{
        $gte: 3,
        $lte: 6
    }
}).explain('executionStats')
// indexBounds: { ratings: [ '[-inf.0, 6]' ] }, 작은 값이 -infinity. 6보다 작은 모든 값을 확인했다는 뜻
// 문제가 있음

// elemMatch로 해결하기
db.survey.find({
    ratings:{
        $elemMatch: {
            $gte: 3,
            $lte: 6
        }
    }
}).explain('executionStats')
// indexBounds: { ratings: [ '[3, 6]' ] },

// elemMatch를 쓰고 안쓰고의 차이 확인하기

db.survey.drop()

db.survey.insertMany([
    {item: 'ABC', ratings: [2, 9], category_id: 10},
    {item: 'XUZ', ratings: [4, 3], category_id: 10},
    {item: 'ABC', ratings: [9], category_id: 20},
    {item: 'ABC', ratings: [9, 10], category_id: 30},
    {item: 'ABC', ratings: [2, 4], category_id: 30},
])

db.survey.createIndex({ ratings: 1 })

db.survey.find({
    ratings:{
        $gte: 3,
        $lte: 6
    }
})

db.survey.find({
    ratings:{
        $elemMatch: {
            $gte: 3,
            $lte: 6
        }
    }
})

// elemMatch를 사용하지 않고 원하는 결과를 만들었음
db.survey.find({
    $and: [
        { ratings: { $not: {$lt: 3 } }},
        { ratings: { $not: {$gt: 6 } }},
    ]
}).explain('executionStats')
// indexBounds: { ratings: [ '[MinKey, 6]', '(inf.0, MaxKey]' ] },
// 문제 : 인덱스 바운드가 막혀있지 않고 전체를 탐색함

// 개선 방법 - 조건을 하나 더 주기
db.survey.find({
    $and: [
        { ratings: { $elemMatch: {$gte: 3, $lte: 6 } }},
        { ratings: { $not: {$lt: 3 } }},
        { ratings: { $not: {$gt: 6 } }},
    ]
}).explain('executionStats')
// indexBounds: { ratings: [ '[3, 6]' ] },