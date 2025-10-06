const visor = document.getElementById("visor");
const visorWrapper = document.getElementById("visorWrapper");
const zoomIndicator = document.getElementById("zoomIndicator");
const loadingProgress = document.getElementById("loadingProgress");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");
const autoRotateBtn = document.getElementById("autoRotateBtn");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const totalFrames = 190;
let currentFrame = 1;
let zoom = 1;
let isLoaded = false;
let autoRotateInterval = null;
let zoomTimeout = null;
let images = [];
let loadedImages = 0;

// Configurar el círculo de progreso
const circle = progressFill;
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Función para actualizar el progreso circular
function updateProgress(frame) {
    const progress = frame / totalFrames;
    const offset = circumference - progress * circumference;
    circle.style.strokeDashoffset = offset;
    progressText.textContent = `${frame}/${totalFrames}`;
}

// Función para actualizar el frame mostrado
function updateFrame(frame) {
    const newFrame = Math.min(Math.max(frame, 1), totalFrames);

    currentFrame = newFrame;
    
    // Verificar si la imagen está precargada
    if (images[newFrame - 1]?.complete) {
        visor.style.backgroundImage = `url('${images[newFrame - 1].src}')`;
    } else {
        // Si no está precargada, cargarla directamente
        visor.style.backgroundImage = `url('frames/frame_${newFrame}.jpg')`;
    }
    
    // Actualizar el indicador de progreso circular
    updateProgress(currentFrame);
    
    // Actualizar estado de los botones
    prevBtn.disabled = false;
    nextBtn.disabled = false;
}

// Función para actualizar el zoom
function updateZoom(newZoom) {
    zoom = Math.min(Math.max(newZoom, 1), 3);
    visor.style.transform = `scale(${zoom})`;
    
    zoomIndicator.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    zoomIndicator.classList.add('visible');
    
    clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
        zoomIndicator.classList.remove('visible');
    }, 1500);
}

// Función para reiniciar la vista
function resetView() {
    updateZoom(1);
    updateFrame(1);
    stopAutoRotation();
}

// Función para alternar la rotación automática
function toggleAutoRotation() {
    if (autoRotateInterval) {
        stopAutoRotation();
    } else {
        startAutoRotation();
    }
}

// Iniciar rotación automática
function startAutoRotation() {
    autoRotateInterval = setInterval(() => {
        updateFrame(currentFrame + 1);
    }, 10); // Rotar cada 100ms (10 fps)
    autoRotateBtn.classList.add('active');
    autoRotateBtn.textContent = "⏹ Detener rotación";
}

// Detener rotación automática
function stopAutoRotation() {
    if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
        autoRotateInterval = null;
    }
    autoRotateBtn.classList.remove('active');
    autoRotateBtn.textContent = "⟳ Auto-rotar";
}

// Precargar imágenes
function preloadImages() {
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = `frames/frame_${i}.jpg`;
        img.onload = () => {
            loadedImages++;
            const progress = Math.round((loadedImages / totalFrames) * 100);
            loadingProgress.textContent = `Cargando: ${progress}%`;
            
            if (loadedImages === totalFrames) {
                visor.classList.remove('loading');
                loadingProgress.style.display = 'none';
                isLoaded = true;
            }
        };
        img.onerror = () => {
            console.warn(`No se pudo cargar la imagen: frames/frame_${i}.jpg`);
            loadedImages++;
            // Continuar aunque falle una imagen
            if (loadedImages === totalFrames) {
                visor.classList.remove('loading');
                loadingProgress.style.display = 'none';
                isLoaded = true;
            }
        };
        images.push(img);
    }
}

// Controles de mouse (PC)
visor.addEventListener("wheel", (e) => {
    e.preventDefault();

    if (e.shiftKey || e.ctrlKey) {
        updateZoom(zoom + e.deltaY * -0.002);
    } else {
        const direction = e.deltaY > 0 ? 1 : -1;
        updateFrame(currentFrame + direction);
    }
});

// Drag para rotar (PC y móvil)
let isDragging = false;
let startX = 0;
let dragThreshold = 5;
let accumulatedDelta = 0;

visor.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    accumulatedDelta = 0;
    visor.style.cursor = 'grabbing';
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    accumulatedDelta += deltaX;
    
    // Solo actualizar el frame si se supera el umbral
    if (Math.abs(accumulatedDelta) > dragThreshold) {
        const frameChange = Math.floor(accumulatedDelta / dragThreshold);
        updateFrame(currentFrame - frameChange);
        accumulatedDelta = 0;
    }
    
    startX = e.clientX;
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    visor.style.cursor = 'grab';
});

// Touch gestos (móvil)
let touchStartX = 0;
let lastDist = 0;
let touchStartTime = 0;
let lastTouchEnd = 0;

visor.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    } else if (e.touches.length === 2) {
        lastDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
    e.preventDefault();
});

visor.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 10) {
        updateFrame(currentFrame - Math.sign(deltaX));
        touchStartX = e.touches[0].clientX;
    }
    } else if (e.touches.length === 2) {
        const newDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );

        if (lastDist > 0) {
            const scaleChange = (newDist - lastDist) * 0.01;
            updateZoom(zoom + scaleChange);
        }
        lastDist = newDist;
    }
    e.preventDefault();
});

visor.addEventListener("touchend", (e) => {
    // Detectar doble toque para resetear zoom
    const currentTime = Date.now();
    if (currentTime - lastTouchEnd < 300) {
        resetView();
    }
    lastTouchEnd = currentTime;
    
    lastDist = 0;
});

// Botones
prevBtn.addEventListener("click", () => {
    stopAutoRotation();
    updateFrame(currentFrame - 1);
});

nextBtn.addEventListener("click", () => {
    stopAutoRotation();
    updateFrame(currentFrame + 1);
});

resetBtn.addEventListener("click", resetView);
autoRotateBtn.addEventListener("click", toggleAutoRotation);

// Atajos de teclado
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        stopAutoRotation();
        updateFrame(currentFrame - 1);
    }
    if (e.key === "ArrowRight") {
        stopAutoRotation();
        updateFrame(currentFrame + 1);
    }
    if (e.key === "r" || e.key === "R") resetView();
    if (e.key === "+" || e.key === "=") updateZoom(zoom + 0.1);
    if (e.key === "-" || e.key === "_") updateZoom(zoom - 0.1);
    if (e.key === "a" || e.key === "A") toggleAutoRotation();
});

// Inicializar
updateFrame(currentFrame);
preloadImages();