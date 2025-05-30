// 游戏配置常量
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const BLOCK_SIZE = 20;
const GAME_SPEED = 10;

// 颜色定义
const COLORS = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#FF0000',
    darkRed: '#DC143C',
    green: '#00FF00',
    darkGreen: '#228B22',
    lightGreen: '#90EE90',
    gray: '#C8C8C8',
    darkGray: '#646464',
    skyBlue: '#87CEEB',
    gold: '#FFD700',
    purple: '#800080',
    yellow: '#FFFF00',
    pink: '#FFC0CB',
    darkPink: '#FF96AA',
    brown: '#A52A2A',
    lightBrown: '#D2691E'
};

// 游戏状态对象 - 修复语法错误
let gameState = {
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    snake: [],
    direction: { x: BLOCK_SIZE, y: 0 },
    food: { x: 0, y: 0 },
    bomb: { x: -100, y: -100, exists: false, timer: 0 },
    effects: {
        food: { frames: 0, position: null },
        bomb: { frames: 0, position: null }
    }, // 修复：添加缺少的逗号
    particles: [] // 粒子数组
};

/**
 * 粒子类 - 用于创建背景装饰效果
 * 每个粒子都有位置、速度、生命值等属性
 */
class Particle {
    constructor(x, y) {
        this.x = x; // 粒子的X坐标
        this.y = y; // 粒子的Y坐标
        this.vx = (Math.random() - 0.5) * 2; // X方向的速度
        this.vy = (Math.random() - 0.5) * 2; // Y方向的速度
        this.life = 1.0; // 生命值，从1开始逐渐减少到0
        this.decay = Math.random() * 0.02 + 0.01; // 生命值减少的速度
        this.size = Math.random() * 3 + 1; // 粒子的大小
    }
    
    /**
     * 更新粒子状态
     * 每帧调用，更新位置和生命值
     */
    update() {
        this.x += this.vx; // 根据速度更新X坐标
        this.y += this.vy; // 根据速度更新Y坐标
        this.life -= this.decay; // 减少生命值
        this.size *= 0.99; // 粒子逐渐变小
    }
    
    /**
     * 绘制粒子
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        ctx.save(); // 保存当前画布状态
        ctx.globalAlpha = this.life; // 设置透明度为生命值
        ctx.fillStyle = `hsl(${Math.random() * 60 + 60}, 70%, 80%)`; // 黄绿色调
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI); // 绘制圆形粒子
        ctx.fill();
        ctx.restore(); // 恢复画布状态
    }
    
    /**
     * 检查粒子是否应该被移除
     * @returns {boolean} 如果粒子生命值耗尽或太小则返回true
     */
    isDead() {
        return this.life <= 0 || this.size <= 0.1;
    }
}

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const finalScoreElement = document.getElementById('finalScore');

// 按钮事件监听
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('restartGameBtn').addEventListener('click', startGame);
document.getElementById('exitGameBtn').addEventListener('click', () => {
    showStartScreen();
});
document.getElementById('resumeBtn').addEventListener('click', resumeGame);

// 键盘事件监听
document.addEventListener('keydown', handleKeyPress);

/**
 * 初始化游戏
 * 设置蛇的初始位置、生成第一个食物等
 */
function initGame() {
    // 重置游戏状态
    gameState.score = 0;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    
    // 初始化蛇的位置（屏幕中央）
    const centerX = Math.floor(CANVAS_WIDTH / 2 / BLOCK_SIZE) * BLOCK_SIZE;
    const centerY = Math.floor(CANVAS_HEIGHT / 2 / BLOCK_SIZE) * BLOCK_SIZE;
    gameState.snake = [{ x: centerX, y: centerY }];
    
    // 设置初始方向（向右）
    gameState.direction = { x: BLOCK_SIZE, y: 0 };
    
    // 生成第一个食物
    generateFood();
    
    // 重置炸弹
    gameState.bomb = { x: -100, y: -100, exists: false, timer: 0 };
    
    // 重置特效
    gameState.effects = {
        food: { frames: 0, position: null },
        bomb: { frames: 0, position: null }
    };
    
    // 清空粒子数组
    gameState.particles = [];
    
    // 更新分数显示
    updateScore();
}

/**
 * 开始游戏
 * 隐藏开始界面，初始化游戏状态，开始游戏循环
 */
function startGame() {
    hideAllScreens();
    initGame();
    gameLoop();
}

/**
 * 暂停/恢复游戏
 */
function togglePause() {
    if (!gameState.isRunning || gameState.isGameOver) return;
    
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        showPauseScreen();
    } else {
        hidePauseScreen();
        gameLoop();
    }
}

/**
 * 恢复游戏
 */
function resumeGame() {
    gameState.isPaused = false;
    hidePauseScreen();
    gameLoop();
}

/**
 * 处理键盘输入
 * @param {KeyboardEvent} event - 键盘事件
 */
// 在现有的按钮事件监听后添加虚拟方向键事件监听
document.getElementById('upBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDirectionTouch('up');
});

document.getElementById('downBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDirectionTouch('down');
});

document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDirectionTouch('left');
});

document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleDirectionTouch('right');
});

// 同时支持点击事件（用于桌面端测试）
document.getElementById('upBtn').addEventListener('click', () => handleDirectionClick('up'));
document.getElementById('downBtn').addEventListener('click', () => handleDirectionClick('down'));
document.getElementById('leftBtn').addEventListener('click', () => handleDirectionClick('left'));
document.getElementById('rightBtn').addEventListener('click', () => handleDirectionClick('right'));

/**
 * 处理虚拟方向键触摸事件
 * @param {string} direction - 方向：'up', 'down', 'left', 'right'
 */
function handleDirectionTouch(direction) {
    if (!gameState.isRunning || gameState.isGameOver || gameState.isPaused) return;
    
    changeDirection(direction);
    
    // 添加触觉反馈（如果设备支持）
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

/**
 * 处理虚拟方向键点击事件
 * @param {string} direction - 方向：'up', 'down', 'left', 'right'
 */
function handleDirectionClick(direction) {
    if (!gameState.isRunning || gameState.isGameOver || gameState.isPaused) return;
    
    changeDirection(direction);
}

/**
 * 改变蛇的移动方向
 * @param {string} direction - 方向：'up', 'down', 'left', 'right'
 */
function changeDirection(direction) {
    switch (direction) {
        case 'up':
            if (gameState.direction.y !== BLOCK_SIZE) {
                gameState.direction = { x: 0, y: -BLOCK_SIZE };
            }
            break;
        case 'down':
            if (gameState.direction.y !== -BLOCK_SIZE) {
                gameState.direction = { x: 0, y: BLOCK_SIZE };
            }
            break;
        case 'left':
            if (gameState.direction.x !== BLOCK_SIZE) {
                gameState.direction = { x: -BLOCK_SIZE, y: 0 };
            }
            break;
        case 'right':
            if (gameState.direction.x !== -BLOCK_SIZE) {
                gameState.direction = { x: BLOCK_SIZE, y: 0 };
            }
            break;
    }
}

// 修改现有的 handleKeyPress 函数，使用新的 changeDirection 函数
function handleKeyPress(event) {
    if (!gameState.isRunning || gameState.isGameOver) return;
    
    switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            changeDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            changeDirection('right');
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            changeDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            changeDirection('down');
            break;
        case 'p':
        case 'P':
        case ' ':
            event.preventDefault();
            togglePause();
            break;
    }
}

/**
 * 生成食物
 * 确保食物不会生成在蛇身或炸弹上
 */
function generateFood() {
    do {
        gameState.food.x = Math.floor(Math.random() * (CANVAS_WIDTH / BLOCK_SIZE)) * BLOCK_SIZE;
        gameState.food.y = Math.floor(Math.random() * (CANVAS_HEIGHT / BLOCK_SIZE)) * BLOCK_SIZE;
    } while (
        isPositionOnSnake(gameState.food.x, gameState.food.y) ||
        (gameState.bomb.exists && gameState.food.x === gameState.bomb.x && gameState.food.y === gameState.bomb.y)
    );
}

/**
 * 生成炸弹
 * 确保炸弹不会生成在蛇身上或食物上
 */
function generateBomb() {
    do {
        gameState.bomb.x = Math.floor(Math.random() * (CANVAS_WIDTH / BLOCK_SIZE)) * BLOCK_SIZE;
        gameState.bomb.y = Math.floor(Math.random() * (CANVAS_HEIGHT / BLOCK_SIZE)) * BLOCK_SIZE;
    } while (
        isPositionOnSnake(gameState.bomb.x, gameState.bomb.y) ||
        (gameState.bomb.x === gameState.food.x && gameState.bomb.y === gameState.food.y)
    );
    
    gameState.bomb.exists = true;
    gameState.bomb.timer = 0;
}

/**
 * 检查指定位置是否在蛇身上
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @returns {boolean} 是否在蛇身上
 */
function isPositionOnSnake(x, y) {
    return gameState.snake.some(segment => segment.x === x && segment.y === y);
}

/**
 * 更新游戏状态
 * 包括蛇的移动、碰撞检测、食物和炸弹的处理
 */
function update() {
    if (gameState.isPaused || gameState.isGameOver) return;
    
    // 计算蛇头的新位置
    const head = { ...gameState.snake[gameState.snake.length - 1] };
    head.x += gameState.direction.x;
    head.y += gameState.direction.y;
    
    // 检查边界碰撞
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
        gameOver();
        return;
    }
    
    // 检查自身碰撞
    for (let i = 0; i < gameState.snake.length; i++) {
        if (gameState.snake[i].x === head.x && gameState.snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // 添加新的蛇头
    gameState.snake.push(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        gameState.score++;
        updateScore();
        generateFood();
        
        // 触发食物特效
        gameState.effects.food.frames = 10;
        gameState.effects.food.position = { x: head.x + BLOCK_SIZE / 2, y: head.y + BLOCK_SIZE / 2 };
    } else {
        // 如果没有吃到食物，移除蛇尾
        gameState.snake.shift();
    }
    
    // 检查是否吃到炸弹
    if (gameState.bomb.exists && head.x === gameState.bomb.x && head.y === gameState.bomb.y) {
        // 蛇的长度减半，但最小为1
        const newLength = Math.max(1, Math.floor(gameState.snake.length / 2));
        gameState.snake = gameState.snake.slice(-newLength);
        
        // 分数也减半，但最小为0
        gameState.score = Math.max(0, Math.floor(gameState.score / 2));
        updateScore();
        
        // 炸弹消失
        gameState.bomb.exists = false;
        gameState.bomb.timer = 0;
        
        // 触发炸弹特效
        gameState.effects.bomb.frames = 10;
        gameState.effects.bomb.position = { x: head.x + BLOCK_SIZE / 2, y: head.y + BLOCK_SIZE / 2 };
    }
    
    // 处理炸弹生成
    if (!gameState.bomb.exists) {
        gameState.bomb.timer++;
        // 每隔一段时间有10%的几率生成炸弹
        if (gameState.bomb.timer >= 50 && Math.random() < 0.1) {
            generateBomb();
        }
    }
}

/**
 * 渲染游戏画面
 * 绘制背景、蛇、食物、炸弹和特效
 */
function render() {
    // 清空画布并绘制背景
    ctx.fillStyle = COLORS.skyBlue;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制背景纹理
    drawBackgroundTexture();
    
    // 绘制食物（香肠）
    drawFood(gameState.food.x, gameState.food.y);
    
    // 绘制炸弹
    if (gameState.bomb.exists) {
        drawBomb(gameState.bomb.x, gameState.bomb.y);
    }
    
    // 绘制蛇（小猪）
    drawSnake();
    
    // 绘制特效
    if (gameState.effects.food.frames > 0) {
        drawEffect(gameState.effects.food.position, gameState.effects.food.frames, COLORS.purple);
        gameState.effects.food.frames--;
    }
    
    if (gameState.effects.bomb.frames > 0) {
        drawEffect(gameState.effects.bomb.position, gameState.effects.bomb.frames, COLORS.yellow);
        gameState.effects.bomb.frames--;
    }
}

/**
 * 绘制背景纹理和粒子效果
 * 添加一些随机的小点作为纹理，以及动态粒子效果
 */
function drawBackgroundTexture() {
    // 绘制静态背景纹理点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 添加粒子效果
    // 随机生成新粒子
    if (Math.random() < 0.1) {
        gameState.particles.push(new Particle(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT
        ));
    }
    
    // 更新和绘制粒子
    gameState.particles = gameState.particles.filter(particle => {
        particle.update();
        particle.draw(ctx);
        return !particle.isDead();
    });
}

/**
 * 绘制蛇（小猪）
 * 包括渐变色、眼睛、鼻子和耳朵等细节
 */
function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        // 创建渐变色
        const ratio = index / Math.max(1, gameState.snake.length - 1);
        const r = Math.floor(255 * (0.59 + 0.41 * ratio)); // 从深粉色到粉色
        const g = Math.floor(255 * (0.59 + 0.16 * ratio));
        const b = Math.floor(255 * (0.67 + 0.13 * ratio));
        
        // 绘制圆角矩形作为猪身
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        drawRoundedRect(segment.x, segment.y, BLOCK_SIZE, BLOCK_SIZE, 8);
        
        // 添加边框
        ctx.strokeStyle = COLORS.darkPink;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 如果是猪头（最后一个片段），添加眼睛和鼻子
        if (index === gameState.snake.length - 1) {
            drawPigFace(segment.x, segment.y);
        }
    });
}

/**
 * 绘制猪脸
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function drawPigFace(x, y) {
    // 计算耳朵上下摆动的角度（基于当前时间）
    const time = Date.now() * 0.009; // 控制摆动速度，稍微快一点
    const earBounce = Math.sin(time) * 3; // 上下摆动的像素距离
    
    // 先绘制耳朵（在头部后面）
    ctx.fillStyle = COLORS.darkPink;
    
    // 左耳 - 添加上下摆动效果
    ctx.beginPath();
    ctx.ellipse(x + BLOCK_SIZE * 0.2, y + BLOCK_SIZE * 0.1 + earBounce, 4, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 右耳 - 添加上下摆动效果（稍微延迟一点，让摆动更自然）
    ctx.beginPath();
    ctx.ellipse(x + BLOCK_SIZE * 0.8, y + BLOCK_SIZE * 0.1 + Math.sin(time + 0.5) * 3, 4, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.3, y + BLOCK_SIZE * 0.3, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.7, y + BLOCK_SIZE * 0.3, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 眼珠
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.3, y + BLOCK_SIZE * 0.3, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.7, y + BLOCK_SIZE * 0.3, 1, 0, 2 * Math.PI);
    ctx.fill();
    
    // 猪鼻子
    ctx.fillStyle = COLORS.darkPink;
    ctx.fillRect(x + BLOCK_SIZE / 2 - 4, y + BLOCK_SIZE / 2, 8, 6);
    
    // 鼻孔
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.4, y + BLOCK_SIZE * 0.55, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE * 0.6, y + BLOCK_SIZE * 0.55, 1, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * 绘制食物（香肠）- 加大版本
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function drawFood(x, y) {
    // 香肠主体（椭圆形）- 变得更大
    ctx.fillStyle = COLORS.brown;
    ctx.beginPath();
    // 将香肠的大小从原来的 BLOCK_SIZE/2 和 BLOCK_SIZE/4 增加到 BLOCK_SIZE*0.7 和 BLOCK_SIZE*0.4
    ctx.ellipse(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2, BLOCK_SIZE * 0.7, BLOCK_SIZE * 0.4, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 高光效果 - 也相应变大
    ctx.fillStyle = COLORS.lightBrown;
    ctx.beginPath();
    ctx.ellipse(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 3, BLOCK_SIZE * 0.35, BLOCK_SIZE * 0.15, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // 香肠线条 - 加粗一点
    ctx.strokeStyle = COLORS.darkRed;
    ctx.lineWidth = 2; // 从1增加到2
    ctx.beginPath();
    ctx.moveTo(x + 1, y + BLOCK_SIZE / 2); // 稍微调整位置
    ctx.lineTo(x + BLOCK_SIZE - 1, y + BLOCK_SIZE / 2);
    ctx.stroke();
    
    // 添加更多香肠线条，让它看起来更像真的香肠
    ctx.beginPath();
    ctx.moveTo(x + 1, y + BLOCK_SIZE / 2 - 3);
    ctx.lineTo(x + BLOCK_SIZE - 1, y + BLOCK_SIZE / 2 - 3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 1, y + BLOCK_SIZE / 2 + 3);
    ctx.lineTo(x + BLOCK_SIZE - 1, y + BLOCK_SIZE / 2 + 3);
    ctx.stroke();
}

/**
 * 绘制炸弹
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function drawBomb(x, y) {
    // 炸弹主体
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2, BLOCK_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 高光效果
    ctx.fillStyle = COLORS.darkGray;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE / 3, y + BLOCK_SIZE / 3, BLOCK_SIZE / 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // 炸弹引线
    ctx.strokeStyle = COLORS.gray;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + BLOCK_SIZE / 2, y);
    ctx.lineTo(x + BLOCK_SIZE / 2 + 5, y - 8);
    ctx.stroke();
    
    // 火花
    ctx.fillStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE / 2 + 5, y - 8, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(x + BLOCK_SIZE / 2 + 5, y - 8, 2, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * 绘制特效
 * @param {Object} position - 特效位置
 * @param {number} frames - 剩余帧数
 * @param {string} color - 特效颜色
 */
function drawEffect(position, frames, color) {
    if (!position || frames <= 0) return;
    
    const maxRadius = 30;
    const radius = maxRadius * (frames / 10);
    const alpha = 1 - (frames / 10);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

/**
 * 绘制圆角矩形
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} radius - 圆角半径
 */
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

/**
 * 更新分数显示
 */
function updateScore() {
    scoreElement.textContent = `分数: ${gameState.score}`;
    scoreElement.style.color = gameState.score > 10 ? COLORS.gold : COLORS.black;
}

/**
 * 游戏结束
 */
function gameOver() {
    gameState.isGameOver = true;
    gameState.isRunning = false;
    finalScoreElement.textContent = `最终分数: ${gameState.score}`;
    showGameOverScreen();
}

/**
 * 显示开始界面
 */
function showStartScreen() {
    startScreen.style.display = 'flex';
}

/**
 * 显示游戏结束界面
 */
function showGameOverScreen() {
    gameOverScreen.style.display = 'flex';
}

/**
 * 显示暂停界面
 */
function showPauseScreen() {
    pauseScreen.style.display = 'flex';
}

/**
 * 隐藏暂停界面
 */
function hidePauseScreen() {
    pauseScreen.style.display = 'none';
}

/**
 * 隐藏所有界面
 */
function hideAllScreens() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
}

/**
 * 季节主题切换功能
 * 根据时间自动切换不同的季节主题
 */
function changeSeasonTheme() {
    const themes = ['spring-theme', 'summer-theme', 'autumn-theme', 'winter-theme'];
    const currentTheme = themes[Math.floor(Date.now() / 30000) % themes.length]; // 每30秒切换
    document.body.className = currentTheme;
}

/**
 * 游戏主循环
 * 更新游戏状态并渲染画面
 */
function gameLoop() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    changeSeasonTheme(); // 切换季节主题
    update(); // 更新游戏逻辑
    render(); // 渲染画面
    
    if (gameState.isRunning && !gameState.isGameOver) {
        setTimeout(() => gameLoop(), 1000 / GAME_SPEED);
    }
}

// 初始化游戏
showStartScreen();