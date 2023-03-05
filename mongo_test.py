import pymongo
import certifi

# 실행 전 <password> 바꾸기
password = 20982098
conn = f"mongodb+srv://kym9129:{password}@cluster0.xhpozmz.mongodb.net/?retryWrites=true&w=majority"
client = pymongo.MongoClient(conn, tlsCAFile=certifi.where())
db = client.word # word라는 데이터베이스 연결
db.abc.insert_one({"abc": 1})
print(db.abc.find_one({"abc": 1}))
