# app.py - Flask Backend with MongoDB
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime
import jwt
from functools import wraps
import os
from dotenv import load_dotenv
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from openpyxl import Workbook

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Configuration
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/streamline_db')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')

mongo = PyMongo(app)

# Token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    
    # Check if user exists
    if mongo.db.users.find_one({'email': email}):
        return jsonify({'message': 'User already exists'}), 400
    
    # Create user
    hashed_password = generate_password_hash(password)
    user_id = mongo.db.users.insert_one({
        'email': email,
        'password': hashed_password,
        'created_at': datetime.utcnow()
    }).inserted_id
    
    # Generate token
    token = jwt.encode({
        'user_id': str(user_id)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'User created successfully',
        'token': token,
        'user': {
            'id': str(user_id),
            'email': email
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    
    user = mongo.db.users.find_one({'email': email})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': str(user['_id'])
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': str(user['_id']),
            'email': user['email']
        }
    }), 200

# Todo Routes
@app.route('/api/todos', methods=['GET'])
@token_required
def get_todos(current_user):
    todos = list(mongo.db.todos.find({'user_id': str(current_user['_id'])}))
    
    # Convert ObjectId to string
    for todo in todos:
        todo['_id'] = str(todo['_id'])
        todo['created_at'] = todo['created_at'].isoformat()
    
    return jsonify(todos), 200

@app.route('/api/todos', methods=['POST'])
@token_required
def create_todo(current_user):
    data = request.get_json()
    
    todo = {
        'text': data.get('text'),
        'completed': False,
        'priority': data.get('priority', 'medium'),
        'category': data.get('category', 'personal'),
        'user_id': str(current_user['_id']),
        'created_at': datetime.utcnow()
    }
    
    result = mongo.db.todos.insert_one(todo)
    todo['_id'] = str(result.inserted_id)
    todo['created_at'] = todo['created_at'].isoformat()
    
    return jsonify(todo), 201

@app.route('/api/todos/<todo_id>', methods=['PUT'])
@token_required
def update_todo(current_user, todo_id):
    data = request.get_json()
    
    # Verify todo belongs to user
    todo = mongo.db.todos.find_one({
        '_id': ObjectId(todo_id),
        'user_id': str(current_user['_id'])
    })
    
    if not todo:
        return jsonify({'message': 'Todo not found'}), 404
    
    update_data = {}
    if 'text' in data:
        update_data['text'] = data['text']
    if 'completed' in data:
        update_data['completed'] = data['completed']
    if 'priority' in data:
        update_data['priority'] = data['priority']
    if 'category' in data:
        update_data['category'] = data['category']
    
    mongo.db.todos.update_one(
        {'_id': ObjectId(todo_id)},
        {'$set': update_data}
    )
    
    return jsonify({'message': 'Todo updated successfully'}), 200

@app.route('/api/todos/<todo_id>', methods=['DELETE'])
@token_required
def delete_todo(current_user, todo_id):
    result = mongo.db.todos.delete_one({
        '_id': ObjectId(todo_id),
        'user_id': str(current_user['_id'])
    })
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Todo not found'}), 404
    
    # Delete associated comments
    mongo.db.comments.delete_many({'todo_id': todo_id})
    
    return jsonify({'message': 'Todo deleted successfully'}), 200

# Get single todo with details
@app.route('/api/todos/<todo_id>', methods=['GET'])
@token_required
def get_todo(current_user, todo_id):
    todo = mongo.db.todos.find_one({
        '_id': ObjectId(todo_id),
        'user_id': str(current_user['_id'])
    })
    
    if not todo:
        return jsonify({'message': 'Todo not found'}), 404
    
    todo['_id'] = str(todo['_id'])
    todo['created_at'] = todo['created_at'].isoformat()
    
    return jsonify(todo), 200

# Comment Routes
@app.route('/api/todos/<todo_id>/comments', methods=['GET'])
@token_required
def get_comments(current_user, todo_id):
    # Verify todo belongs to user
    todo = mongo.db.todos.find_one({
        '_id': ObjectId(todo_id),
        'user_id': str(current_user['_id'])
    })
    
    if not todo:
        return jsonify({'message': 'Todo not found'}), 404
    
    comments = list(mongo.db.comments.find({'todo_id': todo_id}).sort('created_at', -1))
    
    for comment in comments:
        comment['_id'] = str(comment['_id'])
        comment['created_at'] = comment['created_at'].isoformat()
    
    return jsonify(comments), 200

@app.route('/api/todos/<todo_id>/comments', methods=['POST'])
@token_required
def add_comment(current_user, todo_id):
    # Verify todo belongs to user
    todo = mongo.db.todos.find_one({
        '_id': ObjectId(todo_id),
        'user_id': str(current_user['_id'])
    })
    
    if not todo:
        return jsonify({'message': 'Todo not found'}), 404
    
    data = request.get_json()
    
    comment = {
        'todo_id': todo_id,
        'text': data.get('text'),
        'user_email': current_user['email'],
        'created_at': datetime.utcnow()
    }
    
    result = mongo.db.comments.insert_one(comment)
    comment['_id'] = str(result.inserted_id)
    comment['created_at'] = comment['created_at'].isoformat()
    
    return jsonify(comment), 201

@app.route('/api/todos/<todo_id>/comments/<comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, todo_id, comment_id):
    result = mongo.db.comments.delete_one({
        '_id': ObjectId(comment_id),
        'todo_id': todo_id
    })
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Comment not found'}), 404
    
    return jsonify({'message': 'Comment deleted successfully'}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

# Export to PDF
@app.route('/api/export/pdf', methods=['GET'])
@token_required
def export_pdf(current_user):
    todos = list(mongo.db.todos.find({'user_id': str(current_user['_id'])}))
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    elements.append(Paragraph("To Do App - Task List", styles['Title']))
    elements.append(Spacer(1, 20))
    
    # Table data
    data = [['Task', 'Category', 'Priority', 'Status', 'Created']]
    for todo in todos:
        status = '✓ Done' if todo.get('completed') else 'Pending'
        created = todo['created_at'].strftime('%Y-%m-%d') if isinstance(todo['created_at'], datetime) else str(todo['created_at'])[:10]
        data.append([
            todo.get('text', '')[:50],
            todo.get('category', 'personal'),
            todo.get('priority', 'medium'),
            status,
            created
        ])
    
    # Create table
    table = Table(data, colWidths=[200, 80, 70, 70, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name='todos.pdf')

# Export to Excel
@app.route('/api/export/excel', methods=['GET'])
@token_required
def export_excel(current_user):
    todos = list(mongo.db.todos.find({'user_id': str(current_user['_id'])}))
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Todos"
    
    # Headers
    headers = ['Task', 'Category', 'Priority', 'Status', 'Created Date']
    ws.append(headers)
    
    # Style headers
    for col in range(1, 6):
        ws.cell(row=1, column=col).font = ws.cell(row=1, column=col).font.copy(bold=True)
    
    # Data
    for todo in todos:
        status = 'Completed' if todo.get('completed') else 'Pending'
        created = todo['created_at'].strftime('%Y-%m-%d') if isinstance(todo['created_at'], datetime) else str(todo['created_at'])[:10]
        ws.append([
            todo.get('text', ''),
            todo.get('category', 'personal'),
            todo.get('priority', 'medium'),
            status,
            created
        ])
    
    # Adjust column widths
    ws.column_dimensions['A'].width = 40
    ws.column_dimensions['B'].width = 15
    ws.column_dimensions['C'].width = 12
    ws.column_dimensions['D'].width = 12
    ws.column_dimensions['E'].width = 15
    
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return send_file(buffer, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                     as_attachment=True, download_name='todos.xlsx')

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Streamline API is running'}), 200

# For Vercel serverless
app = app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)