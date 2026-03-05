import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

conexao = sqlite3.connect("banco.db", check_same_thread=False)
cursor = conexao.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE,
        senha TEXT
    )
""")
conexao.commit()

class Usuario(BaseModel):
    nome: str
    email: str
    senha: str

@app.post("/registrar")
def registrar_usuario(user: Usuario):
    try:
        cursor.execute("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", 
                       (user.nome, user.email, user.senha))
        conexao.commit()
        return {"mensagem": "Usuário criado com sucesso!"}
    except sqlite3.IntegrityError:
        return {"erro": "E-mail já cadastrado."}

from fastapi import HTTPException

# Criamos um "molde" para os dados que vêm do ecrã de login
class LoginData(BaseModel):
    usuario: str
    senha: str

@app.post("/login")
def fazer_login(login: LoginData):
    # Procura no banco de dados se existe alguma linha com este email E esta palavra-passe
    cursor.execute("SELECT * FROM usuarios WHERE (email = ? OR nome = ?) AND senha = ?", (login.usuario, login.senha))
    usuario_encontrado = cursor.fetchone()

    # Se a variável tiver dados, o login está correto
    if usuario_encontrado:
        # usuario_encontrado[1] é a coluna do "nome" na nossa base de dados
        return {"mensagem": "Login aprovado!", "nome": usuario_encontrado[1]}
    else:
        # Se não encontrou, devolve um erro 401 (Não Autorizado)
        raise HTTPException(status_code=401, detail="Utilizador ou palavra-passe incorretos.")



# ==========================================
# ROTAS DE ADMINISTRAÇÃO
# ==========================================

# Rota para listar todos os usuários cadastrados
@app.get("/usuarios")
def listar_usuarios():
    # Busca todo mundo, mas NÃO traz as senhas por segurança
    cursor.execute("SELECT id, nome, email FROM usuarios")
    usuarios_banco = cursor.fetchall()
    
    # Transforma o resultado do banco em uma lista que o JavaScript entende
    lista_usuarios = []
    for usuario in usuarios_banco:
        lista_usuarios.append({
            "id": usuario[0],
            "nome": usuario[1],
            "email": usuario[2]
        })
        
    return lista_usuarios

# Rota para deletar um usuário pelo ID dele
@app.delete("/usuarios/{usuario_id}")
def deletar_usuario(usuario_id: int):
    # Deleta a linha onde o ID for igual ao ID passado
    cursor.execute("DELETE FROM usuarios WHERE id = ?", (usuario_id,))
    conexao.commit()
    
    return {"mensagem": "Usuário removido com sucesso do banco de dados!"}