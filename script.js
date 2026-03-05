// ==========================================
// FUNÇÕES DE COMUNICAÇÃO COM A API (PYTHON)
// ==========================================

async function registrarUsuario(event) {
    event.preventDefault();

    // Pega os três valores separados agora
    const inputNomeRegistro = document.getElementById('registrar-nome').value.trim();
    const inputEmailRegistro = document.getElementById('registrar-email').value.trim();
    const inputSenhaRegistro = document.getElementById('registrar-senha').value;
    const registerMessage = document.getElementById('register-message');

    // Validação simples para ver se nenhum dos três está vazio
    if (!inputNomeRegistro || !inputEmailRegistro || !inputSenhaRegistro) {
        if (registerMessage) {
            registerMessage.textContent = 'Por favor, preencha todos os campos.';
            registerMessage.className = 'mensagem erro';
            registerMessage.style.display = 'block';
        }
        return;
    }

    // Monta o pacote certinho para o Python
    const dadosUsuario = {
        nome: inputNomeRegistro,
        email: inputEmailRegistro,
        senha: inputSenhaRegistro
    };

    try {
        const resposta = await fetch('http://127.0.0.1:8000/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosUsuario)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            if (registerMessage) {
                registerMessage.textContent = 'Registro realizado com sucesso! Você será redirecionado.';
                registerMessage.className = 'mensagem sucesso';
                registerMessage.style.color = '#28a745';
                registerMessage.style.display = 'block';
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            if (registerMessage) {
                registerMessage.textContent = 'Erro: ' + resultado.erro;
                registerMessage.className = 'mensagem erro';
                registerMessage.style.color = '#dc3545';
                registerMessage.style.display = 'block';
            }
        }
    } catch (erro) {
        console.error('Erro:', erro);
        if (registerMessage) {
            registerMessage.textContent = 'Erro ao conectar com o servidor Python.';
            registerMessage.className = 'mensagem erro';
            registerMessage.style.color = '#dc3545';
            registerMessage.style.display = 'block';
        }
    }
}

async function fazerLogin(event) {
    event.preventDefault();

    const emailOuUsuario = document.getElementById('login-usuario').value.trim();
    const senhaDigitada = document.getElementById('login-senha').value;
    const mensagemTexto = document.getElementById('login-error-message');

    if (!emailOuUsuario || !senhaDigitada) {
        if (mensagemTexto) {
            mensagemTexto.textContent = 'Por favor, preencha usuário e senha.';
            mensagemTexto.style.display = 'block';
            mensagemTexto.style.color = '#dc3545';
        }
        return;
    }

    const dadosLogin = {
        usuario: emailOuUsuario,

        senha: senhaDigitada
    };

    try {
        const resposta = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLogin)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
            // Salva na sessão que o usuário logou com sucesso (para o botão de logout funcionar)
            sessionStorage.setItem('loggedInUser', resultado.nome);

            if (mensagemTexto) {
                mensagemTexto.style.color = '#28a745';
                mensagemTexto.style.display = 'block';
                mensagemTexto.textContent = 'Bem-vindo, ' + resultado.nome + '! Entrando...';
            }
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            if (mensagemTexto) {
                mensagemTexto.style.color = '#dc3545';
                mensagemTexto.style.display = 'block';
                mensagemTexto.textContent = 'Erro: Usuário ou senha incorretos!';
            }
        }
    } catch (erro) {
        console.error('Erro:', erro);
        if (mensagemTexto) {
            mensagemTexto.style.color = '#dc3545';
            mensagemTexto.style.display = 'block';
            mensagemTexto.textContent = 'Erro ao conectar com o servidor.';
        }
    }
}


// ==========================================
// EVENTOS DA PÁGINA (DOM CARREGADO)
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // --- Lógica de Registro ---
    const formRegistrar = document.getElementById('form-registrar');
    if (formRegistrar) {
        formRegistrar.addEventListener('submit', registrarUsuario);
    }

    // --- Lógica de Login ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', fazerLogin);
    }

    // --- Lógica de Logout ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });
    }

    // ===============================================================
    // TUDO ABAIXO DAQUI É SOBRE TAREFAS, ANOTAÇÕES E FEEDBACK
    // ===============================================================

    // --- Funções Utilitárias para LocalStorage ---
    function getTarefasSalvas() {
        const tarefasJson = localStorage.getItem('minhasTarefas');
        return tarefasJson ? JSON.parse(tarefasJson) : [];
    }

    function salvarTarefas(tarefas) {
        const tarefasJson = JSON.stringify(tarefas);
        localStorage.setItem('minhasTarefas', tarefasJson);
    }

    // --- Lógica da Página: Adicionar Tarefa ---
    const formTarefa = document.getElementById('form-tarefa');
    const inputNomeTarefa = document.getElementById('nome-tarefa');
    const inputPrazoTarefa = document.getElementById('prazo-tarefa');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    if (formTarefa) {
        formTarefa.addEventListener('submit', function (evento) {
            evento.preventDefault(); 
            const nome = inputNomeTarefa.value.trim();
            const prazo = inputPrazoTarefa.value;

            if (nome) {
                const novaTarefa = {
                    id: Date.now(),
                    nome: nome,
                    prazo: prazo,
                    concluida: false
                };

                const tarefas = getTarefasSalvas();
                tarefas.push(novaTarefa);
                salvarTarefas(tarefas);

                inputNomeTarefa.value = '';
                inputPrazoTarefa.value = '';

                if (mensagemSucesso) {
                    mensagemSucesso.textContent = 'Tarefa adicionada com sucesso!';
                    mensagemSucesso.style.display = 'block';
                    setTimeout(() => {
                        mensagemSucesso.style.display = 'none';
                    }, 3000); 
                }
                inputNomeTarefa.focus(); 
            } else {
                alert('Por favor, digite o nome da tarefa.');
            }
        });
    }

    // --- Lógica da Página: Cronograma/Lista de Tarefas ---
    const listaTarefasUl = document.getElementById('lista-tarefas');
    const semTarefasMsg = document.getElementById('sem-tarefas-mensagem');

    if (listaTarefasUl) {
        function criarElementoTarefa(tarefa) {
            const li = document.createElement('li');
            li.setAttribute('data-id', tarefa.id); 
            if (tarefa.concluida) {
                li.classList.add('concluida'); 
            }

            const spanNome = document.createElement('span');
            spanNome.textContent = tarefa.nome;

            const spanPrazo = document.createElement('span');
            spanPrazo.classList.add('prazo');
            if (tarefa.prazo) {
                try {
                    const dataObj = new Date(tarefa.prazo + 'T00:00:00');
                    const dia = String(dataObj.getDate()).padStart(2, '0');
                    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                    const ano = dataObj.getFullYear();
                    spanPrazo.textContent = `Prazo: ${dia}/${mes}/${ano}`;
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                    spanPrazo.textContent = `Prazo: ${tarefa.prazo}`; 
                }
            } else {
                spanPrazo.textContent = 'Sem prazo';
            }

            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-delete');
            btnRemover.addEventListener('click', function () {
                const confirmado = window.confirm(`Tem certeza que deseja remover a tarefa "${tarefa.nome}"?`);
                if (confirmado) {
                    removerTarefa(tarefa.id); 
                    li.remove();              
                    verificarListaVazia();    
                }
            });

            const checkboxConcluir = document.createElement('input');
            checkboxConcluir.type = 'checkbox';
            checkboxConcluir.checked = tarefa.concluida;
            checkboxConcluir.addEventListener('change', function () {
                marcarComoConcluida(tarefa.id, checkboxConcluir.checked);
                li.classList.toggle('concluida', checkboxConcluir.checked);
            });
            li.prepend(checkboxConcluir); 

            li.appendChild(spanNome);
            li.appendChild(spanPrazo);
            li.appendChild(btnRemover);

            return li;
        }

        function carregarTarefas() {
            listaTarefasUl.innerHTML = ''; 
            const tarefas = getTarefasSalvas();

            if (tarefas.length === 0) {
                if (semTarefasMsg) semTarefasMsg.style.display = 'block';
            } else {
                if (semTarefasMsg) semTarefasMsg.style.display = 'none';
                tarefas.forEach(tarefa => {
                    const elementoTarefa = criarElementoTarefa(tarefa);
                    listaTarefasUl.appendChild(elementoTarefa);
                });
                verificarPrazos(); 
            }
        }

        function removerTarefa(id) {
            let tarefas = getTarefasSalvas();
            tarefas = tarefas.filter(tarefa => tarefa.id !== id);
            salvarTarefas(tarefas); 
        }

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

        function verificarListaVazia() {
            const totalTarefas = listaTarefasUl.children.length;
            if (semTarefasMsg) {
                semTarefasMsg.style.display = totalTarefas === 0 ? 'block' : 'none';
            }
        }

        function verificarPrazos() {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const itensTarefa = listaTarefasUl.querySelectorAll('li');
            itensTarefa.forEach(item => {
                const id = parseInt(item.getAttribute('data-id')); 
                const tarefas = getTarefasSalvas();
                const tarefa = tarefas.find(t => t.id === id); 

                item.classList.remove('prazo-proximo', 'prazo-vencido');
                const spanPrazo = item.querySelector('.prazo');
                if (spanPrazo && spanPrazo.textContent.includes(' (')) {
                    spanPrazo.textContent = spanPrazo.textContent.substring(0, spanPrazo.textContent.indexOf(' ('));
                }

                if (tarefa && tarefa.prazo && !tarefa.concluida) { 
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
                        console.error("Erro ao verificar prazo:", e);
                    }
                }
            });
        }

        carregarTarefas();
    }

    // --- Lógica da Página: Anotações ---
    const NOTAS_STORAGE_KEY = 'minhasAnotacoesArray'; 
    const textAreaNovaAnotacao = document.getElementById('texto-anotacoes');
    const btnAddAnotacao = document.getElementById('btn-add-anotacao');
    const listaAnotacoesSalvasUl = document.getElementById('lista-anotacoes-salvas');
    const mensagemAnotacaoAdicionada = document.getElementById('anotacao-add-message');
    const mensagemSemAnotacoes = document.getElementById('sem-anotacoes-mensagem');

    function getAnotacoesSalvas() {
        const notasJson = localStorage.getItem(NOTAS_STORAGE_KEY);
        try {
            return notasJson ? JSON.parse(notasJson) : [];
        } catch (e) {
            return [];
        }
    }

    function salvarAnotacoes(anotacoesArray) {
        if (!Array.isArray(anotacoesArray)) return;
        localStorage.setItem(NOTAS_STORAGE_KEY, JSON.stringify(anotacoesArray));
    }

    function criarElementoAnotacao(anotacao) {
        const li = document.createElement('li');
        li.setAttribute('data-id', anotacao.id); 

        const textoEl = document.createElement('p'); 
        textoEl.textContent = anotacao.texto;
        textoEl.classList.add('anotacao-texto'); 

        const actionsEl = document.createElement('div');
        actionsEl.classList.add('anotacao-actions');

        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'Apagar';
        btnRemover.classList.add('btn-delete-nota'); 
        btnRemover.addEventListener('click', function () {
            const confirmado = window.confirm(`Tem certeza que deseja apagar esta anotação?`);
            if (confirmado) {
                removerAnotacao(anotacao.id); 
                li.remove();                  
                verificarListaAnotacoesVazia(); 
            }
        });

        actionsEl.appendChild(btnRemover); 
        li.appendChild(textoEl);         
        li.appendChild(actionsEl);       

        return li;
    }

    function carregarAnotacoesSalvas() {
        if (!listaAnotacoesSalvasUl) return; 

        listaAnotacoesSalvasUl.innerHTML = ''; 
        const anotacoes = getAnotacoesSalvas();

        if (anotacoes.length > 0) {
            anotacoes.forEach(anotacao => {
                const elementoLi = criarElementoAnotacao(anotacao);
                listaAnotacoesSalvasUl.appendChild(elementoLi);
            });
        }
        verificarListaAnotacoesVazia(); 
    }

    function verificarListaAnotacoesVazia() {
        if (!mensagemSemAnotacoes || !listaAnotacoesSalvasUl) return;
        const totalAnotacoes = listaAnotacoesSalvasUl.children.length;
        mensagemSemAnotacoes.style.display = totalAnotacoes === 0 ? 'block' : 'none';
    }

    function removerAnotacao(id) {
        let anotacoes = getAnotacoesSalvas();
        anotacoes = anotacoes.filter(anotacao => anotacao.id !== id);
        salvarAnotacoes(anotacoes);
    }

    if (textAreaNovaAnotacao && btnAddAnotacao && listaAnotacoesSalvasUl) {
        carregarAnotacoesSalvas();

        btnAddAnotacao.addEventListener('click', function () {
            const texto = textAreaNovaAnotacao.value.trim();

            if (texto) {
                const novaAnotacao = {
                    id: Date.now(), 
                    texto: texto
                };

                const anotacoesAtuais = getAnotacoesSalvas();
                anotacoesAtuais.push(novaAnotacao);
                salvarAnotacoes(anotacoesAtuais);

                const novoElementoLi = criarElementoAnotacao(novaAnotacao);
                listaAnotacoesSalvasUl.appendChild(novoElementoLi);
                verificarListaAnotacoesVazia(); 

                textAreaNovaAnotacao.value = '';

                if (mensagemAnotacaoAdicionada) {
                    mensagemAnotacaoAdicionada.textContent = 'Anotação adicionada!';
                    mensagemAnotacaoAdicionada.style.display = 'block';
                    setTimeout(() => {
                        mensagemAnotacaoAdicionada.style.display = 'none';
                    }, 2500);
                }
                textAreaNovaAnotacao.focus(); 
            } else {
                alert('Por favor, digite algo na anotação.');
            }
        });
    }

    // --- Lógica da Página: Feedback ---
    const formFeedback = document.getElementById('form-feedback');
    const mensagemSucessoFeedback = document.getElementById('mensagem-sucesso-feedback');

    if (formFeedback) {
        formFeedback.addEventListener('submit', function (evento) {
            evento.preventDefault(); 
            console.log('Feedback enviado!'); 
            mensagemSucessoFeedback.textContent = 'Feedback enviado com sucesso! Você será redirecionado.';
            mensagemSucessoFeedback.style.display = 'block';
            setTimeout(() => {
                mensagemSucessoFeedback.style.display = 'none';
                window.location.href = 'home.html';
            }, 3000); 
        });
    }
});