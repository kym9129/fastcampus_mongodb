// test db 사용

db.orders.insertMany([
    { _id: 0, name: 'Pepperoni', size: 'small', price: 19, quantity: 10, date: ISODate('2021-03-13T08:14:30Z') },
    { _id: 1, name: 'Pepperoni', size: 'medium', price: 20, quantity: 20, date: ISODate('2021-03-13T09:13:24Z') },
    { _id: 2, name: 'Pepperoni', size: 'large', price: 21, quantity: 30, date: ISODate('2021-03-17T09:22:12Z') },
    { _id: 3, name: 'Cheese', size: 'small', price: 12, quantity: 15, date: ISODate('2021-03-13T11:21:39.736Z') },
    { _id: 4, name: 'Cheese', size: 'medium', price: 13, quantity: 50, date: ISODate('2021-03-12T21:23:13.331Z') },
    { _id: 5, name: 'Cheese', size: 'large', price: 14, quantity: 10, date: ISODate('2021-03-12T05:08:13Z') },
    { _id: 6, name: 'Vegan', size: 'small', price: 17, quantity: 10, date: ISODate('2021-03-13T05:08:13Z') },
    { _id: 7, name: 'Vegan', size: 'medium', price: 18, quantity: 10, date: ISODate('2021-03-13T05:10:13Z') }
])

// size = medium, 이름 별 총 판매 수량
db.orders.aggregate([
    {
        $match: {
            size: 'medium'
        }
    },
    {
        $group: {
            _id: {$getField: 'name'},
            totalQuantity: {
                $sum: {$getField: 'quantity'}
            }
        }
    }
])

//  $getField를 간단하게 줄여서 사용하기. {$getField: 'name'} -> '$name', {$getField:'quantity} -> '$quantity'
db.orders.aggregate([
    {
        $match: {
            size: 'medium'
        }
    },
    {
        $group: {
            _id: '$name',
            totalQuantity: {
                $sum: '$quantity'
            }
        }
    }
])


db.orders.aggregate([
    {
        $match: {
            data: {
                $gte: new ISODate("2020-01-30"),
                $lt: new ISODate("2022-01-30")
            }
        }
    },
    {
        $group: {
            _id: {
                $dateToString: {
                    format: '%Y-%m-%d', date: '$date'
                }
            },
            totalOrderValue: {
                $sum: {
                    $multiply: ['$price', '$quantity']
                }
            },
            averageOrderQuantity: {
                $avg: '$quantity'
            }
        }
    },
    { // $group stage에서 만든 값으로 정렬 사용 가능
        $sort: {
            totalOrderValue: -1
        }
    }
])


db.books.insertMany([
    { "_id" : 8751, "title" : "The Banquet", "author" : "Dante", "copies" : 2 },
    { "_id" : 8752, "title" : "Divine Comedy", "author" : "Dante", "copies" : 1 },
    { "_id" : 8845, "title" : "Eclogues", "author" : "Dante", "copies" : 2 },
    { "_id" : 7000, "title" : "The Odyssey", "author" : "Homer", "copies" : 10 },
    { "_id" : 7020, "title" : "Iliad", "author" : "Homer", "copies" : 10 },
])

// 저자를 기준으로 그루핑 후 저자가 쓴 책을 배열 형식으로 넣기
// $push 사용
db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {
                $push: '$title'
            }
        }
    }
])
/*
[
    { _id: 'Homer', books: [ 'The Odyssey', 'Iliad' ] },
    {
      _id: 'Dante',
      books: [ 'The Banquet', 'Divine Comedy', 'Eclogues' ]
    }
  ]
  */

// document를 넣기
// $$ROOT : mongodb에서 제공하는 시스템변수. top-level 도큐먼트를 변수로 넣어줌
db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {
                $push: '$$ROOT'
            }
        }
    }
])
/*
[
    {
      _id: 'Dante',
      books: [
        { _id: 8751, title: 'The Banquet', author: 'Dante', copies: 2 },
        { _id: 8752, title: 'Divine Comedy', author: 'Dante', copies: 1 },
        { _id: 8845, title: 'Eclogues', author: 'Dante', copies: 2 }
      ]
    },
    {
      _id: 'Homer',
      books: [
        { _id: 7000, title: 'The Odyssey', author: 'Homer', copies: 10 },
        { _id: 7020, title: 'Iliad', author: 'Homer', copies: 10 }
      ]
    }
  ]
  */

db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {
                $push: '$$ROOT'
            },
            totalCopies: {
                $sum: '$copies'
            }
        }
    }
])
/*
[
    {
      _id: 'Dante',
      books: [
        { _id: 8751, title: 'The Banquet', author: 'Dante', copies: 2 },
        { _id: 8752, title: 'Divine Comedy', author: 'Dante', copies: 1 },
        { _id: 8845, title: 'Eclogues', author: 'Dante', copies: 2 }
      ],
      totalCopies: 5
    },
    {
      _id: 'Homer',
      books: [
        { _id: 7000, title: 'The Odyssey', author: 'Homer', copies: 10 },
        { _id: 7020, title: 'Iliad', author: 'Homer', copies: 10 }
      ],
      totalCopies: 20
    }
  ]
*/

// totalCopies를 $addFields 스테이지를 사용하여 구현
db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {
                $push: '$$ROOT'
            }
        }
    },
    {
        $addFields: {
            totalCopies : {$sum: '$books.copies'} // $group에서 만든 books의 하위 필드 copies를 가져옴
        }
    }
])
/*
[
    {
      _id: 'Dante',
      books: [
        { _id: 8751, title: 'The Banquet', author: 'Dante', copies: 2 },
        { _id: 8752, title: 'Divine Comedy', author: 'Dante', copies: 1 },
        { _id: 8845, title: 'Eclogues', author: 'Dante', copies: 2 }
      ],
      totalCopies: 5
    },
    {
      _id: 'Homer',
      books: [
        { _id: 7000, title: 'The Odyssey', author: 'Homer', copies: 10 },
        { _id: 7020, title: 'Iliad', author: 'Homer', copies: 10 }
      ],
      totalCopies: 20
    }
  ]
*/


db.orders.drop()

db.orders.insertMany([
    {'productId': 1, 'price': 12, },
    {'productId': 2, 'price': 20, },
    {'productId': 3, 'price': 80, }
])

db.products.insertMany([
    {'id': 1, 'instock': 120},
    {'id': 2, 'instock': 80},
    {'id': 3, 'instock': 60},
    {'id': 4, 'instock': 70}
])

// join 간단히 구경하기
db.orders.aggregate([
    {
        $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: 'id',
            as: 'data'
        } 
    }
])
/*
[
    {
      _id: ObjectId("63ea4f7e5a985786d338a936"),
      productId: 1,
      price: 12,
      data: [
        {
          _id: ObjectId("63ea4f7f5a985786d338a939"),
          id: 1,
          instock: 120
        }
      ]
    },
    {
      _id: ObjectId("63ea4f7e5a985786d338a937"),
      productId: 2,
      price: 20,
      data: [
        { _id: ObjectId("63ea4f7f5a985786d338a93a"), id: 2, instock: 80 }
      ]
    },
    {
      _id: ObjectId("63ea4f7e5a985786d338a938"),
      productId: 3,
      price: 80,
      data: [
        { _id: ObjectId("63ea4f7f5a985786d338a93b"), id: 3, instock: 60 }
      ]
    }
  ]
*/

// $expr : 같은 필드를 기준으로 비교할 때 사용.
// $expr은 배열을 이용하면 올바른 값이 안나옴 -> data배열을 $unwind로 풀어줌
db.orders.aggregate([
    {
        $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: 'id',
            as: 'data'
        } 
    },
    {
        $unwind: '$data'
    },
    {
        $match: {
            $expr: {
                $gte: ['$data.instock', '$price']
            }
        }
    }
])
/*
[
    {
      _id: ObjectId("63ea4f7e5a985786d338a936"),
      productId: 1,
      price: 12,
      data: { _id: ObjectId("63ea4f7f5a985786d338a939"), id: 1, instock: 120 } <- $unwind로 인해 배열이 풀려서 결과가 나왔음
    },
    {
      _id: ObjectId("63ea4f7e5a985786d338a937"),
      productId: 2,
      price: 20,
      data: { _id: ObjectId("63ea4f7f5a985786d338a93a"), id: 2, instock: 80 }
    }
  ]
*/


db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {
                $push: '$$ROOT'
            }
        }
    },
    {
        $addFields: {
            totalCopies : {$sum: '$books.copies'}
        }
    },
    // {
    //     $unwind: '$books'
    // }
])


/*
before $unwind
[
  {
    _id: 'Dante',
    books: [
      { _id: 8751, title: 'The Banquet', author: 'Dante', copies: 2 },
      { _id: 8752, title: 'Divine Comedy', author: 'Dante', copies: 1 },
      { _id: 8845, title: 'Eclogues', author: 'Dante', copies: 2 }
    ],
    totalCopies: 5
  },
  {
    _id: 'Homer',
    books: [
      { _id: 7000, title: 'The Odyssey', author: 'Homer', copies: 10 },
      { _id: 7020, title: 'Iliad', author: 'Homer', copies: 10 }
    ],
    totalCopies: 20
  }
]

after $unwind
[
    {
      _id: 'Dante',
      books: { _id: 8751, title: 'The Banquet', author: 'Dante', copies: 2 },
      totalCopies: 5
    },
    {
      _id: 'Dante',
      books: { _id: 8752, title: 'Divine Comedy', author: 'Dante', copies: 1 },
      totalCopies: 5
    },
    {
      _id: 'Dante',
      books: { _id: 8845, title: 'Eclogues', author: 'Dante', copies: 2 },
      totalCopies: 5
    },
    {
      _id: 'Homer',
      books: { _id: 7000, title: 'The Odyssey', author: 'Homer', copies: 10 },
      totalCopies: 20
    },
    {
      _id: 'Homer',
      books: { _id: 7020, title: 'Iliad', author: 'Homer', copies: 10 },
      totalCopies: 20
    }
  ]
*/

// use sample_airbnb

// $sample stage
// 실행할 때마다 다른 데이터를 가져옴
db.listingsAndReviews.aggregate([
    {
        $sample: {size: 3} // 많은 데이터 중 3개만 샘플링으로 가져오기
    },
    {
        $project: { // 가져온 데이터 프로젝션
            name: 1,
            summary: 1
        }
    }
])

// $skip, $limit stage
db.listingsAndReviews.aggregate([
    {
        $match: {
            property_type: 'Apartment'
        },
    },
    {
        $sort: {
            number_of_reviews: -1
        }
    },
    {
        $skip: 0 // offset
    },
    {
        $limit: 5
    },
    {
        $project: { 
            name: 1,
            number_of_reviews: 1
        }
    }
])

// use test

// $out stage : 새로운 컬렉션에 데이터 담음
db.books.aggregate([
    {
        $group: {
            _id: '$author',
            books: {$push: '$title'}
        }
    },
    {
        $out: 'authors'
    }
])
/*
db.authors.find() 결과
[
    {
      _id: 'Dante',
      books: [ 'The Banquet', 'Divine Comedy', 'Eclogues' ]
    },
    { _id: 'Homer', books: [ 'The Odyssey', 'Iliad' ] }
  ]
*/