from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'  # 设置一个安全的密钥
db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class GameResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    score = db.Column(db.Integer, default=0)
    result = db.Column(db.String(10), nullable=False)  # 'success' 或 'failure'
    user = db.relationship('User', backref=db.backref('results', lazy=True))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    print(f"Register request received: {data}")  # 调试信息
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], password=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        print(f"Registered user: {new_user}")  # 调试信息
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Error registering user: {e}")  # 调试信息
        db.session.rollback()
        return jsonify({'message': 'Registration failed'}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print(f"Login request received: {data}")  # 调试信息
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        session['user_id'] = user.id
        print(f"Logged in user: {user}")  # 调试信息
        return jsonify({'message': 'Login successful', 'user_id': user.id}), 200
    else:
        print("Invalid credentials")  # 调试信息
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    print("User logged out")  # 调试信息
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/players/scores', methods=['PUT'])
def update_score():
    data = request.get_json()
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'message': 'Not authenticated'}), 401
    
    game_result = GameResult(user_id=user_id, score=data['score'], result='success')
    db.session.add(game_result)
    db.session.commit()
    print(f"Updated player score: {game_result}")  # 调试信息
    return jsonify({'message': 'Score updated successfully'})

@app.route('/record_failure', methods=['POST'])
def record_failure():
    data = request.get_json()
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'message': 'Not authenticated'}), 401
    
    game_result = GameResult(user_id=user_id, score=data['score'], result='failure')
    db.session.add(game_result)
    db.session.commit()
    print(f"Recorded failure: {game_result}")  # 调试信息
    return jsonify({'message': 'Failure recorded successfully'})

@app.route('/users/<int:user_id>/results', methods=['GET'])
def get_user_results(user_id):
    user = User.query.get_or_404(user_id)
    results = [{'score': result.score, 'result': result.result} for result in user.results.order_by(GameResult.id.desc())]
    print(f"Retrieved results for user: {user}")  # 调试信息
    return jsonify(results)

@app.route('/get_user', methods=['GET'])
def get_user():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        return jsonify({
            'id': user.id,
            'username': user.username
        })
    else:
        return jsonify({})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)



