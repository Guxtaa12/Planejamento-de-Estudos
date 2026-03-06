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
            sessionStorage.setItem('userId', resultado.id);

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
            mensagemTexto.textContent = 'Erro: falha na conexão.';
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
            // Confirmação rápida pra evitar clique sem querer
            const confirmar = window.confirm("Tem certeza que deseja sair da sua conta?");
            
            if (confirmar) {
                // Limpa o ID e o Nome que estavam salvos no navegador
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('loggedInUser');
                
                // Redireciona para a página de login
                window.location.href = 'login.html';
            }
        });
    }
    // ===============================================================
    // TUDO ABAIXO DAQUI É SOBRE TAREFAS, ANOTAÇÕES E FEEDBACK
    // ===============================================================

    // ===============================================================
    // NOVA LÓGICA DE TAREFAS (CONECTADA AO BANCO DE DADOS)
    // ===============================================================

    // Pega o ID do usuário que fez o login
    const userId = sessionStorage.getItem('userId');

    // --- Lógica da Página: Adicionar Tarefa ---
    const formTarefa = document.getElementById('form-tarefa');
    const inputNomeTarefa = document.getElementById('nome-tarefa');
    const inputPrazoTarefa = document.getElementById('prazo-tarefa');
    const mensagemSucesso = document.getElementById('mensagem-sucesso');

    if (formTarefa) {
        formTarefa.addEventListener('submit', async function (evento) {
            evento.preventDefault(); 
            const nome = inputNomeTarefa.value.trim();
            const prazo = inputPrazoTarefa.value;

            // Bloqueio de segurança: se não tem ID, não deixa criar tarefa
            if (!userId) {
                alert('Você precisa estar logado para adicionar tarefas!');
                window.location.href = 'login.html';
                return;
            }

            if (nome) {
                // Monta a tarefa com o ID do usuário para o Python saber de quem é
                const novaTarefa = {
                    usuario_id: parseInt(userId),
                    nome: nome,
                    prazo: prazo || "", 
                    concluida: false
                };

                try {
                    // Manda para a nossa nova rota no Python
                    const resposta = await fetch('http://127.0.0.1:8000/tarefas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novaTarefa)
                    });

                    if (resposta.ok) {
                        inputNomeTarefa.value = '';
                        inputPrazoTarefa.value = '';

                        if (mensagemSucesso) {
                            mensagemSucesso.textContent = 'Tarefa salva no banco de dados!';
                            mensagemSucesso.style.display = 'block';
                            setTimeout(() => {
                                mensagemSucesso.style.display = 'none';
                            }, 3000); 
                        }
                        inputNomeTarefa.focus(); 
                    }
                } catch (erro) {
                    console.error('Erro ao salvar tarefa:', erro);
                    alert('Erro: falha na conexão.');
                }
            } else {
                alert('Por favor, digite o nome da tarefa.');
            }
        });
    }

    // --- Lógica da Página: Cronograma/Lista de Tarefas ---
    const listaTarefasUl = document.getElementById('lista-tarefas');
    const semTarefasMsg = document.getElementById('sem-tarefas-mensagem');

    if (listaTarefasUl) {
        
        async function carregarTarefasDoBanco() {
            if (!userId) return; // Se não estiver logado, nem tenta buscar

            listaTarefasUl.innerHTML = '<li style="text-align: center;">Carregando suas tarefas...</li>'; 

            try {
                // Busca as tarefas específicas desse usuário
                const resposta = await fetch(`http://127.0.0.1:8000/tarefas/${userId}`);
                const tarefas = await resposta.json();

                listaTarefasUl.innerHTML = ''; 

                if (tarefas.length === 0) {
                    if (semTarefasMsg) semTarefasMsg.style.display = 'block';
                } else {
                    if (semTarefasMsg) semTarefasMsg.style.display = 'none';
                    tarefas.forEach(tarefa => {
                        const elementoTarefa = criarElementoTarefa(tarefa);
                        listaTarefasUl.appendChild(elementoTarefa);
                    });
                    verificarPrazosBanco(tarefas); 
                }
            } catch (erro) {
                console.error('Erro ao buscar tarefas:', erro);
                listaTarefasUl.innerHTML = '<li style="color: #dc3545; text-align: center;">Erro ao carregar as tarefas.</li>';
            }
        }

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
                    spanPrazo.textContent = `Prazo: ${tarefa.prazo}`; 
                }
            } else {
                spanPrazo.textContent = 'Sem prazo';
            }

            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.classList.add('btn-delete');
            btnRemover.addEventListener('click', async function () {
                const confirmado = window.confirm(`Tem certeza que deseja remover a tarefa "${tarefa.nome}"?`);
                if (confirmado) {
                    try {
                        // Avisa o Python para deletar
                        await fetch(`http://127.0.0.1:8000/tarefas/${tarefa.id}`, { method: 'DELETE' });
                        li.remove();              
                        verificarListaVazia(); 
                    } catch (erro) {
                        alert("Erro ao apagar tarefa no banco de dados.");
                    }   
                }
            });

            const checkboxConcluir = document.createElement('input');
            checkboxConcluir.type = 'checkbox';
            checkboxConcluir.checked = tarefa.concluida;
            checkboxConcluir.addEventListener('change', async function () {
                try {
                    // Avisa o Python que o status mudou (Put)
                    await fetch(`http://127.0.0.1:8000/tarefas/${tarefa.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ concluida: checkboxConcluir.checked })
                    });
                    li.classList.toggle('concluida', checkboxConcluir.checked);
                } catch (erro) {
                    alert("Erro ao atualizar o status da tarefa.");
                    checkboxConcluir.checked = !checkboxConcluir.checked; // Reverte o botão se der erro
                }
            });
            
            li.prepend(checkboxConcluir); 
            li.appendChild(spanNome);
            li.appendChild(spanPrazo);
            li.appendChild(btnRemover);

            return li;
        }

        function verificarListaVazia() {
            const totalTarefas = listaTarefasUl.children.length;
            if (semTarefasMsg) {
                semTarefasMsg.style.display = totalTarefas === 0 ? 'block' : 'none';
            }
        }

        function verificarPrazosBanco(tarefas) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const itensTarefa = listaTarefasUl.querySelectorAll('li');
            itensTarefa.forEach(item => {
                const id = parseInt(item.getAttribute('data-id')); 
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
        carregarTarefasDoBanco();
    }

    // ===============================================================
    // LÓGICA DE ANOTAÇÕES (POST-ITS ARRASTÁVEIS NO BANCO DE DADOS)
    // ===============================================================

    const quadroAnotacoes = document.getElementById('quadro-anotacoes');
    const formAnotacao = document.getElementById('form-anotacao');
    const inputTextoAnotacao = document.getElementById('texto-anotacao');

    // Variáveis para controlar o movimento do mouse
    let notaSendoArrastada = null;
    let offsetX = 0;
    let offsetY = 0;

    if (quadroAnotacoes) {

        // 1. Busca as notas do banco e coloca na tela
        async function carregarAnotacoesDoBanco() {
            if (!userId) return;
            quadroAnotacoes.innerHTML = ''; 
            
            try {
                const resposta = await fetch(`http://127.0.0.1:8000/anotacoes/${userId}`);
                const notas = await resposta.json();
                notas.forEach(nota => criarPostItVisual(nota));
            } catch (erro) {
                console.error('Erro ao buscar notas:', erro);
            }
        }

        // 2. Cria o Post-it visualmente
        function criarPostItVisual(nota) {
            const div = document.createElement('div');
            div.className = 'post-it';
            div.setAttribute('data-id', nota.id);
            
            // Define a posição EXATA que veio do banco de dados!
            div.style.left = nota.pos_x + 'px';
            div.style.top = nota.pos_y + 'px';

            const texto = document.createElement('p');
            texto.textContent = nota.texto;
            texto.style.marginTop = '10px';

            const btnApagar = document.createElement('button');
            btnApagar.className = 'btn-apagar-nota';
            btnApagar.textContent = 'X';
            btnApagar.onclick = async function() {
                if(confirm('Apagar este Post-it?')) {
                    await fetch(`http://127.0.0.1:8000/anotacoes/${nota.id}`, { method: 'DELETE' });
                    div.remove();
                }
            };

            div.appendChild(btnApagar);
            div.appendChild(texto);
            quadroAnotacoes.appendChild(div);

            // --- EVENTO: Clicar e Segurar (Mouse Down) ---
            div.addEventListener('mousedown', function(e) {
                if (e.target.tagName === 'BUTTON') return; // Se clicou no 'X', não arrasta
                
                notaSendoArrastada = div;
                // Calcula onde você clicou dentro da nota
                offsetX = e.clientX - div.getBoundingClientRect().left;
                offsetY = e.clientY - div.getBoundingClientRect().top;
                div.style.zIndex = 1000; // Joga a nota pra frente das outras
            });
        }

        // --- EVENTO: Mover o Mouse pela Tela (Mouse Move) ---
        document.addEventListener('mousemove', function(e) {
            if (notaSendoArrastada) {
                const quadroRect = quadroAnotacoes.getBoundingClientRect();
                
                // Calcula a nova posição baseada no movimento do mouse
                let novaPosX = e.clientX - quadroRect.left - offsetX;
                let novaPosY = e.clientY - quadroRect.top - offsetY;

                notaSendoArrastada.style.left = novaPosX + 'px';
                notaSendoArrastada.style.top = novaPosY + 'px';
            }
        });

        // --- EVENTO: Soltar o Botão do Mouse (Mouse Up) ---
        document.addEventListener('mouseup', async function() {
            if (notaSendoArrastada) {
                notaSendoArrastada.style.zIndex = 1; // Volta ao normal
                
                const idNota = notaSendoArrastada.getAttribute('data-id');
                const posXFinal = parseInt(notaSendoArrastada.style.left) || 0;
                const posYFinal = parseInt(notaSendoArrastada.style.top) || 0;

                try {
                    // Manda a posição final para o Python salvar no banco
                    await fetch(`http://127.0.0.1:8000/anotacoes/${idNota}/posicao`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pos_x: posXFinal, pos_y: posYFinal })
                    });
                } catch (erro) {
                    console.error('Erro ao salvar posição:', erro);
                }

                notaSendoArrastada = null; // Soltou a nota
            }
        });

        // 3. Adicionar nova nota
        if (formAnotacao) {
            formAnotacao.addEventListener('submit', async function(e) {
                e.preventDefault();
                const texto = inputTextoAnotacao.value.trim();
                if (!texto || !userId) return;

                const novaNota = {
                    usuario_id: parseInt(userId),
                    texto: texto,
                    pos_x: 50, // Posição inicial padrão quando nasce
                    pos_y: 50  // Posição inicial padrão quando nasce
                };

                try {
                    const resposta = await fetch('http://127.0.0.1:8000/anotacoes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novaNota)
                    });
                    if (resposta.ok) {
                        inputTextoAnotacao.value = '';
                        carregarAnotacoesDoBanco(); // Atualiza a tela
                    }
                } catch (erro) {
                    console.error('Erro ao criar anotação:', erro);
                }
            });
        }

        // Puxa as notas assim que abrir a página
        carregarAnotacoesDoBanco();
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