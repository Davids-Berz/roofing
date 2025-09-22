/**
 * GLOBAL ANIMATIONS MANAGER - VERSIÓN CORREGIDA
 * global-animations.js
 * 
 * Sistema de animaciones globales para toda la aplicación
 */

// Declaraciones de tipos para librerías externas
export {};

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
    SplitText?: any;
    SplitType?: any;
    GlobalAnimations?: GlobalAnimationManager;
    AnimationUtils?: typeof AnimationUtils;
  }
}

interface AnimationConfig {
  trigger: string;
  animation: string;
  delay?: number;
  duration?: number;
  stagger?: number;
}

interface ModalManager {
  init(): void;
  openModal(modalId: string): void;
  closeModal(modal: HTMLElement): void;
  closeAllModals(): void;
}

interface ScrollAnimationManager {
  init(): void;
  initSplitTextAnimations(): void;
  initScrollAnimations(): void;
  initIntersectionObserver(): void;
}

class GlobalAnimationManager implements ModalManager, ScrollAnimationManager {
  private activeModal: HTMLElement | null = null;
  private scrollPosition: number = 0;
  private observer: IntersectionObserver | null = null;
  private animatedElements: Set<Element> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.init();
  }

  // ========================================
  // INICIALIZACIÓN PRINCIPAL
  // ========================================

  init(): void {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.initializeModals();
    this.loadAnimationLibraries();
    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    // Delegación de eventos para mejor rendimiento
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Limpiar al salir de la página
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Reinicializar en cambio de página (SPA)
    window.addEventListener('popstate', () => {
      this.reinitialize();
    });
  }

  private reinitialize(): void {
    this.animatedElements.clear();
    if (this.observer) {
      this.observer.disconnect();
    }
    setTimeout(() => {
      this.initIntersectionObserver();
      this.initSplitTextAnimations();
    }, 100);
  }

  // ========================================
  // SISTEMA DE MODALES
  // ========================================

  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;
    
    // Abrir modal
    const modalTrigger = target.closest('[data-modal-target]') as HTMLElement;
    if (modalTrigger) {
      e.preventDefault();
      const modalId = modalTrigger.dataset.modalTarget;
      if (modalId) this.openModal(modalId);
      return;
    }

    // Cerrar modal
    const closeBtn = target.closest('[data-modal-close], .modal__close-btn');
    if (closeBtn) {
      const modal = target.closest('.modal') as HTMLElement;
      if (modal) this.closeModal(modal);
      return;
    }

    // Cerrar por backdrop
    if (target.classList.contains('modal__backdrop')) {
      const modal = target.closest('.modal') as HTMLElement;
      if (modal) this.closeModal(modal);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.activeModal) {
      this.closeModal(this.activeModal);
    }

    // Trap focus en modal activo
    if (this.activeModal && e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  private trapFocus(e: KeyboardEvent): void {
    if (!this.activeModal) return;
    
    const focusableElements = this.activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  openModal(modalId: string): void {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (!modal) return;

    // Prevenir scroll del body
    this.scrollPosition = window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';

    this.activeModal = modal;
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus management
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea') as HTMLElement;
    firstFocusable?.focus();

    this.animateModalOpen(modal);
  }

  closeModal(modal: HTMLElement): void {
    if (!modal) return;

    modal.setAttribute('aria-hidden', 'true');
    this.activeModal = null;

    // Restaurar scroll
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, this.scrollPosition);

    this.animateModalClose(modal);
  }

  closeAllModals(): void {
    document.querySelectorAll('.modal[aria-hidden="false"]').forEach(modal => {
      this.closeModal(modal as HTMLElement);
    });
  }

  private initializeModals(): void {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  private animateModalOpen(modal: HTMLElement): void {
    if (window.gsap) {
      const backdrop = modal.querySelector('.modal__backdrop') as HTMLElement;
      const panel = modal.querySelector('.modal__panel') as HTMLElement;
      
      if (backdrop && panel) {
        const tl = window.gsap.timeline();
        tl.fromTo(backdrop, 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        .fromTo(panel, 
          { opacity: 0, y: 30, scale: 0.95 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }, 
          "<0.1"
        );
      }
    }
  }

  private animateModalClose(modal: HTMLElement): void {
    if (window.gsap) {
      const backdrop = modal.querySelector('.modal__backdrop') as HTMLElement;
      const panel = modal.querySelector('.modal__panel') as HTMLElement;
      
      if (backdrop && panel) {
        const tl = window.gsap.timeline();
        tl.to(panel, 
          { opacity: 0, y: -20, scale: 0.95, duration: 0.25, ease: "power2.in" }
        )
        .to(backdrop, 
          { opacity: 0, duration: 0.2, ease: "power1.in" }, 
          "<0.1"
        );
      }
    }
  }

  // ========================================
  // SISTEMA DE ANIMACIONES DE SCROLL - CORREGIDO
  // ========================================

  initIntersectionObserver(): void {
    // Limpiar observer anterior si existe
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animateElement(entry.target as HTMLElement);
            this.animatedElements.add(entry.target);
            // IMPORTANTE: Dejar de observar el elemento después de animarlo
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observar solo elementos que no han sido animados
    const selectors = ['.animate-on-scroll', '.feature-card'];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!this.animatedElements.has(el)) {
          this.observer?.observe(el);
        }
      });
    });
  }

  private animateElement(element: HTMLElement): void {
    const animationType = element.dataset.animation || 'fadeInUp';
    const delay = parseFloat(element.dataset.delay || '0');
    
    // Marcar elemento como animado inmediatamente para evitar duplicados
    this.animatedElements.add(element);
    
    // Si GSAP está disponible, usar animaciones GSAP
    if (window.gsap) {
      this.animateWithGSAP(element, animationType, delay);
    } else {
      // Fallback a animaciones CSS
      this.animateWithCSS(element, animationType, delay);
    }
  }

  private animateWithGSAP(element: HTMLElement, type: string, delay: number): void {
    const gsap = window.gsap;
    if (!gsap) return;

    // Establecer estado inicial
    gsap.set(element, { opacity: 0 });

    const animations = {
      fadeIn: () => gsap.to(element, { opacity: 1, duration: 0.8, delay, ease: "power2.out" }),
      fadeInUp: () => gsap.fromTo(element, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, delay, ease: "power3.out" }
      ),
      fadeInDown: () => gsap.fromTo(element, 
        { opacity: 0, y: -30 }, 
        { opacity: 1, y: 0, duration: 0.8, delay, ease: "power3.out" }
      ),
      slideInUp: () => gsap.fromTo(element, 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 1, delay, ease: "power3.out" }
      ),
      slideInLeft: () => gsap.fromTo(element, 
        { opacity: 0, x: -50 }, 
        { opacity: 1, x: 0, duration: 0.8, delay, ease: "power3.out" }
      ),
      slideInRight: () => gsap.fromTo(element, 
        { opacity: 0, x: 50 }, 
        { opacity: 1, x: 0, duration: 0.8, delay, ease: "power3.out" }
      ),
      scaleIn: () => gsap.fromTo(element, 
        { opacity: 0, scale: 0.8 }, 
        { opacity: 1, scale: 1, duration: 0.6, delay, ease: "back.out(1.7)" }
      ),
      zoomIn: () => gsap.fromTo(element, 
        { opacity: 0, scale: 0.5 }, 
        { opacity: 1, scale: 1, duration: 0.6, delay, ease: "back.out(1.7)" }
      )
    };

    const animation = animations[type as keyof typeof animations];
    if (animation) {
      animation();
    } else {
      animations.fadeInUp(); // Default fallback
    }
  }

  private animateWithCSS(element: HTMLElement, type: string, delay: number): void {
    element.style.animationDelay = `${delay}s`;
    element.classList.add('animate');
    
    // Mapear tipos de animación a clases CSS
    const cssClasses = {
      fadeIn: 'fade-in',
      fadeInUp: 'fade-in-up',
      fadeInDown: 'fade-in-down',
      slideInUp: 'slide-in-up',
      slideInLeft: 'slide-in-left',
      slideInRight: 'slide-in-right',
      scaleIn: 'scale-in',
      zoomIn: 'zoom-in'
    };

    const cssClass = cssClasses[type as keyof typeof cssClasses] || 'fade-in-up';
    element.classList.add(cssClass);
  }

  // ========================================
  // ANIMACIONES DE TEXTO SPLIT - MEJORADO
  // ========================================

  initSplitTextAnimations(): void {
    if (!window.gsap) {
      // Fallback sin GSAP para elementos split-text
      document.querySelectorAll('.split-text').forEach(el => {
        if (!this.animatedElements.has(el)) {
          this.observer?.observe(el);
        }
      });
      return;
    }

    const splitElements = document.querySelectorAll('.split-text');
    
    splitElements.forEach(el => {
      if (this.animatedElements.has(el)) return;
      
      try {
        const SplitConstructor = window.SplitText || window.SplitType;
        if (!SplitConstructor) {
          // Si no hay librería de split, usar observer normal
          this.observer?.observe(el);
          return;
        }

        const splitInstance = new SplitConstructor(el, { 
          types: 'lines,words', 
          lineClass: 'overflow-hidden' 
        });
        
        const elements = splitInstance.lines || splitInstance.words;
        if (elements && elements.length > 0) {
          // Configurar el trigger de scroll
          window.gsap.set(elements, { yPercent: 100, opacity: 0 });
          
          window.gsap.to(elements, {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            stagger: 0.03,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
              onComplete: () => {
                this.animatedElements.add(el);
              }
            }
          });
        }
      } catch (error) {
        console.warn('Error initializing text split animation:', error);
        // Fallback a animación simple
        if (!this.animatedElements.has(el)) {
          this.observer?.observe(el);
        }
      }
    });
  }

  initScrollAnimations(): void {
    if (!window.gsap || !window.ScrollTrigger) return;

    // Animaciones para imágenes y elementos especiales
    const images = document.querySelectorAll('img[class*="animate"], figure[class*="animate"]');
    images.forEach(img => {
      if (this.animatedElements.has(img)) return;

      window.gsap.fromTo(img, 
        {
          opacity: 0,
          y: 40,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: img,
            start: "top 85%",
            once: true,
            onComplete: () => {
              this.animatedElements.add(img);
            }
          }
        }
      );
    });
  }

  // ========================================
  // CARGA DE LIBRERÍAS EXTERNAS
  // ========================================

  private async loadAnimationLibraries(): Promise<void> {
    const loadScript = (src: string): Promise<void> => 
      new Promise((resolve, reject) => {
        // Verificar si el script ya existe
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });

    try {
      // Cargar GSAP si no existe
      if (!window.gsap) {
        await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js');
      }
      
      // Cargar ScrollTrigger si no existe
      if (!window.ScrollTrigger) {
        await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js');
      }
      
      // Cargar SplitType si no existe ninguna librería de split
      if (!window.SplitText && !window.SplitType) {
        await loadScript('https://unpkg.com/split-type@0.3.3/umd/index.min.js');
      }

      // Registrar plugin y inicializar animaciones
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        // Pequeña pausa para asegurar que todo esté cargado
        setTimeout(() => {
          this.initScrollAnimations();
          this.initSplitTextAnimations();
          this.initIntersectionObserver();
        }, 100);
      } else {
        // Si GSAP no está disponible, inicializar observer básico
        setTimeout(() => {
          this.initIntersectionObserver();
        }, 100);
      }
    } catch (error) {
      console.warn('Failed to load animation libraries:', error);
      // Continuar con observer básico si fallan las librerías
      setTimeout(() => {
        this.initIntersectionObserver();
      }, 100);
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA USO EXTERNO
  // ========================================

  /**
   * Animar un elemento específico manualmente
   */
  public animateElementManually(selector: string, animation: string = 'fadeInUp', delay: number = 0): void {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && !this.animatedElements.has(element)) {
      element.dataset.animation = animation;
      element.dataset.delay = delay.toString();
      this.animateElement(element);
    }
  }

  /**
   * Reinicializar animaciones para contenido dinámico
   */
  public reinitializeAnimations(): void {
    if (this.observer) {
      // Observar nuevos elementos
      const selectors = ['.animate-on-scroll', '.feature-card', '.split-text'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!this.animatedElements.has(el)) {
            this.observer?.observe(el);
          }
        });
      });
    }
  }

  /**
   * Pausar/reanudar animaciones
   */
  public toggleAnimations(pause: boolean): void {
    if (window.gsap) {
      if (pause) {
        window.gsap.globalTimeline.pause();
      } else {
        window.gsap.globalTimeline.play();
      }
    }
  }

  /**
   * Limpiar todas las animaciones
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.animatedElements.clear();
    this.closeAllModals();
    
    if (window.gsap) {
      window.gsap.killTweensOf("*");
    }
  }
}

// ========================================
// UTILIDADES GLOBALES
// ========================================

/**
 * Utilidades para animaciones sin instanciar la clase principal
 */
class AnimationUtils {
  /**
   * Crear animación de conteo de números
   */
  static animateCounter(element: HTMLElement, start: number = 0, end: number, duration: number = 2): void {
    if (window.gsap) {
      const obj = { value: start };
      window.gsap.to(obj, {
        value: end,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = Math.round(obj.value).toString();
        }
      });
    } else {
      // Fallback sin GSAP
      const increment = (end - start) / (duration * 60); // 60fps
      let current = start;
      const timer = setInterval(() => {
        current += increment;
        element.textContent = Math.round(current).toString();
        if (current >= end) {
          element.textContent = end.toString();
          clearInterval(timer);
        }
      }, 1000 / 60);
    }
  }

  /**
   * Crear efecto de escritura de texto
   */
  static typewriterEffect(element: HTMLElement, text: string, speed: number = 50): Promise<void> {
    return new Promise((resolve) => {
      element.textContent = '';
      let index = 0;
      
      const timer = setInterval(() => {
        element.textContent += text[index];
        index++;
        
        if (index >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  /**
   * Parallax simple para elementos
   */
  static initParallax(selector: string, speed: number = 0.5): void {
    const elements = document.querySelectorAll(selector);
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      
      elements.forEach(el => {
        const rate = scrolled * speed;
        (el as HTMLElement).style.transform = `translateY(${rate}px)`;
      });
    };

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  /**
   * Crear animación de onda en elementos
   */
  static createRippleEffect(element: HTMLElement, event: MouseEvent): void {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================

// Crear instancia global
let globalAnimationManager: GlobalAnimationManager;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    globalAnimationManager = new GlobalAnimationManager();
    window.GlobalAnimations = globalAnimationManager;
  });
} else {
  globalAnimationManager = new GlobalAnimationManager();
  window.GlobalAnimations = globalAnimationManager;
}

// Añadir CSS para el efecto ripple si no existe
if (!document.getElementById('ripple-styles')) {
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlobalAnimationManager, AnimationUtils };
}

// Exportar para TypeScript/ES6
if (typeof window !== 'undefined') {
  window.AnimationUtils = AnimationUtils;
}