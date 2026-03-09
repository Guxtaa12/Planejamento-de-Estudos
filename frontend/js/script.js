// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = 'https://afpxmcevtdocppbnbhfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcHhtY2V2dGRvY3BwYm5iaGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjg2NDQsImV4cCI6MjA4ODY0NDY0NH0.7ZsnZlCj5qX6PTO0V-eiP4vysO73ww75VoY5jLt0WMM';
// Usar var previne o erro "Identifier already declared" em páginas em que o script é re-injetado
var supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// FUNÇÕES DE COMUNICAÇÃO COM A API (SUPABASE)
// ==========================================

async function registrarUsuario(event) {
    event.preventDefault();

    // Pega os três valores separados agora
    const inputNomeRegistro = document.getElementById('registrar-nome').value.trim();
    const inputEmailRegistro = document.getElementById('registrar-email').value.trim();
    const inputSenhaRegistro = document.getElementById('registrar-senha').value;
    const registerMessage = document.getElementById('register-message');

    if (!inputNomeRegistro || !inputEmailRegistro || !inputSenhaRegistro) {
        if (registerMessage) {
            registerMessage.textContent = 'Por favor, preencha todos os campos.';
            registerMessage.className = 'mensagem erro';
            registerMessage.style.display = 'block';
        }
        return;
    }

    // Supabase Auth: signUp (O Supabase não salva "nome" de usuário primário por default,
    // usamos o email como chave, e o nome fica salvo nos metadados).
    try {
        const { data, error } = await supabase.auth.signUp({
            email: inputEmailRegistro,
            password: inputSenhaRegistro,
            options: {
                data: {
                    display_name: inputNomeRegistro
                }
            }
        });

        if (error) throw error;

        if (registerMessage) {
            registerMessage.textContent = 'Registro realizado com sucesso! Você será redirecionado.';
            registerMessage.className = 'mensagem sucesso';
            registerMessage.style.color = '#28a745';
            registerMessage.style.display = 'block';
        }
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (erro) {
        console.error('Erro no registro Supabase:', erro.message);
        if (registerMessage) {
            registerMessage.textContent = 'Erro: ' + erro.message;
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

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailOuUsuario,
            password: senhaDigitada
        });

        if (error) throw error;

        // Pega o nome do usuário dos metadados
        const nomeUsuario = data.user.user_metadata.display_name || 'Usuário';

        // Salva na sessão (embora o Supabase gerencie a sessão automaticamente, mantemos compatibilidade com o layout)
        sessionStorage.setItem('loggedInUser', nomeUsuario);
        sessionStorage.setItem('userId', data.user.id); // O Supabase usa UUID

        if (mensagemTexto) {
            mensagemTexto.style.color = '#28a745';
            mensagemTexto.style.display = 'block';
            mensagemTexto.textContent = 'Bem-vindo, ' + nomeUsuario + '! Entrando...';
        }
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);

    } catch (erro) {
        console.error('Erro de login Supabase:', erro.message);
        if (mensagemTexto) {
            mensagemTexto.style.color = '#dc3545';
            mensagemTexto.style.display = 'block';
            mensagemTexto.textContent = 'Erro: Usuário ou senha incorretos.';
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
        btnLogout.addEventListener('click', async function () {
            const confirmar = window.confirm("Tem certeza que deseja sair da sua conta?");
            
            if (confirmar) {
                await supabase.auth.signOut();
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('loggedInUser');
                
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
                // Monta a tarefa com o ID do usuário para o Supabase saber de quem é
                const novaTarefa = {
                    user_id: userId,
                    nome: nome,
                    prazo: prazo || null, 
                    concluida: false
                };

                try {
                    // Manda para o Supabase
                    const { error } = await supabase
                        .from('tarefas')
                        .insert([novaTarefa]);

                    if (error) throw error;

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
                } catch (erro) {
                    console.error('Erro ao salvar tarefa:', erro.message);
                    alert('Erro ao salvar a tarefa no banco.');
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
                // Busca as tarefas específicas desse usuário no Supabase
                const { data: tarefas, error } = await supabase
                    .from('tarefas')
                    .select('*')
                    .order('prazo', { ascending: true });
                
                if (error) throw error;

                listaTarefasUl.innerHTML = ''; 

                if (!tarefas || tarefas.length === 0) {
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
                console.error('Erro ao buscar tarefas:', erro.message);
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
                        // Avisa o Supabase para deletar
                        const { error } = await supabase
                            .from('tarefas')
                            .delete()
                            .eq('id', tarefa.id);
                        
                        if (error) throw error;

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
                    // Atualiza concluida no Supabase
                    const { error } = await supabase
                        .from('tarefas')
                        .update({ concluida: checkboxConcluir.checked })
                        .eq('id', tarefa.id);
                        
                    if (error) throw error;

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
                const { data: notas, error } = await supabase
                    .from('anotacoes')
                    .select('*')
                    .eq('user_id', userId);

                if (error) throw error;
                
                if (notas) {
                    notas.forEach(nota => criarPostItVisual(nota));
                }
            } catch (erro) {
                console.error('Erro ao buscar notas:', erro.message);
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
                    try {
                        const { error } = await supabase
                            .from('anotacoes')
                            .delete()
                            .eq('id', nota.id);
                        
                        if (error) throw error;
                        div.remove();
                    } catch (erro) {
                        console.error('Erro ao deletar nota:', erro.message);
                    }
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
                    // Manda a posição final para o Supabase salvar no banco
                    const { error } = await supabase
                        .from('anotacoes')
                        .update({ pos_x: posXFinal, pos_y: posYFinal })
                        .eq('id', idNota);

                    if (error) throw error;
                } catch (erro) {
                    console.error('Erro ao salvar posição:', erro.message);
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
                    user_id: userId,
                    texto: texto,
                    pos_x: 50, // Posição inicial padrão quando nasce
                    pos_y: 50  // Posição inicial padrão quando nasce
                };

                try {
                    const { error } = await supabase
                        .from('anotacoes')
                        .insert([novaNota]);

                    if (error) throw error;
                    
                    inputTextoAnotacao.value = '';
                    carregarAnotacoesDoBanco(); // Atualiza a tela
                } catch (erro) {
                    console.error('Erro ao criar anotação:', erro.message);
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