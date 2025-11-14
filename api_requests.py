import requests
from flask import Flask
from utils import calculate_submission_date

app = Flask(__name__)

@app.route('/')
def get_list_of_challenges():
    id_arr = [
        "5208f99aee097e6552000148",
        "515de9ae9dcfc28eb6000001",
        "559a28007caad2ac4e000083",
        "556deca17c58da83c00002db",
        "529adbf7533b761c560004e5",
        "522551eee9abb932420004a0",
        "558fc85d8fd1938afb000014",
        "5541f58a944b85ce6d00006a",
        "546e2562b03326a88e000020",
        "523f5d21c841566fde000009",
    ]
    challenges_storage = []
    for id in id_arr:
        response = requests.get(
            f"https://www.codewars.com/api/v1/code-challenges/{id}"
        )
        response_json = response.json()
        submission_time = calculate_submission_date()
        result = {
            "name": response_json["name"],
            "description": response_json["description"],
            "category": response_json["category"],
            "languages": response_json["languages"],
            "submission_time": submission_time
        }
        challenges_storage.append(result)
    return challenges_storage

if __name__ == "__main__":
    app.run(debug=True)