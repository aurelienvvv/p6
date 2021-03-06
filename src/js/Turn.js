class Turn {
    constructor() {
        // variables liées au joueur en cours
        this.player = Data.currentPlayer;
        this.playerPosition = $(`[data-player=${this.player.dataAttr}]`);
        this.currentPlayerWeapon = this.player.weapon;
        this.dataX = this.playerPosition.data('x');
        this.dataY = this.playerPosition.data('y');

        // met à jour dom des joueurs
        this.displayInfosPlayer();

        // ajoute les classes can-go aux axes x et y
        this.whereCanGo();

        // empêche de traverser les murs
        this.checkWalls();


        // regroupe les évènements au click
        this.initEvent();

        // COMBAT //
        // check si les joueurs sont face à face, lance le combat
        this.checkEnemyAllDirections();
    };

    initEvent() {
        // au click sur une case accessible
        $(".can-go").on('click', (e) => {
            this.$obj = $(e.currentTarget);
            this.endPlayerDataX = this.$obj.data('x');
            this.endPlayerDataY = this.$obj.data('y');

            // met à jour la position du joueur sur la case
            this.playerMoveUpdateDom();

            // boucles de récupération des armes :
            this.movePlayerConditions();

            // sélectionne l'autre joueur
            Utils.selectPlayer();

            // relance un tour
            new Turn();
        });

        // au click sur le bouton de défense
        $(`.players-wrapper .${this.player.dataAttr} .btn-defense`).unbind().on('click', () => {
            this.enemy = game.arrOfPlayers.filter(player => this.player.dataAttr !== player.dataAttr);
            $(`.players-wrapper .fight-options`).removeClass('active');

            this.classOnDefense();

            // ajoute true à protect du joueur en cours
            this.player.protect = true;

            this.fightCondition();
        });

        // au click sur le bouton d'attaque
        $(`.players-wrapper .${this.player.dataAttr} .btn-attack`).unbind().on('click', () => {
            // choix d'attaquer ou de defendre
            this.enemy = game.arrOfPlayers.filter(player => this.player.dataAttr !== player.dataAttr);
            $(`.players-wrapper .fight-options`).removeClass('active');

            this.damagesOnHit();

            // animation css à l'attaque
            this.classOnAttack();

            // retire true à protect de l'ennemi
            this.enemy[0].protect = false;

            // relance un tour ou termine la partie
            this.fightCondition();
        });

    }

    displayInfosPlayer() {
        // met à jour l'ecran d'affichage du joueur
        this.playerAttr = this.player.dataAttr;

        $(`[data-player]`).removeClass('current-player');
        $(`.players-wrapper .player`).removeClass('active');
        $(`.players-wrapper .player.${this.playerAttr}`).addClass('active');
        $(`[data-player = ${this.playerAttr}]`).addClass('current-player');
        $(`body`).addClass(`${this.playerAttr}`);
    };

    whereCanGo() {
        // variables pour les déplacements
        this.dataXMin = this.dataX - 3;
        this.dataXMax = this.dataX + 4;
        this.dataYMin = this.dataY - 3;
        this.dataYMax = this.dataY + 4;

        // donne accès aux cases, 3 cases en y, 3 cases en x
        $(`[data-x = ${this.dataX}], [data-y = ${this.dataY}]`).addClass('can-go');
        $(`[data-x = ${this.dataX}][data-y = ${this.dataY}]`).removeClass('can-go');
        $('.can-go.player').removeClass('can-go');

        // limites can-go à 3 cases en x et en y
        this.loopCanGo(0, this.dataXMin, 'data-x');
        this.loopCanGo(this.dataXMax, 10, 'data-x');
        this.loopCanGo(0, this.dataYMin, 'data-y');
        this.loopCanGo(this.dataYMax, 11, 'data-y');
    };

    loopCanGo(startLoop, endLoop, dataAttr) {
        for (let i = startLoop; i < endLoop; i++) {
            $(`[${dataAttr} = ${i}]`).removeClass('can-go');
        };
    };

    checkWalls() {
        // détecte les murs et empêche le joueur de passer à travers
        let wallsOnWay = $('.can-go.innacessible');

        wallsOnWay.each((index, elem) => {
            let dataWallX = $(elem).data('x');
            let dataWallY = $(elem).data('y');


            if (this.dataX < dataWallX) {
                for (let i = dataWallX; i < 10; i++) {
                    $(`[data-x = ${i}]`).removeClass('can-go');
                }
            }

            else if (this.dataX > dataWallX) {
                for (let i = dataWallX; i > -1; i--) {
                    $(`[data-x = ${i}]`).removeClass('can-go');
                }
            }

            else if (this.dataY < dataWallY) {
                for (let i = dataWallY; i < 11; i++) {
                    $(`[data-y = ${i}]`).removeClass('can-go');
                }
            }

            else if (this.dataY > dataWallY) {
                for (let i = dataWallY; i > -1; i--) {
                    $(`[data-y = ${i}]`).removeClass('can-go');
                }
            }
        })
    };

    movePlayerConditions() {
        this.startPlayerDataX = this.dataX;
        this.startPlayerDataY = this.dataY;

        // si le joueur se déplace de la gauche vers la droite
        if (this.startPlayerDataY === this.endPlayerDataY && this.startPlayerDataX <= this.endPlayerDataX) {
            $(`[data-player=${this.player.dataAttr}]`).removeClass('to-left');
            this.takeWeapon(this.startPlayerDataX, this.endPlayerDataX, this.endPlayerDataY, 'data-x', 'data-y');
        }

        // si le joueur se déplace de la droite vers la gauche
        else if (this.startPlayerDataY === this.endPlayerDataY && this.startPlayerDataX >= this.endPlayerDataX) {
            $(`[data-player=${this.player.dataAttr}]`).addClass('to-left');
            this.takeWeapon(this.endPlayerDataX, this.startPlayerDataX, this.endPlayerDataY, 'data-x', 'data-y');
        }

        // si le joueur se déplace de haut en bas
        else if (this.startPlayerDataX === this.endPlayerDataX && this.startPlayerDataY <= this.endPlayerDataY) {
            this.takeWeapon(this.startPlayerDataY, this.endPlayerDataY, this.endPlayerDataX, 'data-y', 'data-x');
        }

        // si le joueur se déplace de bas en haut
        else if (this.startPlayerDataX === this.endPlayerDataX && this.startPlayerDataY >= this.endPlayerDataY) {
            this.takeWeapon(this.endPlayerDataY, this.startPlayerDataY, this.endPlayerDataX, 'data-y', 'data-x');
        };
    }

    takeWeapon(startLoop, endLoop, staticDataYX, incrementAttribute, staticAttribute) {
        for (let i = startLoop; i <= endLoop; i++) {
            let $currentCell = $(`[${incrementAttribute}=${i}][${staticAttribute}=${staticDataYX}]`);
            let cellWeapon = $currentCell.attr('data-weapon');
            let weapon = game.arrOfWeapons.filter(weapon => weapon.dataAttr === cellWeapon);
            let canTakeWeapon = true;

            // quand un joueur passe sur une arme
            if (cellWeapon) {
                // quand un joueur arrive sur une case avec une arme, rien ne se passe
                // permet d'empecher que le joueur pose une arme en arrivant sur une case et la reprenne en partant
                if (this.player.weapon !== 'Aucune') {
                    if (($currentCell).hasClass('weapon player')) {
                        canTakeWeapon = false;
                    }
                }

                if (canTakeWeapon) {
                    // si il a déjà une arme : la remplace par celle qu'il a
                    if (this.player.weapon !== 'Aucune') {
                        $currentCell.addClass('weapon');
                        $currentCell.attr('data-weapon', this.player.weapon.dataAttr).removeClass('vide');
                        // sinon récupère l'arme
                    } else {
                        $currentCell.removeAttr('data-weapon').removeClass('weapon').addClass('vide');
                    }

                    // met à jour l'arme et le tableau du joueur
                    this.player.weapon = weapon[0];
                    $(`[data-x = ${this.endPlayerDataX}][data-y = ${this.endPlayerDataY}]`).attr('data-player-weapon', this.player.weapon.dataAttr);
                    this.player.updatePlayerDom(this.player);
                };
            };
        };
    };

    playerMoveUpdateDom() {
        $(`.cell`).removeClass('can-go');
        $(`.cell`).removeClass('attack-enemy');
        $(`[data-player = ${Data.currentPlayer.dataAttr}]`).removeClass(`player to-left`).removeAttr('data-player data-player-weapon').removeClass('current-player');
        $(`[data-x = ${this.endPlayerDataX}][data-y = ${this.endPlayerDataY}]`).attr('data-player', Data.currentPlayer.dataAttr).addClass('player');

        if (`${this.player.weapon}`) {
            $(`[data-x = ${this.endPlayerDataX}][data-y = ${this.endPlayerDataY}]`).attr('data-player-weapon', this.player.weapon.dataAttr);
        }

        $('.cell').off("click");
    };

    checkEnemyForFight(attrEnemy, positionEnemy, attr, position) {
        if ($(`[data-${attrEnemy} = ${positionEnemy}][data-${attr} = ${position}]`).hasClass('player')) {
            $(`[data-${attrEnemy} = ${positionEnemy}][data-${attr} = ${position}]`).addClass('attack-enemy');

            // detecte la position de l'ennemi et ajoute une classe correspondante
            this.enemyPosition(attrEnemy, positionEnemy);

            // ajout des classes pour le combat
            this.fightTimeDOM();
        };
    };

    enemyPosition(attrEnemy, positionEnemy) {
        // detecte la position de l'ennemi et ajoute une classe correspondante
        if (attrEnemy === "y" && positionEnemy === this.dataY - 1) {
            $(`[data-player=${this.player.dataAttr}]`).addClass('top-enemy');
            $('.cells').addClass('vertical-fight');

        } else if (attrEnemy === "y" && positionEnemy === this.dataY + 1) {
            $(`[data-player=${this.player.dataAttr}]`).addClass('bottom-enemy');
            $('.cells').addClass('vertical-fight');

        } else if (attrEnemy === "x" && positionEnemy === this.dataX + 1) {
            $(`[data-player=${this.player.dataAttr}]`).addClass('right-enemy');
            $(`[data-player=${this.player.dataAttr}]`).removeClass('to-left');

        } else if (attrEnemy === "x" && positionEnemy === this.dataX - 1) {
            $(`[data-player=${this.player.dataAttr}]`).addClass('left-enemy');
            $(`[data-player=${this.player.dataAttr}]`).addClass('to-left');
        }
    };

    fightTimeDOM() {
        $('body').addClass('fight-time');
        $('.cell').removeClass('can-go');
        $('.cell').off('click');
        $(`.players-wrapper .${this.player.dataAttr} .fight-options`).addClass('active');

        // zoom visuel sur les joueurs au moment du combat
        this.zoomOnFight();
    }

    checkEnemyAllDirections() {
        this.checkEnemyForFight('x', this.dataX - 1, 'y', this.dataY);
        this.checkEnemyForFight('x', this.dataX + 1, 'y', this.dataY);
        this.checkEnemyForFight('y', this.dataY - 1, 'x', this.dataX);
        this.checkEnemyForFight('y', this.dataY + 1, 'x', this.dataX);
    };

    fightCondition() {
        if (this.enemy[0].life <= 0) {
            let dataEnemy = $(`[data-player = ${this.enemy[0].dataAttr}]`);

            // met à met la vie de l'ennemi à 0
            this.enemy[0].life = 0;
            this.enemy[0].updatePlayerDom(this.enemy[0]);

            this.endFightAnimations(dataEnemy);
        } else {
            // sinon met à jour les classes du DOM
            $(`[data-player = ${this.player.dataAttr}]`).removeClass('current-player');

            // met les données du tableau du joueur
            this.enemy[0].updatePlayerDom(this.enemy[0]);


            // sélectionne l'autre joueur
            Utils.selectPlayer();

            // relance un tour
            new Turn();
        };
    };

    classOnDefense() {
        $('.cell').removeClass('attack-now');
        $('.cell').removeClass('attacked');

        $(`[data-player = ${this.player.dataAttr}]`).addClass('protect');
    };

    classOnAttack() {
        $('.cell').removeClass('attack-now');
        $('.cell').removeClass('attacked');

        // Retire le bouclier de l'ennemi si il en a un
        $(`[data-player = ${this.enemy[0].dataAttr}]`).removeClass('protect');

        // barre de vie css
        $(`.${this.enemy[0].dataAttr} .life-line`).css('width', `${this.enemy[0].life}%`);

        if (this.enemy[0].life < 20) {
            $(`.${this.enemy[0].dataAttr} .life-line`).addClass('-red').removeClass('-orange');
        }

        else if (this.enemy[0].life < 40) {
            $(`.${this.enemy[0].dataAttr} .life-line`).addClass('-orange').removeClass('-yellow');
        }

        else if (this.enemy[0].life < 60) {
            $(`.${this.enemy[0].dataAttr} .life-line`).addClass('-yellow');
        }

        // classe qui ajoute une animation visuelle
        $('.current-player').addClass('attack-now');
        $(`[data-player = ${this.enemy[0].dataAttr}]`).addClass('attacked');
    };

    damagesOnHit() {
        // dégat selon l'arme possédée
        if (this.currentPlayerWeapon.damage) {
            this.enemy[0].protect ? this.enemy[0].life -= this.currentPlayerWeapon.damage / 2 : this.enemy[0].life -= this.currentPlayerWeapon.damage;
        } else {
            this.enemy[0].protect ? this.enemy[0].life -= 1 : this.enemy[0].life -= 2;
        };
    };

    zoomOnFight() {
        // supprimer toutes les cases qui ne contiennent pas les joueurs
        let hasNotPlayer = $(".cell:not(.player)");

        hasNotPlayer.addClass('disapered');
        $('.fight-time-text').addClass('active');

        setTimeout(() => {
            hasNotPlayer.hide();
            $('.cells').addClass('-flex-cells');
        }, 1000)
    };

    endFightAnimations(dataEnemy) {
        setTimeout(() => {
            $('.cell').removeClass('attacked attack-now');
            dataEnemy.addClass('you-loose');
        }, 500);

        setTimeout(() => {
            $(`[data-player = ${this.player.dataAttr}]`).addClass('you-win');
        }, 700);

        // si l'ennemi n'a plus de vie, affiche l'écran de fin
        setTimeout(() => {
            $('.win-screen').addClass('active');
            $('.img-winner').addClass(this.player.dataAttr);
            $('.winner-win-text').text(`${this.player.name}`);
        }, 3000);
    }
};
