// 인덱스의 다양한 속성

// TTL indexes
// 자동으로 일정 시간이 지나면 도큐먼트를 삭제해줌

// use test
db.ttl.insertMany([
    {
        msg: "Hello!",
        time: new ISODate()
    },
    {
        msg: "HelloWorld!",
        time: new ISODate()
    }
])

db.ttl.createIndex(
    {time: 1},
    {expireAfterSeconds: 60}
)
db.ttl.getIndexes()
db.ttl.find()


// unique index

// insert 없이 인덱스만 생성해도 컬렉션 같이 생성됨
db.unique.createIndex(
    {name: 1},
    {unique: true}
)

db.unique.insertMany([
    {name: 'tom'},
    {name: 'john'},
])

db.unique.insertOne(
    {name: 'tom'}
)
// MongoServerError: E11000 duplicate key error collection: test.unique index: name_1 dup key: { name: "tom" }


db.unique.dropIndex({name:1})

// 복합 인덱스에 유니크 인덱스 사용해보기
db.unique.createIndex(
    {
        name: 1,
        age: 1
    },
    {unique: true}
)

db.unique.insertOne({
    name: 'james',
    age: 23
})

db.unique.insertOne({
    name: 'james',
    age: 24
})
// 이름 같아도 age 다르면 들어가진다


// Sparse Indexes
db.sparse.insertOne({ x:1 })
db.sparse.insertOne({ x:2 })
db.sparse.insertOne({ y:1 })

db.sparse.createIndex(
    {x: 1},
    {sparse: true}
)

// 인덱스 지정 : hint() - x를 오름차순으로 하는 인덱스를 사용하겠다는 힌트
db.sparse.find().hint({x: 1}) 
/*
[
  { _id: ObjectId("640474d65a985786d338a945"), x: 1 },
  { _id: ObjectId("640474d65a985786d338a946"), x: 2 }
]
필드가 존재하는 도큐먼트에 대해서만 인덱싱
*/

// partial indexes
// sparse index보다는 partial index 사용을 권장

db.sparse.dropIndex({x:1})
db.sparse.createIndex(
    {x:1},
    {
        partialFilterExpression: {
            x: {$exists: true}
        }
    }
)

db.sparse.find().hint({x: 1}) 

db.sparse.dropIndex({x:1})
db.sparse.createIndex(
    {x:1},
    {
        partialFilterExpression: {
            x: {$exists: true},
            x:{$gte: 2}
        }
    }
)
db.sparse.find().hint({x: 1}) 
// [ { _id: ObjectId("640474d65a985786d338a946"), x: 2 } ]

// hidden indexes
db.hidden.insertOne({ a: 1})
db.hidden.insertOne({ a: 2})

db.hidden.createIndex(
    { a: 1},
    {hidden: true}
)

db.hidden.find(
    {a: 1}
).explain('executionStats')
/*
executionStages: {
      stage: 'COLLSCAN', // collection scan - 인덱스 사용하지 않고 있음
      filter: { a: { '$eq': 1 } },
      nReturned: 1,
      executionTimeMillisEstimate: 0,
      works: 4,
      advanced: 1,
      needTime: 2,
*/

// hidden 속성 해제하기
db.hidden.unhideIndex({a: 1})
// MongoServerError: user is not allowed to do action [collMod] on [test.hidden]
// user에게 collMod 권한이 없음. dbAdmin으로 변경

db.hidden.find(
    {a: 1}
).explain('executionStats')
/*
inputStage: {
        stage: 'IXSCAN', // <-
        nReturned: 1,
        executionTimeMillisEstimate: 0,
        works: 2,
        advanced: 1,
        needTime: 0,
        needYield: 0,
        saveState: 0,
        restoreState: 0,
        isEOF: 1,
        keyPattern: { a: 1 }, // <-
        indexName: 'a_1',
        isMultiKey: false,
        multiKeyPaths: { a: [] },
        isUnique: false,
        isSparse: false,
        isPartial: false,
        indexVersion: 2,
        direction: 'forward',
        indexBounds: { a: [ '[1, 1]' ] },
        keysExamined: 1,
        seeks: 1,
        dupsTested: 0,
        dupsDropped: 0
      }
*/