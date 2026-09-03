// ==========================================
// 1. MOSTRA OU OCULTA O CAMPO DO PIN DO ADMIN
// ==========================================
function toggleAdminInput() {
    const checkbox = document.getElementById('checkSouAdm');
    const pinContainer = document.getElementById('adminPinContainer');
    const pinInput = document.getElementById('adminPin');
    
    if (checkbox && checkbox.checked) {
        if (pinContainer) pinContainer.style.display = 'block';
        if (pinInput) pinInput.required = true;
    } else {
        if (pinContainer) pinContainer.style.display = 'none';
        if (pinInput) {
            pinInput.value = '';
            pinInput.required = false;
        }
    }
}

// ==========================================
// 2. INTERCEPTA O ENVIO DO FORMULÁRIO DE LOGIN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o recarregamento padrão da página
            
            const checkboxAdm = document.getElementById('checkSouAdm');
            const usuarioInput = document.getElementById('usuario').value.trim();
            const senhaInput = document.getElementById('senha').value.trim();

            // --- FLUXO DE ADMINISTRADORES ---
            if (checkboxAdm && checkboxAdm.checked) {
                const pinDigitado = document.getElementById('adminPin').value.trim();

                // Lista de administradores autorizados
                const administradoresPermitidos = [
                    { usuario: "EdilsonJr", senha: "123456", pin: "1409" },
                    { usuario: "Admin2", senha: "senha123", pin: "2026" },
                    { usuario: "Admin3", senha: "senha456", pin: "7890" }
                ];

                // Procura se existe um admin com esse usuário, senha e PIN correspondentes
                const adminEncontrado = administradoresPermitidos.find(adm => 
                    adm.usuario.toLowerCase() === usuarioInput.toLowerCase() && 
                    adm.senha === senhaInput && 
                    adm.pin === pinDigitado
                );
                
                if (adminEncontrado) {
                    localStorage.setItem("usuario_perfil", "admin");
                    localStorage.setItem("usuario_logado", adminEncontrado.usuario);
                    
                    alert(`Acesso de Administrador concedido para ${adminEncontrado.usuario}!`);
                    window.location.href = "classificacao.html";
                    return;
                } else {
                    // Alerta genérico sem exibir dicas do PIN
                    alert("Dados de Administrador incorretos! Verifique o usuário, a senha ou o PIN.");
                    return;
                }
            } 
            
            // --- FLUXO DE JOGADOR COMUM ---
            else {
                let jogadores = JSON.parse(localStorage.getItem("jogadores")) || [];

                // Procura o jogador cadastrado correspondente ao CPF/E-mail e senha
                const jogadorEncontrado = jogadores.find(j => {
                    if (typeof j === "object" && j !== null) {
                        const cpfOuEmail = (j.cpf || j.email || "").trim().toLowerCase();
                        const senhaCadastrada = (j.senha || "").trim();
                        
                        return cpfOuEmail === usuarioInput.toLowerCase() && senhaCadastrada === senhaInput;
                    }
                    return false;
                });

                if (jogadorEncontrado) {
                    localStorage.setItem("usuario_perfil", "jogador");
                    const nomeJogador = jogadorEncontrado.apelido || jogadorEncontrado.nome || "Jogador";
                    localStorage.setItem("usuario_logado", nomeJogador);

                    alert(`Bem-vindo, ${nomeJogador}!`);
                    window.location.href = "classificacao.html";
                } else {
                    alert("Usuário/Senha incorretos ou cadastro não encontrado.");
                }
            }
        });
    }
});