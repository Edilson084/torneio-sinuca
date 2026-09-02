// ===============================
// CADASTRO.JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTOS DO FORMULÁRIO
    const nome = document.getElementById("username");
    const apelido = document.getElementById("nickname");
    const cpf = document.getElementById("cpf");
    const email = document.getElementById("email");
    const senha = document.getElementById("password");
    const confirmarSenha = document.getElementById("confirm-password");
    const formulario = document.querySelector("form");

    // ELEMENTOS PARA OCULTAR/EXIBIR SENHA
    const btnTogglePassword = document.getElementById("toggle-password");
    const btnToggleConfirmPassword = document.getElementById("toggle-confirm-password");

    // Alternar visibilidade da senha
    if (btnTogglePassword && senha) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = senha.type === "password";
            senha.type = isPassword ? "text" : "password";
            btnTogglePassword.querySelector("i").className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        });
    }

    if (btnToggleConfirmPassword && confirmarSenha) {
        btnToggleConfirmPassword.addEventListener("click", () => {
            const isPassword = confirmarSenha.type === "password";
            confirmarSenha.type = isPassword ? "text" : "password";
            btnToggleConfirmPassword.querySelector("i").className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        });
    }

    // FORMATAR CPF AUTOMATICAMENTE
    if (cpf) {
        cpf.addEventListener("input", function () {
            let valor = cpf.value.replace(/\D/g, "");
            valor = valor.substring(0, 11);
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
            valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            cpf.value = valor;
        });
    }

    // VALIDAÇÃO DE CPF
    function validarCPF(cpfValor) {
        cpfValor = cpfValor.replace(/\D/g, "");

        if (cpfValor.length !== 11 || /^(\d)\1+$/.test(cpfValor)) {
            return false;
        }

        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpfValor.charAt(i - 1)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfValor.charAt(9))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpfValor.charAt(i - 1)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfValor.charAt(10))) return false;

        return true;
    }

    // SUBMIT DO FORMULÁRIO
    if (formulario) {
        formulario.addEventListener("submit", function (event) {
            event.preventDefault();

            const nomeValor = nome.value.trim();
            const apelidoValor = apelido.value.trim();
            const cpfValor = cpf.value.trim();
            const emailValor = email.value.trim();
            const senhaValor = senha.value;
            const confirmarSenhaValor = confirmarSenha.value;

            // VALIDAÇÕES
            if (nomeValor === "") {
                alert("Digite seu nome.");
                nome.focus();
                return;
            }

            if (apelidoValor === "") {
                alert("Digite seu apelido.");
                apelido.focus();
                return;
            }

            if (!validarCPF(cpfValor)) {
                alert("Digite um CPF válido.");
                cpf.focus();
                return;
            }

            if (emailValor === "") {
                alert("Digite seu e-mail.");
                email.focus();
                return;
            }

            if (senhaValor === "") {
                alert("Digite uma senha.");
                senha.focus();
                return;
            }

            if (senhaValor !== confirmarSenhaValor) {
                alert("As senhas não coincidem.");
                confirmarSenha.focus();
                return;
            }

            let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];
            const cpfSemMascara = cpfValor.replace(/\D/g, "");

            // CHECAR DUPLICADOS
            if (jogadores.some(j => j.cpf === cpfSemMascara)) {
                alert("Este CPF já está cadastrado.");
                cpf.focus();
                return;
            }

            if (jogadores.some(j => j.email.toLowerCase() === emailValor.toLowerCase())) {
                alert("Este e-mail já está cadastrado.");
                email.focus();
                return;
            }

            // CRIAR NOVO JOGADOR
            const novoJogador = {
                nome: nomeValor,
                apelido: apelidoValor,
                cpf: cpfSemMascara,
                email: emailValor,
                senha: senhaValor,
                pontos: 0,
                vitorias: 0,
                derrotas: 0,
                jogos: 0,
                pago: false // Controle de pagamento pendente
            };

            jogadores.push(novoJogador);
            localStorage.setItem("jogadores", JSON.stringify(jogadores));

            alert("Cadastro realizado com sucesso! Redirecionando para o pagamento da taxa.");

            // REDIRECIONAR PARA O PAGAMENTO (NOME EM MINÚSCULAS)
            window.location.href = "pagamento.html";
        });
    }
});