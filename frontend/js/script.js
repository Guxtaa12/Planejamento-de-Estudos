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

    // [NOVO] Verifica se o nome de usuário já existe na tabela `usernames`
    try {
        const { data: userExiste, error: errBusca } = await supabase
            .from('usernames')
            .select('username')
            .eq('username', inputNomeRegistro)
            .single();

        if (userExiste) {
            if (registerMessage) {
                registerMessage.textContent = 'Este Nome de Usuário já está em uso, escolha outro!';
                registerMessage.className = 'mensagem erro';
                registerMessage.style.color = '#dc3545';
                registerMessage.style.display = 'block';
            }
            return; // Impede o cadastro
        }
    } catch (err) {
        // Se der erro que não encontrou (PostgREST), seguimos o jogo, é sinal de que não existe = Ótimo.
        if(err.code !== 'PGRST116') {
             console.error("Erro consultando username:", err.message);
        }
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
        
        // Se a conta Auth foi criada, salvamos o apelido na tabela pública para bloquear outros e liberar login sem email
        const { error: errInsert } = await supabase
            .from('usernames')
            .insert([{ username: inputNomeRegistro, email: inputEmailRegistro }]);

        if(errInsert) console.error("Não salvou o username público", errInsert.message);

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

    let emailFinalParaAuth = emailOuUsuario;

    try {
        // [NOVO] Se o que o usuário digitou NÃO parece um email (não tem '@'), 
        // supomos que é um Username e buscamos qual é o verdadeiro Email desse cara:
        if (!emailOuUsuario.includes('@')) {
            const { data: registroUsername, error: errBusca } = await supabase
                .from('usernames')
                .select('email')
                .eq('username', emailOuUsuario)
                .single();

            // Achamos o email dele associado a esse Username? Substitui a variável!
            if (registroUsername && registroUsername.email) {
                emailFinalParaAuth = registroUsername.email;
            } else {
                throw new Error("Usuário não encontrado!");
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: emailFinalParaAuth,
            password: senhaDigitada
        });

        if (error) throw error;

        // Pega o nome do usuário dos metadados
        const nomeUsuario = data.user.user_metadata.display_name || 'Usuário';

        // Salva na sessão
        sessionStorage.setItem('loggedInUser', nomeUsuario);
        sessionStorage.setItem('userId', data.user.id); 
        sessionStorage.setItem('userEmail', emailFinalParaAuth); // <- IMPORTANTE PARA O PERFIL

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

    const btnTheme = document.getElementById('btn-theme');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // [NOVO] Recuperação da Sessão Auth do Supabase independente do fluxo de Login HTML.
    // Isso evita que o "Meu Perfil" quebre se a pessoa apertar F5 ou vier da versão sem a chave userEmail:
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user && session.user.email) {
            sessionStorage.setItem('userEmail', session.user.email);
            if (!sessionStorage.getItem('userId')) sessionStorage.setItem('userId', session.user.id);
        }
    });

    // Aplica o tema salvo logo ao iniciar a página
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if(btnTheme) btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                btnTheme.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
    }

    // --- Lógica do Pomodoro ---
    const pomodoroTimerDisplay = document.getElementById('pomodoro-timer');
    if (pomodoroTimerDisplay) {
        let timerInterval;
        let timeLeft = 25 * 60; // 25 min padrão
        let isRunning = false;

        const btnPomoStart = document.getElementById('btn-pomo-start');
        const btnPomoReset = document.getElementById('btn-pomo-reset');
        const pomoTabs = document.querySelectorAll('.pomodoro-tab');

        function updateDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            pomodoroTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function setTimer(minutes) {
            clearInterval(timerInterval);
            isRunning = false;
            btnPomoStart.textContent = 'Iniciar';
            timeLeft = minutes * 60;
            updateDisplay();
        }

        pomoTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                pomoTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                setTimer(parseInt(tab.getAttribute('data-time')));
            });
        });

        btnPomoStart.addEventListener('click', () => {
            if (isRunning) {
                clearInterval(timerInterval);
                btnPomoStart.textContent = 'Retomar';
                isRunning = false;
            } else {
                isRunning = true;
                btnPomoStart.textContent = 'Pausar';
                timerInterval = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        updateDisplay();
                    } else {
                        clearInterval(timerInterval);
                        isRunning = false;
                        btnPomoStart.textContent = 'Iniciar';
                        
                        // [NOVO] Ganho de XP por usar o Pomodoro
                        let mins = parseInt(document.querySelector('.pomodoro-tab.active').getAttribute('data-time'));
                        let xpGanho = mins === 25 ? 25 : (mins === 15 ? 15 : 5);
                        ganharXP(xpGanho);
                        
                        alert(`Tempo finalizado! Hora de descansar ou focar. (+${xpGanho} XP)`);
                    }
                }, 1000);
            }
        });

        btnPomoReset.addEventListener('click', () => {
            const activeTab = document.querySelector('.pomodoro-tab.active');
            setTimer(parseInt(activeTab.getAttribute('data-time')));
        });
        
        updateDisplay();
    }

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

    // --- Lógica da Página: Cronograma/Lista de Tarefas e Calendário ---
    const listaTarefasUl = document.getElementById('lista-tarefas');
    const semTarefasMsg = document.getElementById('sem-tarefas-mensagem');
    
    // Elementos do Calendário
    const calendarGrid = document.getElementById('calendar-grid');
    const mesAnoDisplay = document.getElementById('mes-ano-display');
    const btnPrevMonth = document.getElementById('prev-month');
    const btnNextMonth = document.getElementById('next-month');
    let dataAtualCalendario = new Date();
    let tarefasLocaisCache = []; // Para recarregar o calendário sem precisar bater no banco ao mudar o mês

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
                    tarefasLocaisCache = [];
                } else {
                    if (semTarefasMsg) semTarefasMsg.style.display = 'none';
                    tarefasLocaisCache = tarefas;
                    tarefas.forEach(tarefa => {
                        const elementoTarefa = criarElementoTarefa(tarefa);
                        listaTarefasUl.appendChild(elementoTarefa);
                    });
                    verificarPrazosBanco(tarefas); 
                }
                
                // Manda renderizar o novo Grid Calendário se existir na tela
                if (calendarGrid) renderCalendar(tarefasLocaisCache);

            } catch (erro) {
                console.error('Erro ao buscar tarefas:', erro.message);
                listaTarefasUl.innerHTML = '<li style="color: #dc3545; text-align: center;">Erro ao carregar as tarefas.</li>';
            }
        }

        // --- FUNÇÕES DO CALENDÁRIO ---
        function renderCalendar(tarefas) {
            if (!calendarGrid) return;
            calendarGrid.innerHTML = '';
            
            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            diasSemana.forEach(dia => {
                const div = document.createElement('div');
                div.className = 'cal-day-name';
                div.textContent = dia;
                calendarGrid.appendChild(div);
            });

            const ano = dataAtualCalendario.getFullYear();
            const mes = dataAtualCalendario.getMonth();
            
            const nomeMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            if (mesAnoDisplay) mesAnoDisplay.textContent = `${nomeMeses[mes]} ${ano}`;

            const primeiroDiaMes = new Date(ano, mes, 1).getDay();
            const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

            // Preenche espaços vazios iniciais
            for(let i=0; i < primeiroDiaMes; i++) {
                const empty = document.createElement('div');
                empty.className = 'cal-day empty';
                calendarGrid.appendChild(empty);
            }

            const hoje = new Date();

            for(let d=1; d <= ultimoDiaMes; d++) {
                const divDia = document.createElement('div');
                divDia.className = 'cal-day';
                if (hoje.getDate() === d && hoje.getMonth() === mes && hoje.getFullYear() === ano) {
                    divDia.classList.add('hoje');
                }

                const spanNum = document.createElement('div');
                spanNum.className = 'cal-num';
                spanNum.textContent = d;
                divDia.appendChild(spanNum);

                // Filtrar tarefas visuais para este dia exato
                // Formata com timezone local (Y-m-d local) para match perfeito com a string do banco
                const dateStr = `${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const tarefasDoDia = tarefas.filter(t => t.prazo === dateStr);
                
                tarefasDoDia.forEach(t => {
                    const tDiv = document.createElement('div');
                    tDiv.className = 'cal-task-item';
                    if (t.concluida) tDiv.classList.add('concluida');
                    tDiv.textContent = t.nome;
                    tDiv.title = t.nome; 
                    divDia.appendChild(tDiv);
                });

                calendarGrid.appendChild(divDia);
            }
        }

        if (btnPrevMonth) {
            btnPrevMonth.addEventListener('click', () => {
                dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() - 1);
                renderCalendar(tarefasLocaisCache);
            });
        }
        if (btnNextMonth) {
            btnNextMonth.addEventListener('click', () => {
                dataAtualCalendario.setMonth(dataAtualCalendario.getMonth() + 1);
                renderCalendar(tarefasLocaisCache);
            });
        }
        // ---------------------------------

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
                    
                    // [NOVO] Ganha XP ao concluir Tarefa
                    if (checkboxConcluir.checked) {
                        ganharXP(10);
                    }
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
            
            // Define a cor vinda do banco de dados
            if (nota.cor) {
                div.style.backgroundColor = nota.cor;
            }

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

                let corSelecionada = '#ffeb3b'; // Amarelo Padrão
                const radioCor = document.querySelector('input[name="postit-color"]:checked');
                if (radioCor) corSelecionada = radioCor.value;

                const novaNota = {
                    user_id: userId,
                    texto: texto,
                    pos_x: 50, // Posição inicial padrão quando nasce
                    pos_y: 50, // Posição inicial padrão quando nasce
                    cor: corSelecionada
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

    // ==========================================
    // LÓGICA DE GAMIFICAÇÃO E XP (GLOBAL)
    // ==========================================

    const profileCard = document.getElementById('profile-card');
    
    // Nomes criativos para os Níveis
    const titulosNivel = {
        1: "Aprendiz",
        2: "Iniciante",
        3: "Estudante Focado",
        4: "Desbravador",
        5: "Acadêmico",
        6: "Mestre",
        7: "Lendário"
    };

    async function carregarXP() {
        if (!userId || !profileCard) return;

        try {
            document.getElementById('user-display-name').textContent = sessionStorage.getItem('loggedInUser') || 'Estudante';
            
            let { data, error } = await supabase
                .from('niveis_usuario')
                .select('xp, nivel')
                .eq('user_id', userId)
                .single();

            // [NOVO] Busca também o avatar do cara na tabela usernames para exibir na Home
            let avatarDoCara = null;
            let nomeDoCara = sessionStorage.getItem('loggedInUser') || 'Estudante';
            
            // Só por segurança vamos ler o usernames pelo email dele
            const emailSession = sessionStorage.getItem('userEmail');
            if (emailSession) {
               const { data: userData } = await supabase
                    .from('usernames')
                    .select('username, avatar_url')
                    .eq('email', emailSession)
                    .single();
               
               if(userData) {
                   nomeDoCara = userData.username;
                   avatarDoCara = userData.avatar_url;
                   sessionStorage.setItem('loggedInUser', nomeDoCara);
                   document.getElementById('user-display-name').textContent = nomeDoCara;
               }
            }
            
            atualizarTelaXP(data.xp, data.nivel, avatarDoCara);

        } catch (err) {
            console.error("Erro ao carregar XP:", err.message);
        }
    }

    // Função para atualizar os elementos visuais
    function atualizarTelaXP(xpTotal, nivelAtual, avatarUrl) {
        if(!profileCard) return;

        const maxXP = nivelAtual * 100; // Formula simples: Nível 1 exige 100XP. Nivel 2: 200XP
        const xpAtualNivel = xpTotal % maxXP; // XP "sobrando" pro próximo nível
        const porcentagem = Math.min((xpAtualNivel / maxXP) * 100, 100);
        
        const titulo = titulosNivel[nivelAtual] || "Transcendente";

        document.getElementById('user-level-title').textContent = `Nível ${nivelAtual} - ${titulo}`;
        document.getElementById('xp-current').textContent = `${xpAtualNivel} XP`;
        document.getElementById('xp-next').textContent = `${maxXP} XP`;
        document.getElementById('xp-bar-fill').style.width = `${porcentagem}%`;
        
        // Se a chamada mandar um avatarURL e houver a div na Home, substitui o ícone:
        const avatarCircle = document.querySelector('.avatar-circle');
        if (avatarCircle && avatarUrl) {
            avatarCircle.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
        }
    }

    // Função pra ganhar XP nas tarefas e pomodoro
    window.ganharXP = async function(quantidade) {
        if (!userId) return;

        try {
            // Busca o estado atual direto do banco para evitar dessincronização
            let { data: atual, error } = await supabase
                .from('niveis_usuario')
                .select('xp, nivel')
                .eq('user_id', userId)
                .single();

            if (error) return;

            let novoXP = atual.xp + quantidade;
            let nivelAtual = atual.nivel;
            let maxXPObj = nivelAtual * 100;

            // Logica de Evolução Genérica (1 Level Up por vez garantido)
            if ((novoXP % maxXPObj) >= maxXPObj || novoXP >= maxXPObj) {
                // Se o XP residual passar do máximo, upa e joga o XP pro próximo calculo
                // Pra simplificar nesse modelo, vamos recalcular o nível com base no XP total linear
            }
            
            // Formula Linear e Absoluta para não bugar:
            // Nível = raiz aproximada ou blocos. Neste projeto adotaremos que a cada 100 ganhas sobe 1.
            let calcNivel = Math.floor(novoXP / 100) + 1;

            const { error: upErr } = await supabase
                .from('niveis_usuario')
                .update({ xp: novoXP, nivel: calcNivel })
                .eq('user_id', userId);

            if (!upErr) {
                atualizarTelaXP(novoXP, calcNivel);
            }

        } catch (err) {
            console.error("Erro ao ganhar XP:", err.message);
        }
    }

    // Roda quando a tela abre
    setTimeout(() => { carregarXP(); }, 500); // pequeno timeout para aguardar sessão

    // ==========================================
    // LÓGICA DOS CADERNOS (NOTION-LIKE EDITOR)
    // ==========================================
    const listaCadernosUl = document.getElementById('lista-cadernos');
    const editorToolbar = document.getElementById('editor-toolbar');
    const editorContent = document.getElementById('caderno-content');
    const editorFooter = document.getElementById('editor-footer');
    const inputCadernoTitulo = document.getElementById('caderno-titulo');
    const btnNovoCaderno = document.getElementById('btn-novo-caderno');
    const btnSaveCaderno = document.getElementById('btn-save-caderno');
    const saveStatus = document.getElementById('save-status');

    let cadernoAtivoId = null;

    if (listaCadernosUl && editorContent) {
        
        async function carregarCadernos() {
            if (!userId) return;
            try {
                const { data: cadernos, error } = await supabase
                    .from('cadernos')
                    .select('id, titulo, data_criacao')
                    .eq('user_id', userId)
                    .order('data_criacao', { ascending: false });
                
                if (error) throw error;
                
                listaCadernosUl.innerHTML = '';
                if (cadernos && cadernos.length > 0) {
                    cadernos.forEach(cad => {
                        const li = document.createElement('li');
                        li.className = 'caderno-item';
                        if (cadernoAtivoId === cad.id) li.classList.add('active');
                        
                        const titulo = document.createElement('div');
                        titulo.className = 'caderno-item-title';
                        titulo.textContent = cad.titulo || 'Sem Título';
                        
                        const dataSpan = document.createElement('div');
                        dataSpan.className = 'caderno-item-date';
                        dataSpan.textContent = new Date(cad.data_criacao).toLocaleDateString('pt-BR');
                        
                        li.appendChild(titulo);
                        li.appendChild(dataSpan);
                        
                        li.addEventListener('click', () => abrirCaderno(cad.id));
                        listaCadernosUl.appendChild(li);
                    });
                } else {
                    listaCadernosUl.innerHTML = '<li style="padding:15px; color:#888; font-size:0.9em; text-align:center;">Nenhum caderno criado.</li>';
                }
            } catch (err) {
                console.error("Erro carregando cadernos:", err.message);
            }
        }

        async function abrirCaderno(id) {
            cadernoAtivoId = id;
            try {
                const { data, error } = await supabase
                    .from('cadernos')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                
                inputCadernoTitulo.value = data.titulo || '';
                editorContent.innerHTML = data.conteudo_html || '';
                editorContent.contentEditable = "true";
                editorToolbar.style.display = "flex";
                editorFooter.style.display = "flex";
                saveStatus.textContent = '';
                
                // Recarrega lista para marcar ativo
                carregarCadernos();
            } catch (err) {
                console.error("Erro ao abrir caderno", err.message);
            }
        }

        if (btnNovoCaderno) {
            btnNovoCaderno.addEventListener('click', async () => {
                 try {
                    if (saveStatus) saveStatus.textContent = "Criando...";
                    const { data, error } = await supabase
                        .from('cadernos')
                        .insert([{ user_id: userId, titulo: 'Novo Caderno', conteudo_html: '' }])
                        .select()
                        .single();
                        
                    if (error) throw error;
                    abrirCaderno(data.id);
                 } catch (err) {
                     console.error("Erro ao criar novo caderno:", err.message);
                 }
            });
        }

        if (btnSaveCaderno) {
            btnSaveCaderno.addEventListener('click', async () => {
                if(!cadernoAtivoId) return;
                try {
                    saveStatus.textContent = "Salvando...";
                    saveStatus.style.color = "#888";
                    
                    const { error } = await supabase
                        .from('cadernos')
                        .update({
                            titulo: inputCadernoTitulo.value,
                            conteudo_html: editorContent.innerHTML
                        })
                        .eq('id', cadernoAtivoId);
                        
                    if (error) throw error;
                    
                    saveStatus.textContent = "Salvo com sucesso!";
                    saveStatus.style.color = "#28a745";
                    
                    // Recarrega lista pra atualizar o titulo alterado
                    carregarCadernos();
                    
                    setTimeout(() => { saveStatus.textContent = ""; }, 3000);
                } catch (err) {
                    console.error("Erro ao salvar caderno", err.message);
                    saveStatus.textContent = "Erro ao salvar!";
                    saveStatus.style.color = "#dc3545";
                }
            });
        }

        // Configurar botões de Formatação
        const formatBtns = document.querySelectorAll('.btn-format');
        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                const val = btn.getAttribute('data-val') || null;
                document.execCommand(cmd, false, val);
                editorContent.focus(); // Devolve foco ao editor pra continuar escrevendo
            });
        });

        carregarCadernos();
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

    // ==========================================
    // LÓGICA DO MEU PERFIL (AVATAR E NOME)
    // ==========================================
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil && sessionStorage.getItem('userEmail')) {
        
        const inputUsernameEdit = document.getElementById('perfil-username');
        const imgPreview = document.getElementById('preview-avatar');
        const customWrapper = document.getElementById('custom-avatar-wrapper');
        const inputCustomAvatar = document.getElementById('perfil-avatar-url');
        const lblName = document.getElementById('perfil-display-name');
        const lblEmail = document.getElementById('perfil-display-email');
        const pStatus = document.getElementById('perfil-status');

        let emailLogado = sessionStorage.getItem('userEmail');
        
        // 1. Carregar os dados atuais e preencher a tela
        async function loadProfileData() {
            try {
                const { data, error } = await supabase
                    .from('usernames')
                    .select('*')
                    .eq('email', emailLogado)
                    .single();

                if (error) throw error;

                if (data) {
                    inputUsernameEdit.value = data.username;
                    lblName.textContent = data.username;
                    lblEmail.textContent = data.email;

                    if (data.avatar_url) {
                        imgPreview.src = data.avatar_url;
                        // Tentar setar o radio button corresppondente ou cair no Custom
                        const radios = document.querySelectorAll('input[name="avatar-preset"]');
                        let isPreset = false;
                        radios.forEach(r => {
                            if(r.value === data.avatar_url) {
                                r.checked = true;
                                isPreset = true;
                            }
                        });
                        if (!isPreset && data.avatar_url.startsWith('http')) {
                            document.querySelector('input[name="avatar-preset"][value="custom"]').checked = true;
                            customWrapper.style.display = 'block';
                            inputCustomAvatar.value = data.avatar_url;
                        }
                    }
                }
            } catch (e) {
                console.error("Erro carregando Perfil:", e.message);
            }
        }
        
        loadProfileData();

        // 2. Controlar os rádio botões
        const avatarRadios = document.querySelectorAll('input[name="avatar-preset"]');
        avatarRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if(e.target.value === 'custom') {
                    customWrapper.style.display = 'block';
                } else {
                    customWrapper.style.display = 'none';
                    imgPreview.src = e.target.value; // Pré-visualiza os pré-setados na hora
                }
            });
        });

        // Ouvir blur no custom para atualizar preview
        inputCustomAvatar.addEventListener('blur', () => {
            if (inputCustomAvatar.value && inputCustomAvatar.value.startsWith('http')) {
                imgPreview.src = inputCustomAvatar.value;
            }
        });

        // 3. Salvar os dados novos no Banco (Tabela Usernames)
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            pStatus.style.display = "block";
            pStatus.textContent = "Salvando perfil...";
            pStatus.style.color = "#888";

            let novoNome = inputUsernameEdit.value.trim();
            let novaFoto = '';

            const selectedRadio = document.querySelector('input[name="avatar-preset"]:checked').value;
            if (selectedRadio === 'custom') {
                novaFoto = inputCustomAvatar.value.trim();
            } else {
                novaFoto = selectedRadio;
            }

            try {
                // Checa se o Username já não está em uso por outro e-mail
                if (novoNome !== lblName.textContent) {
                    const { data: existe, error: errExist } = await supabase
                        .from('usernames')
                        .select('username')
                        .eq('username', novoNome)
                        .not('email', 'eq', emailLogado) // exclui ele próprio
                        .single();

                    if (existe) {
                        throw new Error("Este Username já está em uso por outra pessoa.");
                    }
                }

                // Faz o update: como email é PK pro nosso fluxo ali, usamos ele no match
                // (ou id se houvesse, mas nossa tabela original relacionou e-mail ou UUID)
                const { error: errUpdate } = await supabase
                    .from('usernames')
                    .update({ 
                        username: novoNome,
                        avatar_url: novaFoto
                    })
                    .eq('email', emailLogado);

                if (errUpdate) throw errUpdate;

                pStatus.textContent = "Perfil atualizado! Você será redirecionado para a Home...";
                pStatus.style.color = "#28a745";
                
                // Atualizar o Cache Local antes de puxar
                sessionStorage.setItem('loggedInUser', novoNome);
                lblName.textContent = novoNome;
                
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);

            } catch (err) {
                console.error("Erro update perfil:", err.message);
                pStatus.textContent = "Erro: " + err.message;
                pStatus.style.color = "#dc3545";
            }
        });
    }

});