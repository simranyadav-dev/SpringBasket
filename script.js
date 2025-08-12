 let canvas, ctx;
        let gameState = {
            score: 0,
            highScore: localStorage.getItem('springBasketHighScore') || 0,
            speed: 1,
            scene: 0,
            gameRunning: false,
            basket: { x: 400, y: 450, width: 60, height: 40 },
            balls: [],
            obstacles: [],
            particles: [],
            mouseX: 400,
            lastSpeedIncrease: 0,
            lastSceneChange: 0
        };

        const scenes = [
            { name: 'Spring Garden 🌸', bg: ['#87ceeb', '#98fb98'], decorations: '🌸🌺🌼' },
            { name: 'Cherry Blossom 🌸', bg: ['#ffb6c1', '#98fb98'], decorations: '🌸🌸🌸' },
            { name: 'Tulip Field 🌷', bg: ['#dda0dd', '#90ee90'], decorations: '🌷🌹🌻' },
            { name: 'Butterfly Meadow 🦋', bg: ['#add8e6', '#98fb98'], decorations: '🦋🌿🌼' }
        ];

        // Initialize game
        function initGame() {
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            
            // Set up event listeners
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('touchmove', handleTouchMove);
            
            updateHighScore();
        }

        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            gameState.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        }

        function handleTouchMove(e) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            gameState.mouseX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
        }

        function startGame() {
            showPage('gamePage');
            resetGame();
            gameState.gameRunning = true;
            gameLoop();
        }

        function resetGame() {
            gameState.score = 0;
            gameState.speed = 1;
            gameState.scene = 0;
            gameState.lastSpeedIncrease = 0;
            gameState.lastSceneChange = 0;
            gameState.basket.x = 400;
            gameState.balls = [];
            gameState.obstacles = [];
            gameState.particles = [];
            document.getElementById('gameOverOverlay').classList.remove('show');
            updateUI();
        }

        function gameLoop() {
            if (!gameState.gameRunning) return;

            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        function update() {
            // Move basket towards mouse
            const targetX = Math.max(30, Math.min(canvas.width - 30, gameState.mouseX));
            gameState.basket.x += (targetX - gameState.basket.x) * 0.1;

            // Check for speed increase
            if (gameState.score >= gameState.lastSpeedIncrease + 30) {
                gameState.speed += 0.3;
                gameState.lastSpeedIncrease = Math.floor(gameState.score / 30) * 30;
                updateUI();
            }

            // Check for scene change
            if (gameState.score >= gameState.lastSceneChange + 40) {
                gameState.scene = (gameState.scene + 1) % scenes.length;
                gameState.lastSceneChange = Math.floor(gameState.score / 40) * 40;
                document.getElementById('sceneIndicator').textContent = scenes[gameState.scene].name;
                
                // Add celebration particles
                for (let i = 0; i < 20; i++) {
                    gameState.particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * 200,
                        vx: (Math.random() - 0.5) * 4,
                        vy: Math.random() * 2,
                        life: 60,
                        color: '#ff69b4'
                    });
                }
            }

            // Spawn blue balls
            if (Math.random() < 0.02 * gameState.speed) {
                gameState.balls.push({
                    x: Math.random() * (canvas.width - 20),
                    y: -20,
                    size: 15,
                    speed: 2 * gameState.speed
                });
            }

            // Spawn obstacles
            if (Math.random() < 0.015 * gameState.speed) {
                gameState.obstacles.push({
                    x: Math.random() * (canvas.width - 30),
                    y: -30,
                    width: 30,
                    height: 30,
                    speed: 3 * gameState.speed
                });
            }

            // Update balls
            for (let i = gameState.balls.length - 1; i >= 0; i--) {
                const ball = gameState.balls[i];
                ball.y += ball.speed;

                // Check collision with basket
                if (ball.x > gameState.basket.x - 30 && ball.x < gameState.basket.x + 30 &&
                    ball.y > gameState.basket.y - 20 && ball.y < gameState.basket.y + 20) {
                    gameState.score += 1;
                    gameState.balls.splice(i, 1);
                    updateUI();

                    // Add collection particles
                    for (let j = 0; j < 10; j++) {
                        gameState.particles.push({
                            x: ball.x,
                            y: ball.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 30,
                            color: '#4169e1'
                        });
                    }
                } else if (ball.y > canvas.height) {
                    gameState.balls.splice(i, 1);
                }
            }

            // Update obstacles
            for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
                const obstacle = gameState.obstacles[i];
                obstacle.y += obstacle.speed;

                // Check collision with basket
                if (obstacle.x < gameState.basket.x + 30 && obstacle.x + obstacle.width > gameState.basket.x - 30 &&
                    obstacle.y < gameState.basket.y + 20 && obstacle.y + obstacle.height > gameState.basket.y - 20) {
                    endGame();
                    return;
                }

                if (obstacle.y > canvas.height) {
                    gameState.obstacles.splice(i, 1);
                }
            }

            // Update particles
            for (let i = gameState.particles.length - 1; i >= 0; i--) {
                const particle = gameState.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.vx *= 0.98;
                particle.vy *= 0.98;

                if (particle.life <= 0) {
                    gameState.particles.splice(i, 1);
                }
            }
        }

        function render() {
            const scene = scenes[gameState.scene];
            
            // Clear and set background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, scene.bg[0]);
            gradient.addColorStop(1, scene.bg[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw floating decorations
            ctx.font = '20px Arial';
            for (let i = 0; i < 8; i++) {
                const x = (i * 100 + Math.sin(Date.now() * 0.001 + i) * 20) % canvas.width;
                const y = 50 + Math.sin(Date.now() * 0.002 + i) * 30;
                ctx.fillText(scene.decorations[i % scene.decorations.length], x, y);
            }

            // Draw basket
            drawBasket(gameState.basket.x, gameState.basket.y);

            // Draw blue balls
            ctx.fillStyle = '#4169e1';
            gameState.balls.forEach(ball => {
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Ball shine
                ctx.fillStyle = '#87ceeb';
                ctx.beginPath();
                ctx.arc(ball.x - 5, ball.y - 5, ball.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4169e1';
            });

            // Draw obstacles
            ctx.fillStyle = '#dc143c';
            gameState.obstacles.forEach(obstacle => {
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Add danger pattern
                ctx.fillStyle = '#8b0000';
                ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
                ctx.fillStyle = '#dc143c';
            });

            // Draw particles
            gameState.particles.forEach(particle => {
                const alpha = particle.life / 60;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            });
            ctx.globalAlpha = 1;
        }

        function drawBasket(x, y) {
            // Basket body
            ctx.fillStyle = '#deb887';
            ctx.fillRect(x - 30, y - 15, 60, 30);
            
            // Basket pattern
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 30 + i * 10, y - 15);
                ctx.lineTo(x - 30 + i * 10, y + 15);
                ctx.stroke();
            }
            
            // Handle
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y - 20, 20, Math.PI, 0);
            ctx.stroke();
        }

        function endGame() {
            gameState.gameRunning = false;
            
            // Update high score
            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                localStorage.setItem('springBasketHighScore', gameState.highScore);
                updateHighScore();
            }
            
            // Show game over screen
            document.getElementById('finalScore').textContent = `Final Score: ${gameState.score}`;
            document.getElementById('gameOverOverlay').classList.add('show');
        }

        function restartGame() {
            resetGame();
            gameState.gameRunning = true;
            gameLoop();
        }

        function updateUI() {
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('speed').textContent = gameState.speed.toFixed(1);
        }

        function updateHighScore() {
            document.getElementById('highScore').textContent = gameState.highScore;
        }

        // Page navigation
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
        }

        function showWelcome() {
            showPage('welcomePage');
            gameState.gameRunning = false;
        }

        function showInstructions() {
            showPage('instructionsPage');
        }

        // Theme functions
        function toggleThemeDropdown() {
            const dropdown = document.getElementById('themeDropdown');
            dropdown.classList.toggle('active');
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }

        function changeTheme(themeName) {
            const body = document.body;
            
            // Remove all theme classes
            body.classList.remove('theme-pastel-pink', 'theme-pastel-blue', 'theme-pastel-lavender', 
                              'theme-pastel-mint', 'theme-beige-warm', 'theme-beige-cream', 'theme-beige-sand');
            
            // Add new theme class if not default
            if (themeName !== 'default') {
                body.classList.add('theme-' + themeName);
            }
            
            // Save theme preference
            localStorage.setItem('springBasketColorTheme', themeName);
            
            // Close dropdown
            document.getElementById('themeDropdown').classList.remove('active');
        }

        // Theme toggle
        function toggleDarkMode() {
            const body = document.body;
            const themeToggle = document.querySelector('.theme-toggle');
            
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                themeToggle.innerHTML = '☀️ Light';
                localStorage.setItem('springBasketTheme', 'dark');
            } else {
                themeToggle.innerHTML = '🌙 Dark';
                localStorage.setItem('springBasketTheme', 'light');
            }
        }

        // Initialize theme
        function initTheme() {
            const savedTheme = localStorage.getItem('springBasketTheme');
            const savedColorTheme = localStorage.getItem('springBasketColorTheme');
            
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                document.querySelector('.theme-toggle').innerHTML = '☀️ Light ';
            }
            
            if (savedColorTheme && savedColorTheme !== 'default') {
                document.body.classList.add('theme-' + savedColorTheme);
            }
        }

        // Initialize everything when page loads
        window.addEventListener('load', () => {
            initGame();
            initTheme();
            initFallingFlowers();
        });

        // Falling flowers animation
        function initFallingFlowers() {
            const fallingFlowersContainer = document.getElementById('fallingFlowers');
            const flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🌹', '💐'];
            
            function createFallingFlower() {
                const flower = document.createElement('div');
                flower.className = 'falling-flower';
                flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
                flower.style.left = Math.random() * 100 + '%';
                flower.style.animationDuration = (Math.random() * 3 + 4) + 's'; // 4-7 seconds
                flower.style.animationDelay = Math.random() * 2 + 's';
                flower.style.fontSize = (Math.random() * 0.5 + 1) + 'rem'; // 1-1.5rem
                
                fallingFlowersContainer.appendChild(flower);
                
                // Remove flower after animation completes
                setTimeout(() => {
                    if (flower.parentNode) {
                        flower.parentNode.removeChild(flower);
                    }
                }, 10000);
            }
            
            // Create flowers continuously
            setInterval(createFallingFlower, 300); // New flower every 300ms
        }
  