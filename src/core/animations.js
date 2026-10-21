/* ==========================================================================
   Animaciones GSAP
   Origen: DISCURSAPP .html, script principal (L3384-3484)
   ========================================================================== */
        // ═══ GSAP ANIMATIONS ═══════════════════════════════════════════════
window.G = {
            _mm: null,
            _reduceMotion: false,
            _isMobile: false,
            init() {
                if (typeof gsap === 'undefined') return;
                gsap.config({ nullTargetWarn: false });
                gsap.defaults({ ease: 'power3.out', duration: 0.5 });
                G._mm = gsap.matchMedia();
                G._mm.add({
                    reduceMotion: '(prefers-reduced-motion: reduce)',
                    isMobile: '(max-width: 640px)'
                }, (ctx) => {
                    G._reduceMotion = ctx.conditions.reduceMotion;
                    G._isMobile = ctx.conditions.isMobile;
                });
            },

            modalOpen(overlay, box) {
                if (!box) return;
                gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
                gsap.fromTo(box, { scale: 0.88, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' });
                const items = box.querySelectorAll('.info-grid > *, .assignment-row, .theme-row, .box-row');
                if (items.length) gsap.fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, delay: 0.15, ease: 'power2.out' });
            },

            modalClose(overlay, box, cb) {
                if (!box) { cb?.(); return; }
                gsap.to(box, { scale: 0.92, y: 16, opacity: 0, duration: 0.25, ease: 'power2.in' });
                gsap.to(overlay, { opacity: 0, duration: 0.25, delay: 0.05, ease: 'power2.in', onComplete: cb });
            },

            toast(el) {
                gsap.killTweensOf(el);
                gsap.set(el, { y: 50, opacity: 0, scale: 0.9 });
                gsap.to(el, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
                gsap.to(el, { y: -20, opacity: 0, scale: 0.95, duration: 0.3, delay: 3.5, ease: 'power2.in' });
            },

            statOverlayIn(overlay, box) {
                gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
                gsap.fromTo(box, { scale: 0.85, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.3)' });
                const rows = box.querySelectorAll('.stat-list-row, .stat-preview-row, .stats-monthly-bar, .stats-cong-bar-row');
                if (rows.length) gsap.fromTo(rows, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, delay: 0.2, ease: 'power2.out' });
            },

            statOverlayOut(overlay, cb) {
                gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: cb });
            },

            staggerCards(container, selector, delay) {
                const els = container.querySelectorAll(selector);
                if (!els.length) return;
                gsap.set(els, { opacity: 0, y: 28, scale: 0.96 });
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(e => {
                        if (e.isIntersecting) {
                            const idx = Array.from(els).indexOf(e.target);
                            gsap.to(e.target, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: idx * (delay || 0.04), ease: 'back.out(1.2)' });
                            obs.unobserve(e.target);
                        }
                    });
                }, { threshold: 0.05 });
                els.forEach(c => obs.observe(c));
            },

            miniCards(items) {
                if (!items.length) return;
                gsap.fromTo(items, { opacity: 0, y: 20, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: 'back.out(1.3)' });
            },

            summaryBar(items) {
                if (!items.length) return;
                gsap.fromTo(items, { opacity: 0, y: -16, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.5)' });
            },

            tabSwitch(outEl, inEl) {
                if (outEl) gsap.to(outEl, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' });
                if (inEl) { gsap.set(inEl, { opacity: 0, y: 16 }); gsap.to(inEl, { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: 'power3.out' }); }
            },

            buttonPulse(el) {
                gsap.fromTo(el, { scale: 1 }, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
            },

            numberCount(el, from, to, dur) {
                const obj = { val: from };
                gsap.to(obj, { val: to, duration: dur || 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.val); } });
            },

            cardClick(el) {
                if (G._reduceMotion) return;
                gsap.fromTo(el, { scale: 1 }, { scale: G._isMobile ? 0.96 : 0.97, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
            },

            cardHover(el, enter) {
                if (G._reduceMotion) return;
                if (enter) gsap.to(el, { y: G._isMobile ? -2 : -4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', duration: 0.25, ease: 'power2.out' });
                else gsap.to(el, { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', duration: 0.25, ease: 'power2.out' });
            }
        };
