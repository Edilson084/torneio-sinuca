// ==========================================
// 1. LÓGICA DO CARROSSEL DE BANNERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    if (track && prevBtn && nextBtn) {
        let index = 0;

        function atualizarCarrossel() {
            track.style.transform = `translateX(-${index * 50}%)`;
        }

        nextBtn.addEventListener("click", () => {
            index = (index + 1) % 2; // Alterna entre a imagem 0 e 1
            atualizarCarrossel();
        });

        prevBtn.addEventListener("click", () => {
            index = (index - 1 + 2) % 2;
            atualizarCarrossel();
        });
    }

    // ==========================================
    // 2. CONTROLE DE TIPO DE ACESSO (ADMIN OU JOGADOR)
    // ==========================================
    verificarAcessoNivel();
});

// Salva o tipo de usuario no navegador (Simulando o login)
function definirPerfilUsuario(tipoPerfil) {
    // tipoPerfil pode ser 'admin' ou 'jogador'
    localStorage.setItem("usuario_perfil", tipoPerfil);
    verificarAcessoNivel();
}

// Verifica e aplica as permissões na página
function verificarAcessoNivel() {
    const perfil = localStorage.getItem("usuario_perfil") || "jogador";
    const badgeAdmin = document.getElementById("admin-badge");

    if (badgeAdmin) {
        if (perfil === "admin") {
            badgeAdmin.style.display = "block";
        } else {
            badgeAdmin.style.display = "none";
        }
    }
}