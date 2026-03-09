# 📚 Plataforma de Planejamento de Estudos

Um sistema web interativo focado na organização pessoal, gerenciamento de tarefas e anotações rápidas. Desenvolvido no modelo Serverless (*Backend as a Service*) para ajudar estudantes a manterem o foco e a produtividade através de uma interface moderna e um backend robusto em nuvem.

## ✨ Funcionalidades

- **🔐 Autenticação de Usuários:** Sistema de registro, login e gerenciamento de sessões nativos utilizando Autenticação Supabase.
- **✅ Gestão de Tarefas (CRUD):** Adicione, liste, conclua ou remova tarefas atreladas diretamente ao seu usuário.
- **📌 Mural de Post-its Interativo:** Uma tela de anotações no formato "Drag and Drop" (arrastar e soltar). As coordenadas (X e Y) de cada post-it são salvas automaticamente no servidor em tempo real, garantindo que suas notas fiquem de forma responsiva onde você as deixou.
- **🚪 Logout Seguro:** Encerramento seguro através da comunicação validada com o Supabase.

## 🛠️ Tecnologias Utilizadas

**Front-end:**
- HTML5
- CSS3 (Estilização responsiva, custom gradients, e posicionamento absoluto para elementos interativos)
- JavaScript Vanilla (Manipulação avançada do DOM e Eventos de Drag & Drop)

**Back-end & Banco de Dados (BaaS):**
- **[Supabase](https://supabase.com/)**
- Banco de dados **PostgreSQL** em nuvem
- Supabase-js integrado via CDN (Operações e Queries diretas do client-side)
- RLS (*Row Level Security*) para assegurar que os usuários vejam apenas os próprios dados.

> **Nota:** Anteriormente, o backend do projeto era rodado localmente usando Python (FastAPI) e SQLite. A pasta `_backend_arquivado_python` ainda mantém os arquivos legados apenas para registro histórico. O projeto foi modernizado para ser 100% hospedável staticamente (Github Pages, Vercel, Netlify).

## 🚀 Como rodar este projeto 

Como o projeto agora é totalmente focado no Front-end e integrado a uma API em nuvem, não é necessária a instalação de um servidor local.

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Guxtaa12/Planejamento-de-Estudos.git
   ```

2. **Abra a aplicação:**
   - Navegue até a pasta `frontend`.
   - Basta dar um duplo clique no arquivo `index.html` ou utilizar extensões como o **Live Server** (do VS Code) para abrir no navegador de sua preferência.

3. **Comece a usar:**
   - Crie uma conta no menu de Registrar.
   - Entre no painel de estudos e teste a criação de tarefas e as anotações visuais dinâmicas!
