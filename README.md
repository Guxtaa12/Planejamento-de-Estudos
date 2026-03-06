# 📚 Plataforma de Planejamento de Estudos

Um sistema full-stack interativo focado na organização pessoal, gerenciamento de tarefas e anotações rápidas. Desenvolvido para ajudar estudantes a manterem o foco e a produtividade através de uma interface moderna e um backend robusto.

## ✨ Funcionalidades

- **🔐 Autenticação de Usuários:** Sistema de registro e login com validação de dados e controle de sessão (`sessionStorage`).
- **✅ Gestão de Tarefas (CRUD):** Adicione, liste, conclua ou remova tarefas. As tarefas são vinculadas exclusivamente ao usuário logado, garantindo privacidade.
- **📌 Mural de Post-its Interativo:** Uma tela de anotações no formato "Drag and Drop" (arrastar e soltar). As coordenadas (X e Y) de cada post-it são salvas em tempo real no banco de dados, garantindo que suas notas fiquem exatamente onde você as deixou, mesmo após deslogar.
- **🚪 Logout Seguro:** Encerramento de sessão com limpeza de cache e confirmação de segurança.

## 🛠️ Tecnologias Utilizadas

**Front-end:**
- HTML5
- CSS3 (Estilização responsiva e posicionamento absoluto para elementos interativos)
- JavaScript Vanilla (Manipulação do DOM, Eventos de Drag & Drop, API Fetch)

**Back-end:**
- Python 3
- FastAPI (Criação das rotas RESTful)
- Uvicorn (Servidor ASGI)
- Pydantic (Validação de dados)

**Banco de Dados:**
- SQLite (Banco de dados relacional leve e integrado)

## 🚀 Como rodar este projeto na sua máquina

### Pré-requisitos
Certifique-se de ter o [Python](https://www.python.org/downloads/) instalado na sua máquina.

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/Guxtaa12/Planejamento-de-Estudos.git](https://github.com/Guxtaa12/Planejamento-de-Estudos.git)
