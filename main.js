class ScreamingGoatSimulator {
  constructor() {
    this.canvas = document.getElementById("goatCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.goats = [];
    this.audioContext = null;
    this.audioBuffers = [];
    this.screamCount = 0;
    this.goatCount = 0;
    this.isRunning = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.volume = 0.7;
    this.isSoundPlaying = false;

    this.init();
  }

  async init() {
    await this.loadAudio();
    this.setupEventListeners();
    this.createInitialGoats();
    this.animate();
  }

  async loadAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const soundFiles = [
        "assets/goat-sounds/goat1.mp3",
        "assets/goat-sounds/goat2.mp3",
        "assets/goat-sounds/goat3.mp3",
      ];
      for (const file of soundFiles) {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        this.audioBuffers.push(audioBuffer);
      }
      console.log("Audio system initialized and sounds loaded.");
    } catch (error) {
      console.error("Audio initialization failed:", error);
    }
  }

  createGoatSound() {
    if (
      !this.audioContext ||
      this.audioBuffers.length === 0 ||
      this.isSoundPlaying
    )
      return;

    this.isSoundPlaying = true;

    try {
      const source = this.audioContext.createBufferSource();
      const randomIndex = Math.floor(Math.random() * this.audioBuffers.length);
      source.buffer = this.audioBuffers[randomIndex];

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      source.onended = () => {
        this.isSoundPlaying = false;
      };

      this.screamCount++;
      document.getElementById("screamCount").textContent = this.screamCount;
    } catch (error) {
      console.error("Error playing goat sound:", error);
      this.isSoundPlaying = false;
    }
  }

  setupEventListeners() {
    // Mouse movement tracking
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      if (this.isRunning) {
        this.scareGoats();
      }
    });

    // Control buttons
    document.getElementById("startBtn").addEventListener("click", () => {
      this.startSimulation();
    });

    document.getElementById("stopBtn").addEventListener("click", () => {
      this.stopSimulation();
    });

    // Volume control
    document.getElementById("volume").addEventListener("input", (e) => {
      this.volume = parseFloat(e.target.value);
    });

    // Add goats on click
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addGoat(x, y);
    });
  }

  createInitialGoats() {
    // Create some initial goats scattered around
    for (let i = 0; i < 5; i++) {
      this.addGoat(
        50 + Math.random() * (this.canvas.width - 100),
        50 + Math.random() * (this.canvas.height - 100)
      );
    }
  }

  addGoat(x, y) {
    const goat = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: 20 + Math.random() * 20,
      speed: 2 + Math.random() * 3,
      scared: false,
      scaredTimer: 0,
      color: `hsl(${30 + Math.random() * 30}, 70%, 50%)`,
    };

    this.goats.push(goat);
    this.goatCount++;
    document.getElementById("goatCount").textContent = this.goatCount;
  }

  scareGoats() {
    // Only scare goats occasionally to avoid audio spam
    if (Math.random() < 0.3) {
      this.createGoatSound();
    }

    this.goats.forEach((goat) => {
      // Calculate distance to mouse
      const dx = goat.x - this.mouseX;
      const dy = goat.y - this.mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If mouse is close, scare the goat
      if (distance < 100) {
        goat.scared = true;
        goat.scaredTimer = 30; // Stay scared for 30 frames

        // Run away from mouse
        const angle = Math.atan2(dy, dx);
        goat.vx = Math.cos(angle) * goat.speed * 2;
        goat.vy = Math.sin(angle) * goat.speed * 2;
      }
    });
  }

  updateGoats() {
    this.goats.forEach((goat) => {
      // Update scared timer
      if (goat.scared) {
        goat.scaredTimer--;
        if (goat.scaredTimer <= 0) {
          goat.scared = false;
        }
      }

      // Apply velocity
      goat.x += goat.vx;
      goat.y += goat.vy;

      // Bounce off walls
      if (goat.x < 0 || goat.x > this.canvas.width) {
        goat.vx *= -1;
        goat.x = Math.max(0, Math.min(this.canvas.width, goat.x));
      }
      if (goat.y < 0 || goat.y > this.canvas.height) {
        goat.vy *= -1;
        goat.y = Math.max(0, Math.min(this.canvas.height, goat.y));
      }

      // Slow down gradually if not scared
      if (!goat.scared) {
        goat.vx *= 0.98;
        goat.vy *= 0.98;

        // Add some random movement
        if (Math.random() < 0.02) {
          goat.vx += (Math.random() - 0.5) * 0.5;
          goat.vy += (Math.random() - 0.5) * 0.5;
        }
      }
    });
  }

  drawGoats() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.goats.forEach((goat) => {
      this.ctx.save();
      this.ctx.translate(goat.x, goat.y);

      const angle = Math.atan2(goat.vy, goat.vx) + Math.PI / 2;
      this.ctx.rotate(angle);

      const s = goat.size; // Use s as a shorthand for goat.size

      // Set colors
      const bodyColor = goat.scared ? "#ff4444" : goat.color;
      const hornColor = "#8B4513";
      const eyeColor = "white";
      const pupilColor = "black";
      const legColor = goat.color;

      // Legs (draw them first so they are behind the body)
      this.ctx.fillStyle = legColor;
      this.ctx.beginPath();
      // Front-left
      this.ctx.fillRect(-s / 2, s / 2, s / 4, s / 2);
      // Front-right
      this.ctx.fillRect(s / 4, s / 2, s / 4, s / 2);
      // Back-left
      this.ctx.fillRect(-s / 2, -s, s / 4, s / 2);
      // Back-right
      this.ctx.fillRect(s / 4, -s, s / 4, s / 2);
      this.ctx.fill();


      // Body (an ellipse)
      this.ctx.fillStyle = bodyColor;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, s / 1.5, s, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Head
      this.ctx.beginPath();
      this.ctx.ellipse(0, -s, s / 2, s / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Eyes
      this.ctx.fillStyle = eyeColor;
      this.ctx.beginPath();
      this.ctx.arc(-s / 4, -s - s/10, s / 8, 0, Math.PI * 2); // Left eye
      this.ctx.arc(s / 4, -s - s/10, s / 8, 0, Math.PI * 2);  // Right eye
      this.ctx.fill();

      // Pupils
      this.ctx.fillStyle = pupilColor;
      this.ctx.beginPath();
      const pupilOffset = goat.scared ? s / 20 : 0;
      this.ctx.arc(-s / 4 + pupilOffset, -s - s/10, s / 16, 0, Math.PI * 2);
      this.ctx.arc(s / 4 - pupilOffset, -s - s/10, s / 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Horns (curved)
      this.ctx.strokeStyle = hornColor;
      this.ctx.lineWidth = s / 8;
      this.ctx.beginPath();
      this.ctx.moveTo(-s / 4, -s - s / 4);
      this.ctx.quadraticCurveTo(-s / 2, -s - s / 2, -s / 3, -s - s);
      this.ctx.moveTo(s / 4, -s - s / 4);
      this.ctx.quadraticCurveTo(s / 2, -s - s / 2, s / 3, -s - s);
      this.ctx.stroke();
      
      // Beard
      this.ctx.fillStyle = bodyColor;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -s / 1.8);
      this.ctx.lineTo(-s/8, -s/1.8 + s/4);
      this.ctx.lineTo(s/8, -s/1.8 + s/4);
      this.ctx.closePath();
      this.ctx.fill();

      // Tail
      this.ctx.fillStyle = bodyColor;
      this.ctx.beginPath();
      this.ctx.arc(0, s, s / 4, 0, Math.PI);
      this.ctx.fill();


      this.ctx.restore();
    });
  }

  animate() {
    if (this.isRunning) {
      this.updateGoats();
      this.drawGoats();
    }
    requestAnimationFrame(() => this.animate());
  }

  startSimulation() {
    this.isRunning = true;
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
  }

  stopSimulation() {
    this.isRunning = false;
    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  }
}

// Initialize the simulator when page loads
document.addEventListener("DOMContentLoaded", () => {
  new ScreamingGoatSimulator();
});