// bulk collection 만들었음

// bulkWrite
db.bulk.bulkWrite(
    [ // 배열 안에 작업들 넣기
        {insertOne: {doc: 1, order: 1} },
        {insertOne: {doc: 2, order: 2} },
        {insertOne: {doc: 3, order: 3} },
        {insertOne: {doc: 4, order: 4} },
        {insertOne: {doc: 4, order: 5} },
        {insertOne: {doc: 5, order: 6} },
        {
            deleteOne: {
                filter: {doc: 3}
            }
        },
        {
            updateOne: {
                filter: {doc: 2},
                update: {
                    $set: {doc: 12}
                }
            }
        }
    ]
)


db.bulk.bulkWrite(
    [ 
        {insertOne: {doc: 1, order: 1} },
        {insertOne: {doc: 2, order: 2} },
        {insertOne: {doc: 3, order: 3} },
        {insertOne: {doc: 4, order: 4} },
        {insertOne: {doc: 4, order: 5} },
        {insertOne: {doc: 5, order: 6} },
        {
            updateOne: {
                filter: {doc: 2},
                update: {
                    $set: {doc: 3}
                }
            }
        },
        {
            deleteMany: {
                filter: {doc: 3}
            }
        },

    ],
    {ordered: false} // 암것도 안하면 true, 순서 상관 없이 성능 최적화되게 작업들이 실행됨
)

/**
 * MongoDB는 Document 레벨에서 원자성을 보장함
 * ex) insertMany로 100만개 데이터 삽입 도중 문제 발생 시
 * 롤백되지 않고 중간까지만 삽입됨
 * 
 * bulkWrite도 중간에 어떤 이유로 중단된 경우 원자성 깨짐
 * 만약 특정 작업 단위의 원자성을 보장해야 한다면 하나의 document 안에 데이터를 같이 내장시키거나 트랜잭션을 사용해야 함
 * (MongoDB는 트랜잭션을 지원하지만 권장하진 않음)
 */


db.bulk.countDocuments()  // 도큐먼트 실제로 실행하면서 count값 확인
db.bulk.estimatedDocumentCount() // 예상되는 document의 수를 가져옴. 데이터가 많은 경우 이거로 빠르게 조회 가능


db.bulk.distinct("doc") // doc 컬럼의 값을 중복 없이 조회

// 동시성 제어를 위한 함수
// 수정 전에 도큐먼트를 반환하고 수정하거나, 수정하고 수정 된 값을 반환
// 공식문서에서 옵션 참고
db.bulk.findAndModify({
    query: { doc: 4 }, // doc컬럼이 4인 도큐먼트를 조회하여 리턴.
    update: { $inc: {doc: 1} } // 1 증가시킴. findAndModify는 하나 씩만 수정됨
})

db.bulk.findAndModify({
    query: { doc: 5 }, 
    sort: { order: -1 }, // order라는 필드를 내림차순으로 정렬
    update: { $inc: {doc: 1} } 
})

/**
 * [findAndModify 사용 예]
 * MongoDB는 sequance, auto_incerement 같은 번호 순차적으로 받는 기능이 없음
 * 마지막 값을 조회한 후 +1을 함 -> 동시성 이슈 발생할 수 있음
 * (ex. 3명이 동시에 max값 호출 후 +1할 경우)
 * 
 * sequance 역할의 컬렉션을 따로 만들어서 제어 가능
 */

db.sequance.insertOne({seq: 0})

db.sequance.findAndModify({ 
    query: {},
    sort: {seq: -1},
    update: { $inc: {seq: 1}}
})


db.bulk.getIndexes()
db.bulk.createIndex({doc: 1})

// update : 필드, replace : document 전체 수정. _id는 변경되지 않음
// MongoDB는 _id가 한번 정의되면 변경되지 않음

db.bulk.updateOne({ doc: 1 }, { $set: {_id: 1}}) // 오류발생
db.bulk.replaceOne({ doc: 1 }, {_id: 1, doc: 13 }) // 오류 발생
db.bulk.replaceOne({ doc: 1 }, {doc: 13 }) // order필드 있던 도큐먼트가 사라지고 {doc:13}으로 교체됐음