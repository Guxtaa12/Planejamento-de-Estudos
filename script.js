// Executa quando o DOM (estrutura HTML) estiver totalmente carregado
document.addEventListener('DOMContentLoaded', function () {

    // --- Funções Utilitárias para Usuários (localStorage - INSEGURO!) ---
    const USER_STORAGE_KEY = 'plataformaUsuarios'; // Chave para guardar usuários

    // Pega usuários do localStorage (INSEGURO)
    function getUsuariosRegistrados() {
        const usuariosJson = localStorage.getItem(USER_STORAGE_KEY);
        return usuariosJson ? JSON.parse(usuariosJson) : {}; // Retorna um objeto
    }

    // Salva usuários no localStorage (INSEGURO)
    function salvarUsuarios(usuarios) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarios));
        console.log('Usuários salvos com sucesso!');
        registerMessage.textContent = 'Registro realizado com sucesso! Você será redirecionado.';
        registerMessage.className = 'mensagem sucesso'; // Adiciona classe de sucesso
        registerMessage.style.display = 'block';

        // Exibe a mensagem de sucesso por 5 segundos
        setTimeout(() => {
            registerMessage.style.display = 'none';
            // Poderia redirecionar para o login: 
            window.location.href = 'login.html';
        }, 3000); // = 3 segundos
    }





    // --- Lógica da Página: Registro (registrar.html) ---
    const formRegistrar = document.getElementById('form-registrar');
    const inputUsuarioRegistro = document.getElementById('registrar-usuario');
    const inputSenhaRegistro = document.getElementById('registrar-senha');
    const registerMessage = document.getElementById('register-message');

    if (formRegistrar) {
        formRegistrar.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = inputUsuarioRegistro.value.trim();
            const password = inputSenhaRegistro.value; // NÃO FAÇA HASH AQUI (ainda inseguro)

            if (!username || !password) {
                if (registerMessage) {
                    registerMessage.textContent = 'Por favor, preencha todos os campos.';
                    registerMessage.className = 'mensagem erro'; // Adiciona classe de erro
                    registerMessage.style.display = 'block';
                }
                return;
            }

            const usuarios = getUsuariosRegistrados();

            // Verifica se o usuário já existe (simples verificação por chave)
            if (usuarios[username]) {
                if (registerMessage) {
                    registerMessage.textContent = 'Este nome de usuário já está em uso.';
                    registerMessage.className = 'mensagem erro';
                    registerMessage.style.display = 'block';
                }
            } else {
                // Adiciona o novo usuário (INSEGURO - senha em texto plano)
                usuarios[username] = password;
                // Salva os usuários no localStorage
                salvarUsuarios(usuarios);




                // Limpa o formulário
                inputUsuarioRegistro.value = '';
                inputSenhaRegistro.value = '';

            }
        });
    }

    // --- Lógica da Página: Login (login.html) ---
    const formLogin = document.getElementById('form-login');
    const inputUsuarioLogin = document.getElementById('login-usuario');
    const inputSenhaLogin = document.getElementById('login-senha');
    const loginErrorMessage = document.getElementById('login-error-message');

    if (formLogin) {
        formLogin.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = inputUsuarioLogin.value.trim();
            const password = inputSenhaLogin.value;

            if (!username || !password) {
                if (loginErrorMessage) {
                    loginErrorMessage.textContent = 'Por favor, preencha usuário e senha.';
                    loginErrorMessage.style.display = 'block';
                }
                return;
            }

            const usuarios = getUsuariosRegistrados();

            // Verifica se usuário existe e se a senha bate (INSEGURO)
            if (usuarios[username] && usuarios[username] === password) {
                // Login bem-sucedido!
                // Salva o nome do usuário na sessionStorage para indicar que está logado NESSA SESSÃO
                sessionStorage.setItem('loggedInUser', username);
                // Redireciona para a página principal
                window.location.href = 'home.html';
            } else {
                // Login falhou
                if (loginErrorMessage) {
                    loginErrorMessage.textContent = 'Usuário ou senha inválidos.';
                    loginErrorMessage.style.display = 'block';
                }
                // Limpa campo senha por segurança (mínima)
                inputSenhaLogin.value = '';
            }
        });
    }

    // --- Lógica de Logout (para todas as páginas protegidas) ---
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            // Remove o indicador de usuário logado da sessionStorage
            sessionStorage.removeItem('loggedInUser');
            // Redireciona para a página de login
            window.location.href = 'login.html';
        });

        // Opcional: Mostrar o nome do usuário logado em algum lugar
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        // Exemplo: adicionar um span no header para mostrar `Bem-vindo, ${loggedInUser}`
    }


    // --- Funções Utilitárias para LocalStorage ---

    // Função para buscar tarefas do localStorage
    function getTarefasSalvas() {
        const tarefasJson = localStorage.getItem('minhasTarefas');
        // Se não houver nada, retorna um array vazio
        // Se houver, converte o JSON de volta para um array/objeto JavaScript
        return tarefasJson ? JSON.parse(tarefasJson) : [];
    }

    // Função para salvar tarefas no localStorage
    function salvarTarefas(tarefas) {
        // Converte o array/objeto JavaScript para uma string JSON
        const tarefasJson = JSON.stringify(tarefas);
        // Salva a string no localStorage com a chave 'minhasTarefas'
        localStorage.setItem('minhasTarefas', tarefasJson);
    }

    // --- Lógica da Página: Adicionar Tarefa (adicionar-tarefa.html) ---

    const formTarefa = document.getElementById('form-tarefa');
    const inputNomeTarefa = document.getElementById('nome-tarefa');
    const inputPrazoTarefa = document.getElementById('prazo-tarefa');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    // Só adiciona o listener se o formulário existir nesta página
    if (formTarefa) {
        formTarefa.addEventListener('submit', function (evento) {
            evento.preventDefault(); // Impede o recarregamento da página

            const nome = inputNomeTarefa.value.trim();
            const prazo = inputPrazoTarefa.value;

            if (nome) {
                // Cria um objeto para a nova tarefa com um ID único (timestamp)
                const novaTarefa = {
                    id: Date.now(), // ID único baseado no tempo atual
                    nome: nome,
                    prazo: prazo,
                    concluida: false // Adiciona um status inicial
                };

                // Busca as tarefas já existentes
                const tarefas = getTarefasSalvas();
                // Adiciona a nova tarefa ao array
                tarefas.push(novaTarefa);
                // Salva o array atualizado de volta no localStorage
                salvarTarefas(tarefas);

                // Limpa o formulário
                inputNomeTarefa.value = '';
                inputPrazoTarefa.value = '';

                // Mostra mensagem de sucesso
                if (mensagemSucesso) {
                    mensagemSucesso.textContent = 'Tarefa adicionada com sucesso!';
                    mensagemSucesso.style.display = 'block';
                    // Esconde a mensagem após alguns segundos
                    setTimeout(() => {
                        mensagemSucesso.style.display = 'none';
                    }, 3000); // 3 segundos
                }

                inputNomeTarefa.focus(); // Foca no campo nome novamente

            } else {
                alert('Por favor, digite o nome da tarefa.');
            }
        });
    }

    // --- Lógica da Página: Cronograma/Lista de Tarefas (cronograma.html) ---

    const listaTarefasUl = document.getElementById('lista-tarefas');
    const semTarefasMsg = document.getElementById('sem-tarefas-mensagem');

    // Só executa se a lista <ul> existir nesta página
    if (listaTarefasUl) {
        // Função para criar o elemento HTML (<li>) de uma tarefa
        function criarElementoTarefa(tarefa) {
            const li = document.createElement('li');
            li.setAttribute('data-id', tarefa.id); // Guarda o ID no elemento
            if (tarefa.concluida) {
                li.classList.add('concluida'); // Adicionar classe se já estiver concluída
            }

            const spanNome = document.createElement('span');
            spanNome.textContent = tarefa.nome;

            const spanPrazo = document.createElement('span');
            spanPrazo.classList.add('prazo');
            if (tarefa.prazo) {
                try {
                    // Formata a data (dd/mm/aaaa) - Cuidado com fuso!
                    const dataObj = new Date(tarefa.prazo + 'T00:00:00');
                    const dia = String(dataObj.getDate()).padStart(2, '0');
                    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                    const ano = dataObj.getFullYear();
                    spanPrazo.textContent = `Prazo: ${dia}/${mes}/${ano}`;
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                    spanPrazo.textContent = `Prazo: ${tarefa.prazo}`; // Fallback
                }
            } else {
                spanPrazo.textContent = 'Sem prazo';
            }

            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-delete');
            btnRemover.addEventListener('click', function () {
                // --- Início da Modificação ---

                // 1. Monta a mensagem de confirmação (incluindo o nome da tarefa)
                const nomeTarefaParaConfirmar = tarefa.nome; // 'tarefa' está acessível aqui
                const mensagemConfirmacao = `Tem certeza que deseja remover a tarefa "${nomeTarefaParaConfirmar}"?`;

                // 2. Exibe a caixa de diálogo nativa do navegador
                const confirmado = window.confirm(mensagemConfirmacao);

                // 3. Verifica se o usuário clicou em "OK" (confirmado será true)
                if (confirmado) {
                    // Se confirmado, executa a lógica de remoção original:
                    removerTarefa(tarefa.id); // Remove do localStorage
                    li.remove();              // Remove o elemento <li> da tela
                    verificarListaVazia();    // Atualiza a mensagem se a lista ficar vazia
                }
                // Se o usuário clicar em "Cancelar" (confirmado será false), nada acontece.

            });

            // Adicionar botão/checkbox para marcar como concluída (opcional)
            const checkboxConcluir = document.createElement('input');
            checkboxConcluir.type = 'checkbox';
            checkboxConcluir.checked = tarefa.concluida;
            checkboxConcluir.addEventListener('change', function () {
                marcarComoConcluida(tarefa.id, checkboxConcluir.checked);
                li.classList.toggle('concluida', checkboxConcluir.checked);
            });
            li.prepend(checkboxConcluir); // Adiciona no início do <li>

            li.appendChild(spanNome);
            li.appendChild(spanPrazo);
            li.appendChild(btnRemover);

            if (tarefa.concluida) {
                li.classList.add('concluida');
            }
            return li;
        }

        // Função para carregar e exibir as tarefas do localStorage
        function carregarTarefas() {
            listaTarefasUl.innerHTML = ''; // Limpa a lista atual antes de recarregar
            const tarefas = getTarefasSalvas();

            if (tarefas.length === 0) {
                if (semTarefasMsg) semTarefasMsg.style.display = 'block';
            } else {
                if (semTarefasMsg) semTarefasMsg.style.display = 'none';
                tarefas.forEach(tarefa => {
                    const elementoTarefa = criarElementoTarefa(tarefa);
                    listaTarefasUl.appendChild(elementoTarefa);
                });
                verificarPrazos(); // Aplica estilo de prazo após carregar
            }
        }

        // Função para remover uma tarefa pelo ID
        function removerTarefa(id) {
            let tarefas = getTarefasSalvas();
            // Filtra o array, mantendo apenas as tarefas com ID diferente
            tarefas = tarefas.filter(tarefa => tarefa.id !== id);
            salvarTarefas(tarefas); // Salva o array filtrado
        }

        // Função para marcar como concluída (requer CSS para .concluida)
        function marcarComoConcluida(id, estado) {
            let tarefas = getTarefasSalvas();
            tarefas = tarefas.map(tarefa => {
                if (tarefa.id === id) {
                    return { ...tarefa, concluida: estado };
                }
                return tarefa;
            });
            salvarTarefas(tarefas);
        }

        // Função para verificar se a lista está vazia e mostrar mensagem
        function verificarListaVazia() {
            const totalTarefas = listaTarefasUl.children.length;
            if (semTarefasMsg) {
                semTarefasMsg.style.display = totalTarefas === 0 ? 'block' : 'none';
            }
        }

        // Função de verificação de prazos (adaptada)
        function verificarPrazos() {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const itensTarefa = listaTarefasUl.querySelectorAll('li');
            itensTarefa.forEach(item => {
                const id = parseInt(item.getAttribute('data-id')); // Pega o ID
                const tarefas = getTarefasSalvas();
                const tarefa = tarefas.find(t => t.id === id); // Encontra a tarefa original

                // Limpa classes e texto adicional antes de reavaliar
                item.classList.remove('prazo-proximo', 'prazo-vencido');
                const spanPrazo = item.querySelector('.prazo');
                if (spanPrazo && spanPrazo.textContent.includes(' (')) {
                    spanPrazo.textContent = spanPrazo.textContent.substring(0, spanPrazo.textContent.indexOf(' ('));
                }


                if (tarefa && tarefa.prazo && !tarefa.concluida) { // Só verifica se tem prazo e não está concluída
                    try {
                        const dataPrazo = new Date(tarefa.prazo + 'T00:00:00');
                        dataPrazo.setHours(0, 0, 0, 0);

                        const diffTime = dataPrazo - hoje;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays < 0) {
                            item.classList.add('prazo-vencido');
                            if (spanPrazo) spanPrazo.textContent += " (Vencida!)";
                        } else if (diffDays <= 3) {
                            item.classList.add('prazo-proximo');
                            if (spanPrazo) spanPrazo.textContent += ` (Faltam ${diffDays} dias)`;
                        }
                    } catch (e) {
                        console.error("Erro ao verificar prazo da tarefa ID:", id, e);
                    }
                }
            });
        }


        // Carrega as tarefas quando a página 'cronograma.html' é carregada
        carregarTarefas();
    }


    // --- Lógica da Página: Anotações (anotacoes.html) ---

    const NOTAS_STORAGE_KEY = 'minhasAnotacoesArray'; // Nova chave para o array de notas
    const textAreaNovaAnotacao = document.getElementById('texto-anotacoes');
    const btnAddAnotacao = document.getElementById('btn-add-anotacao');
    const listaAnotacoesSalvasUl = document.getElementById('lista-anotacoes-salvas');
    const mensagemAnotacaoAdicionada = document.getElementById('anotacao-add-message');
    const mensagemSemAnotacoes = document.getElementById('sem-anotacoes-mensagem');

    // --- Funções Utilitárias para Anotações (Array) ---

    function getAnotacoesSalvas() {
        const notasJson = localStorage.getItem(NOTAS_STORAGE_KEY);
        try {
            // Tenta parsear, se falhar ou for nulo, retorna array vazio
            return notasJson ? JSON.parse(notasJson) : [];
        } catch (e) {
            console.error("Erro ao parsear anotações do localStorage:", e);
            return [];
        }
    }

    function salvarAnotacoes(anotacoesArray) {
        // Garante que sempre salva um array
        if (!Array.isArray(anotacoesArray)) {
            console.error("Tentativa de salvar algo que não é um array em anotações.");
            return;
        }
        localStorage.setItem(NOTAS_STORAGE_KEY, JSON.stringify(anotacoesArray));
    }

    // --- Funções de Manipulação do DOM para Anotações ---

    function criarElementoAnotacao(anotacao) {
        const li = document.createElement('li');
        li.setAttribute('data-id', anotacao.id); // Guarda o ID no elemento

        // Elemento para o texto da anotação (usando <p> ou <span>)
        const textoEl = document.createElement('p'); // Usar <p> para semântica
        textoEl.textContent = anotacao.texto;
        textoEl.classList.add('anotacao-texto'); // Classe para aplicar white-space: pre-wrap

        // Container para ações (botão de remover)
        const actionsEl = document.createElement('div');
        actionsEl.classList.add('anotacao-actions');

        // Botão de remover
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'Apagar';
        btnRemover.classList.add('btn-delete-nota'); // Classe específica
        btnRemover.addEventListener('click', function () {
            // Confirmação antes de apagar
            const confirmado = window.confirm(`Tem certeza que deseja apagar esta anotação?`);
            if (confirmado) {
                removerAnotacao(anotacao.id); // Remove do localStorage
                li.remove();                  // Remove o <li> da tela
                verificarListaAnotacoesVazia(); // Atualiza mensagem se necessário
            }
        });

        actionsEl.appendChild(btnRemover); // Adiciona botão ao container de ações
        li.appendChild(textoEl);         // Adiciona texto ao <li>
        li.appendChild(actionsEl);       // Adiciona ações (botão) ao <li>

        return li;
    }

    // Função para carregar e exibir todas as anotações salvas
    function carregarAnotacoesSalvas() {
        if (!listaAnotacoesSalvasUl) return; // Sai se a lista não existir na página

        listaAnotacoesSalvasUl.innerHTML = ''; // Limpa a lista atual
        const anotacoes = getAnotacoesSalvas();

        if (anotacoes.length > 0) {
            anotacoes.forEach(anotacao => {
                const elementoLi = criarElementoAnotacao(anotacao);
                listaAnotacoesSalvasUl.appendChild(elementoLi);
            });
        }
        verificarListaAnotacoesVazia(); // Mostra/esconde mensagem de lista vazia
    }

    // Função para verificar e mostrar/ocultar mensagem de lista vazia
    function verificarListaAnotacoesVazia() {
        if (!mensagemSemAnotacoes || !listaAnotacoesSalvasUl) return;
        const totalAnotacoes = listaAnotacoesSalvasUl.children.length;
        mensagemSemAnotacoes.style.display = totalAnotacoes === 0 ? 'block' : 'none';
    }

    // Função para remover anotação do localStorage pelo ID
    function removerAnotacao(id) {
        let anotacoes = getAnotacoesSalvas();
        anotacoes = anotacoes.filter(anotacao => anotacao.id !== id);
        salvarAnotacoes(anotacoes);
    }


    // --- Lógica Principal da Página de Anotações ---

    // Só executa se os elementos principais da página de anotações existirem
    if (textAreaNovaAnotacao && btnAddAnotacao && listaAnotacoesSalvasUl) {

        // 1. Carrega as anotações existentes ao abrir a página
        carregarAnotacoesSalvas();

        // 2. Listener para o botão "Adicionar Anotação"
        btnAddAnotacao.addEventListener('click', function () {
            const texto = textAreaNovaAnotacao.value.trim();

            if (texto) {
                // Cria o objeto da nova anotação
                const novaAnotacao = {
                    id: Date.now(), // ID único baseado no timestamp
                    texto: texto
                };

                // Adiciona ao array e salva no localStorage
                const anotacoesAtuais = getAnotacoesSalvas();
                anotacoesAtuais.push(novaAnotacao);
                salvarAnotacoes(anotacoesAtuais);

                // Adiciona a nova anotação DIRETAMENTE à lista na tela (mais eficiente que recarregar tudo)
                const novoElementoLi = criarElementoAnotacao(novaAnotacao);
                listaAnotacoesSalvasUl.appendChild(novoElementoLi);
                verificarListaAnotacoesVazia(); // Esconde a mensagem de lista vazia, se aplicável

                // Limpa o textarea
                textAreaNovaAnotacao.value = '';

                // Feedback visual (opcional)
                if (mensagemAnotacaoAdicionada) {
                    mensagemAnotacaoAdicionada.textContent = 'Anotação adicionada!';
                    mensagemAnotacaoAdicionada.style.display = 'block';
                    setTimeout(() => {
                        mensagemAnotacaoAdicionada.style.display = 'none';
                    }, 2500);
                }

                textAreaNovaAnotacao.focus(); // Foca no textarea novamente

            } else {
                alert('Por favor, digite algo na anotação.');
            }
        });
    }

    const formFeedback = document.getElementById('form-feedback');
    const mensagemSucessoFeedback = document.getElementById('mensagem-sucesso-feedback');

    if (formFeedback) {
        formFeedback.addEventListener('submit', function (evento) {
            evento.preventDefault(); // Impede o recarregamento da página
            console.log('Feedback enviado!'); // Simula envio de feedback
            // Mostra mensagem de sucesso
            mensagemSucessoFeedback.textContent = 'Feedback enviado com sucesso! Você será redirecionado.';
            mensagemSucessoFeedback.style.display = 'block';
            // Esconde a mensagem após alguns segundos
            setTimeout(() => {
                mensagemSucessoFeedback.style.display = 'none';
                window.location.href = 'home.html';
            }, 3000); // 3 segundos

        });
    }


}); // Fim do 'DOMContentLoaded'
