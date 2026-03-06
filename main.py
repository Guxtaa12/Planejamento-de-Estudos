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
    cursor.execute("SELECT * FROM usuarios WHERE (email = ? OR nome = ?) AND senha = ?", (login.usuario, login.usuario, login.senha))
    usuario_encontrado = cursor.fetchone()

    # Se a variável tiver dados, o login está correto
    if usuario_encontrado:
        # usuario_encontrado[1] é a coluna do "nome" na nossa base de dados
        return {
            "mensagem": "Login aprovado!",
            "nome": usuario_encontrado[1],
            "id": usuario_encontrado[0]
        }
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

# --- TABELA DE TAREFAS ---
cursor.execute("""
    CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        nome TEXT,
        prazo TEXT,
        concluida BOOLEAN
    )
""")
conexao.commit()

# --- MODELO DA TAREFA ---
class Tarefa(BaseModel):
    usuario_id: int
    nome: str
    prazo: str
    concluida: bool = False

# --- ROTAS DE TAREFAS ---

# 1. Adicionar nova tarefa
@app.post("/tarefas")
def adicionar_tarefa(tarefa: Tarefa):
    cursor.execute("INSERT INTO tarefas (usuario_id, nome, prazo, concluida) VALUES (?, ?, ?, ?)", 
                   (tarefa.usuario_id, tarefa.nome, tarefa.prazo, tarefa.concluida))
    conexao.commit()
    return {"mensagem": "Tarefa salva com sucesso!"}

# 2. Listar tarefas de um usuário específico
@app.get("/tarefas/{usuario_id}")
def listar_tarefas(usuario_id: int):
    cursor.execute("SELECT * FROM tarefas WHERE usuario_id = ?", (usuario_id,))
    tarefas_banco = cursor.fetchall()
    
    lista = []
    for t in tarefas_banco:
        lista.append({
            "id": t[0],
            "usuario_id": t[1],
            "nome": t[2],
            "prazo": t[3],
            "concluida": bool(t[4])
        })
    return lista

# 3. Deletar tarefa
@app.delete("/tarefas/{tarefa_id}")
def deletar_tarefa(tarefa_id: int):
    cursor.execute("DELETE FROM tarefas WHERE id = ?", (tarefa_id,))
    conexao.commit()
    return {"mensagem": "Tarefa deletada!"}

# 4. Marcar como concluída/pendente
class AtualizarStatus(BaseModel):
    concluida: bool

@app.put("/tarefas/{tarefa_id}/status")
def atualizar_status(tarefa_id: int, status: AtualizarStatus):
    cursor.execute("UPDATE tarefas SET concluida = ? WHERE id = ?", (status.concluida, tarefa_id))
    conexao.commit()
    return {"mensagem": "Status atualizado!"}

# ==========================================
# ROTAS DE ANOTAÇÕES (POST-ITS)
# ==========================================

# 1. Cria a tabela de anotações com as posições X e Y
cursor.execute("""
    CREATE TABLE IF NOT EXISTS anotacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        texto TEXT,
        pos_x INTEGER,
        pos_y INTEGER
    )
""")
conexao.commit()

# 2. Modelos de dados
class Anotacao(BaseModel):
    usuario_id: int
    texto: str
    pos_x: int = 50 # Posição inicial padrão
    pos_y: int = 50 # Posição inicial padrão

class PosicaoAnotacao(BaseModel):
    pos_x: int
    pos_y: int

# 3. Rota para criar nova anotação
@app.post("/anotacoes")
def adicionar_anotacao(nota: Anotacao):
    cursor.execute("INSERT INTO anotacoes (usuario_id, texto, pos_x, pos_y) VALUES (?, ?, ?, ?)", 
                   (nota.usuario_id, nota.texto, nota.pos_x, nota.pos_y))
    conexao.commit()
    return {"mensagem": "Anotação criada!"}

# 4. Rota para listar as anotações do usuário
@app.get("/anotacoes/{usuario_id}")
def listar_anotacoes(usuario_id: int):
    cursor.execute("SELECT * FROM anotacoes WHERE usuario_id = ?", (usuario_id,))
    notas_banco = cursor.fetchall()
    
    lista = []
    for n in notas_banco:
        lista.append({
            "id": n[0],
            "usuario_id": n[1],
            "texto": n[2],
            "pos_x": n[3],
            "pos_y": n[4]
        })
    return lista

# 5. Rota para ATUALIZAR A POSIÇÃO quando você arrastar e soltar
@app.put("/anotacoes/{anotacao_id}/posicao")
def atualizar_posicao(anotacao_id: int, posicao: PosicaoAnotacao):
    cursor.execute("UPDATE anotacoes SET pos_x = ?, pos_y = ? WHERE id = ?", 
                   (posicao.pos_x, posicao.pos_y, anotacao_id))
    conexao.commit()
    return {"mensagem": "Posição salva com sucesso!"}

# 6. Rota para deletar anotação
@app.delete("/anotacoes/{anotacao_id}")
def deletar_anotacao(anotacao_id: int):
    cursor.execute("DELETE FROM anotacoes WHERE id = ?", (anotacao_id,))
    conexao.commit()
    return {"mensagem": "Anotação deletada!"}