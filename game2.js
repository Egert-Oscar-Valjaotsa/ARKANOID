
FAAAAAAAAAAAAAAAAAAAAKE

let game = {
    start: function() {
        this.ctx = document.getElementById("mycanvas").getContext("2d");
        let background = new Image();
        background.onload = () => {
            window.requestAnimationFrame(() => {
                this.ctx.drawImage(background, 0, 0);
            });
        };
        background.src = "img/background.png";
    }
};

FAAAAAAAAAAAAAAAAAAAAKE


let = game {
    ctx: null,
    platform: null,
    ball: null,
    sprites: {
        background: null,
        ball: null,
        platform: null
    },
    init: function() {
        this.ctx = document.getElementById("mycanvas").getContext("2d");
    },
    preload(callback) {
        let loaded = 0
        let required = Object.keys(this.sprites).length;

        for(let)

            FAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAKE

FAAAAAAAAAAAAAAAAAAAAKE