// ==========================================
// 1. LÓGICA DO CARROSSEL DE BANNERS (TEMPOS DIFERENTES)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");

    if (track) {
        let index = 0;
        const totalSlides = track.querySelectorAll("img").length || 2;
        let temporizadorCarrossel = null;

        function atualizarCarrossel() {
            track.style.transform = `translateX(-${index * (100 / totalSlides)}%)`;
        }

        function proximoSlide() {
            index = (index + 1) % totalSlides;
            atualizarCarrossel();
            programarProximaTroca(); // Agenda o próximo ciclo com base no slide atual
        }

        function slideAnterior() {
            index = (index - 1 + totalSlides) % totalSlides;
            atualizarCarrossel();
            programarProximaTroca();
        }

        function programarProximaTroca() {
            if (temporizadorCarrossel) clearTimeout(temporizadorCarrossel);

            // Se estiver no Banner 1 (index 0), fica mais tempo (ex: 6000ms = 6 segundos)
            // Se estiver no Banner 2 (index 1), fica o tempo normal (ex: 2000ms = 2 segundos)
            let tempoAtual = (index === 0) ? 6000 : 2000;

            temporizadorCarrossel = setTimeout(proximoSlide, tempoAtual);
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                proximoSlide();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                slideAnterior();
            });
        }

        // Inicia o ciclo automático
        programarProximaTroca();

        // Opcional: Pausa o carrossel automático quando o mouse estiver em cima
        const carouselContainer = document.querySelector(".carousel");
        if (carouselContainer) {
            carouselContainer.addEventListener("mouseenter", () => {
                if (temporizadorCarrossel) clearTimeout(temporizadorCarrossel);
            });

            carouselContainer.addEventListener("mouseleave", () => {
                programarProximaTroca();
            });
        }
    }

    // ==========================================
    // 2. CONTROLE DE TIPO DE ACESSO (ADMIN OU JOGADOR)
    // ==========================================
    verificarAcessoNivel();
});

// Salva o tipo de usuario no navegador (Simulando o login)
function definirPerfilUsuario(tipoPerfil) {
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