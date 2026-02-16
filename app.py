import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, send_from_directory, send_file
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import sqlite3
import pandas as pd

import pathlib

from reportlab.pdfgen import canvas
from io import BytesIO

# Configuração do app Flask
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data/database.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_PERMANENT'] = False

# CORS
CORS(app, supports_credentials=True)

# Diretórios necessários
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
REPORTS_DIR = os.path.join(BASE_DIR, 'reports')

for d in [DATA_DIR, REPORTS_DIR]:
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

# Banco de dados
db = SQLAlchemy(app)

# Sessão
Session(app)

# Login manager
login_manager = LoginManager()
login_manager.init_app(app)

# Modelo de usuário
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    theme = db.Column(db.String(20), default="light")  # claro/escuro

# Modelo Medicamento
class Medicamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    nome = db.Column(db.String(120), nullable=False)
    dosagem = db.Column(db.String(120), nullable=False)
    frequencia = db.Column(db.String(120), nullable=False)
    administracoes = db.relationship('Administracao', backref='medicamento', lazy=True)

class Administracao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    medicamento_id = db.Column(db.Integer, db.ForeignKey('medicamento.id'))
    data_hora = db.Column(db.String(32), nullable=False)
    dose = db.Column(db.String(64), nullable=False)

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Rotas iniciais de autenticação (mínimas)
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Usuário já existe'}), 409
    user = User(username=username, password=password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username, password=password).first()
    if user:
        login_user(user)
        return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username, 'theme': user.theme}})
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True})

@app.route('/api/profile', methods=['GET'])
@login_required
def profile():
    user = current_user
    return jsonify({'id': user.id, 'username': user.username, 'theme': user.theme})

# SPA root
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Servir arquivos estáticos (JS, CSS, imagens)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Relatórios (PDF)
@app.route('/api/relatorio', methods=['GET'])
@login_required
def gerar_relatorio():
    meds = Medicamento.query.filter_by(user_id=current_user.id).all()
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer)
    pdf.drawString(100, 800, f"Relatório de Medicamentos - Usuário: {current_user.username}")
    y = 780
    for m in meds:
        pdf.drawString(100, y, f"Medicamento: {m.nome}, Dosagem: {m.dosagem}, Freq: {m.frequencia}")
        y -= 20
        adms = Administracao.query.filter_by(medicamento_id=m.id).all()
        for a in adms:
            pdf.drawString(120, y, f" - {a.data_hora}: {a.dose}")
            y -= 15
    pdf.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="relatorio_medicamentos.pdf", mimetype="application/pdf")

# Atualização de perfil (tema)
@app.route('/api/profile', methods=['PUT'])
@login_required
def atualizar_perfil():
    data = request.json
    if 'theme' in data:
        current_user.theme = data['theme']
        db.session.commit()
    return jsonify({'success': True})

# CRUD Medicamentos

@app.route('/api/medicamentos', methods=['GET'])
@login_required
def listar_medicamentos():
    meds = Medicamento.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': m.id, 'nome': m.nome, 'dosagem': m.dosagem, 'frequencia': m.frequencia} for m in meds])

@app.route('/api/medicamentos', methods=['POST'])
@login_required
def adicionar_medicamento():
    data = request.json
    m = Medicamento(
        user_id=current_user.id,
        nome=data['nome'],
        dosagem=data['dosagem'],
        frequencia=data['frequencia']
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'success': True, 'id': m.id})

@app.route('/api/medicamentos/<int:mid>', methods=['DELETE'])
@login_required
def deletar_medicamento(mid):
    m = Medicamento.query.filter_by(id=mid, user_id=current_user.id).first()
    if not m:
        return jsonify({'error': 'Medicamento não encontrado'}), 404
    db.session.delete(m)
    db.session.commit()
    return jsonify({'success': True})

# Administração de doses

@app.route('/api/administracoes', methods=['POST'])
@login_required
def registrar_administracao():
    data = request.json
    adm = Administracao(
        medicamento_id=data['medicamento_id'],
        data_hora=data['data_hora'],
        dose=data['dose']
    )
    db.session.add(adm)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/administracoes/<int:medicamento_id>', methods=['GET'])
@login_required
def listar_administracoes(medicamento_id):
    adms = Administracao.query.filter_by(medicamento_id=medicamento_id).all()
    return jsonify([
        {'id': a.id, 'medicamento_id': a.medicamento_id, 'data_hora': a.data_hora, 'dose': a.dose}
        for a in adms
    ])

# Relatórios (PDF) já implementado acima

# Atualização de perfil (tema) já implementado acima