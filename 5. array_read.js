db.sales.findOne({
    customer: { 
        gender: 'F', 
        age: 39, 
        email: 'beecho@wic.be', 
        satisfaction: 3 
    }
});

// 도큐먼트의 필드 순서 바꾸면 조회 결과 안나옴
db.sales.findOne({
    customer: { 
        age: 39, 
        gender: 'F', 
        email: 'beecho@wic.be', 
        satisfaction: 3 
    }
});

// 점으로 특정 필드의 하위필드 접근
db.sales.findOne({
    "customer.email": 'beecho@wic.be'
});

db.sales.findOne({
    'customer.age' : {$lt: 20}
});

// 'test' DB에서 inventory 컬렉션에 데이터 추가
db.inventory.insertMany([
    { item: "journal", qty: 25, tags: ["blank", "red"], dim_cm: [ 14, 21 ] },
    { item: "notebook", qty: 50, tags: ["red", "blank"], dim_cm: [ 14, 21 ] },
    { item: "paper", qty: 100, tags: ["red", "blank", "plain"], dim_cm: [ 14, 21 ] },
    { item: "planner", qty: 75, tags: ["blank", "red"], dim_cm: [ 22.85, 30 ] },
    { item: "postcard", qty: 45, tags: ["blue"], dim_cm: [ 10, 15.25 ] },
    { item: "postcard", qty: 45, tags: ["blue", "red"], dim_cm: [ 13, 13 ] }
]);

// 배열에 'red'가 포함되어있으면 전부 리턴
db.inventory.find({
    tags: 'red'
});

// red와 blank가 들어있는 tags 배열 리턴 (and 조건)
db.inventory.find({
    tags: ['red', 'blank']
});

// $all : tags에 red, blank가 모두 들어간 배열 찾기
db.inventory.find({
    tags: {$all :  ['red', 'blank'] }
});

// $in : or 조건 쓰기
db.inventory.find({
    tags: {$in :  ['red', 'blank'] }
});

// 배열 요소에 blue가 하나라도 들어있으면 리턴
db.inventory.find({
    tags: 'blue'
});

db.inventory.find({
    dim_cm: {$gt: 15}
});

// !! 배열에서 이렇게 하면 범위 조건이 아님 !! (자주 하는 실수)
// ex) dim_cm: [22.05, 30]일 경우, gt15는 true지만 lt20이 false이다. 둘 중 false가 있기 때문에 조회 시 나오지 않게됨
db.inventory.find({
    dim_cm: {$gt: 15, $lt: 20}
});

// $elemMatch : 배열 요소 중 조건에 하나라도 맞으면 리턴해줌
// 배열 전체에 대한 범위 검색은 나중에 aggregation으로 해야 함
db.inventory.find({
    dim_cm: {$elemMatch: {$gt: 15, $lt: 20} }
});
// [10, 15.25]가 나온 이유 : 15.25가 조건에 해당하기 때문

// 배열의 특정 위치에 대해 조건절 주기
// 0번부터 시작
db.inventory.find({
    'dim_cm.1':{$lt:20}
});

// $size : 배열의 길이로 찾기
// 요소가 3개인 tags 배열 찾기
db.inventory.find({
    tags:{$size:3}
})

// 배열의 요소로 내장 도큐먼트를 들고있는 경우
// 이렇게 하면 items.quantity가 6보다 큰 값도 나와버림 -> $elemMatch 필요
db.sales.find({
    'items.name': 'binder',
    'items.quantity': {$lte: 6}
});

// name=binder and quantity lte 6인 요소가 포함된 도큐먼트 배열이 리턴됨
db.sales.find({
    items: {
        $elemMatch: {
            name: "binder",
            quantity: {$lte: 6}
        }
    }
});

// positioning operator : <array>.$
// 달러표시가 배열의 인덱스 역할
// 배열 중에 조건이 만족하는 첫번째 요소만 반환할 수 있음
db.sales.find(
    { // 조건 (where)
        items: {
            $elemMatch: {
                name: "binder",
                quantity: {$lte: 6}
            }
        }
    },
    { // 프로젝션 (select)
        saleDate: 1,
        'items.$': 1,
        storeLocation: 1,
        customer: 1
    }
);
