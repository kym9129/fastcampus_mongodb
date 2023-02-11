
// 도큐먼트 1개 넣기
db.employees.insertOne({
    name: "lake",
    age: 21,
    dept: "Database",
    joinDate: new ISODate("2022-10-01"),
    salary: 400000,
    bonus: null
})

// 삽입한 데이터 조회
db.employees.find()

// 여러 도큐먼트 넣기 - 배열로 넣기
db.employees.insertMany([
    {
        name: "locean",
        age: 45,
        dept: "Network",
        joinDate: new ISODate("1999-11-15"),
        salary: 1000000,
        resignationDate: new ISODate("2002-12-23"),
        bonus: null
    },
    {
        name: "river",
        age: 34,
        dept: "DevOps",
        isNegotiating: true,
    }
])

// insertOne을 여러번 실행하기 vs insertMany 한번 실행하기
// mongo shell은 js기반이라 js 명령어 사용 가능

for (i=0; i<300; i++){
    db.insertTest.insertOne({a:i})
}

var docs = [];
for (i=0; i<300; i++){
    docs.push({a: i})
    db.insertTest.insertMany(docs);
}
// 2개 이상의 document를 삽입할 땐 insertMany가 훨씬 빠름


// update
db.employees.updateOne(
    { name: "river" }, // queryFilter
    {
        $set: { // add field
            salary: 350000,
            dept: "Database",
            joinDate: new ISODate("2022-12-31")
        },
        $unset: { // delete field
            isNegotiating: ""
        }
    }
)

// 현재 근무 중인 사원 연봉 10% 인상
db.employees.updateMany(
    { resignationDate: {$exists: false}, joinDate: {$exists: true} }, // $exists: 필드 존재 여부 boolean
    { $mul: {salary: Decimal128("1.1")} } // $mul : multiple[곱하기]. 소수점 많이 안나오게 Decimal128 타입으로 곱셈
)

// 성과금 20만 달러 씩 지급. 퇴사자 제외. 최근 입사자에겐 제외 X. (=bonus 필드가 없는 직원)
db.employees.updateMany(
    { resignationDate: {$exists: false}, bonus: {$exists: true} }, // bonus: null 로 할 경우 필드가 없을 떄도 true
    { $set: {bonus: 200000} }
)

// delete
db.employees.deleteOne(
    {name: "river"}
)

// delete all
db.employees.deleteMany({}); // 쿼리필터를 빈칸으로 넣어줘야 오류 안남

// 컬렉션 삭제
db.employees.drop()

// sample_guide database 활용
db.planets.findOne({ name: "Mars" })

db.planets.find({
    hasRings: true,
    orderFromSun: {$lte: 6} // lte : 작거나 같다
})

// and 조건 연산자
db.planets.find({
    $and: [
        { hasRings: true },
        {orderFromSun: {$lte: 6} }
    ]
})

// or 조건 연산자
db.planets.find({
    $or: [
        { hasRings: {$ne: false} }, // $ne = not equal
        {orderFromSun: { $gt: 6 } } // greater than (실수로 $ 빠트렸는데 잘됐음 o.0)
    ]
})

// 배열 안에 특정 값이 들어 있는지 조건 - $in 연산자 사용
db.planets.find(
    { mainAtmosphere: {$in: ['O2']} } 
)