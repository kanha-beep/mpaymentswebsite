(() => {
    const onReady = (fn) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn, { once: true });
            return;
        }

        fn();
    };

    const initStickyHeader = () => {
        const header = document.querySelector("#site-header");
        const shell = document.querySelector("[data-header-shell]");
        const heroSection = document.querySelector("main > section");
        if (!header || !shell) return;

        const update = () => {
            const stickyThreshold = heroSection ? Math.max(heroSection.offsetHeight / 2, 12) : 12;
            const stuck = window.scrollY > stickyThreshold;
            header.classList.toggle("shadow-soft", stuck);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    };

    const initMobileMenu = () => {
        const toggle = document.querySelector("[data-mobile-toggle]");
        const menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) return;

        toggle.addEventListener("click", () => {
            const isOpen = !menu.classList.contains("hidden");
            menu.classList.toggle("hidden", isOpen);
            toggle.setAttribute("aria-expanded", String(!isOpen));
        });

        document.querySelectorAll("[data-submenu-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                const wrapper = button.closest("div");
                const submenu = wrapper?.querySelector("[data-submenu]");
                if (!submenu) return;
                const isOpen = !submenu.classList.contains("hidden");
                submenu.classList.toggle("hidden", isOpen);
                button.setAttribute("aria-expanded", String(!isOpen));
            });
        });
    };

    const initReveals = () => {
        const nodes = document.querySelectorAll("[data-reveal]");
        if (!nodes.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.remove("translate-y-6", "translate-y-8", "opacity-0");
                    entry.target.classList.add("translate-y-0", "opacity-100");
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
        );

        nodes.forEach((node) => observer.observe(node));
    };

    const initTypedText = () => {
        document.querySelectorAll("[data-typed]").forEach((node) => {
            let items;
            try {
                items = JSON.parse(node.getAttribute("data-typed") || "[]");
            } catch {
                items = [];
            }

            if (!items.length) return;

            let itemIndex = 0;
            let charIndex = 0;
            let deleting = false;

            const tick = () => {
                const word = items[itemIndex];

                if (!deleting) {
                    charIndex += 1;
                    node.textContent = word.slice(0, charIndex);
                    if (charIndex === word.length) {
                        deleting = true;
                        window.setTimeout(tick, 1400);
                        return;
                    }
                    window.setTimeout(tick, 70);
                    return;
                }

                charIndex -= 1;
                node.textContent = word.slice(0, Math.max(charIndex, 0));
                if (charIndex <= 0) {
                    deleting = false;
                    itemIndex = (itemIndex + 1) % items.length;
                    window.setTimeout(tick, 260);
                    return;
                }
                window.setTimeout(tick, 38);
            };

            tick();
        });
    };

    const initHomeHeroMedia = () => {
        const video = document.querySelector("[data-home-hero-video]");
        const contents = document.querySelectorAll("[data-home-hero-content]");
        if (!video || !contents.length) return;

        const showContent = () => {
            contents.forEach((node) => {
                node.classList.remove("invisible", "translate-y-8", "opacity-0");
                node.classList.add("translate-y-0", "opacity-100");
            });
        };

        if (video.readyState >= 2) {
            showContent();
            return;
        }

        video.addEventListener("loadeddata", showContent, { once: true });
        video.addEventListener("canplay", showContent, { once: true });
    };

    const initMarquee = () => {
        const marquee = document.querySelector("[data-marquee]");
        if (!marquee) return;

        let offset = 0;
        let frameId = 0;
        let paused = false;

        const animate = () => {
            if (!paused) {
                offset -= 1;
                if (Math.abs(offset) >= marquee.scrollWidth / 2) {
                    offset = 0;
                }
                marquee.style.transform = `translate3d(${offset}px, 0, 0)`;
            }

            frameId = window.requestAnimationFrame(animate);
        };

        marquee.addEventListener("mouseenter", () => {
            paused = true;
        });

        marquee.addEventListener("mouseleave", () => {
            paused = false;
        });

        frameId = window.requestAnimationFrame(animate);
        window.addEventListener("beforeunload", () => window.cancelAnimationFrame(frameId), {
            once: true,
        });
    };

    const initBackToTop = () => {
        const button = document.querySelector("[data-back-to-top]");
        if (!button) return;

        const update = () => {
            button.classList.toggle("hidden", window.scrollY <= 320);
            button.classList.toggle("flex", window.scrollY > 320);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        button.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    };

    const initForms = () => {
        const emailJsConfig = window.EMAILJS_CONFIG;
        const emailJsReady = !!window.emailjs &&
            !!emailJsConfig &&
            emailJsConfig.publicKey &&
            emailJsConfig.serviceId &&
            emailJsConfig.templateId &&
            !String(emailJsConfig.publicKey).startsWith("YOUR_");

        if (emailJsReady) {
            window.emailjs.init({ publicKey: emailJsConfig.publicKey });
        }

        document.querySelectorAll(".js-contact-form").forEach((form) => {
            const status = form.querySelector("[data-form-status]");
            const fields = [...form.querySelectorAll("input, textarea")];

            const setStatus = (kind, message) => {
                if (!status) return;
                status.textContent = message;
                status.className =
                    "rounded-2xl px-4 py-3 text-sm font-medium " +
                    (kind === "success" ?
                        "bg-brand-50 text-brand-700" :
                        "bg-red-50 text-red-600");
            };

            const setFieldState = (field, valid) => {
                field.classList.toggle("border-red-400", !valid);
                field.classList.toggle("ring-4", !valid);
                field.classList.toggle("ring-red-100", !valid);
            };

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                let valid = true;

                fields.forEach((field) => {
                    const value = field.value.trim();
                    const required = field.hasAttribute("required");
                    const email = field.type === "email";
                    const ok = (!required || value.length > 0) && (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
                    setFieldState(field, ok);
                    if (!ok) valid = false;
                });

                if (!valid) {
                    setStatus("error", "Please fill in the required details correctly.");
                    return;
                }

                const name = form.querySelector('[name="name"]')?.value.trim() || "";
                const email = form.querySelector('[name="email"]')?.value.trim() || "";
                const message = form.querySelector('[name="message"]')?.value.trim() || "";
                const pageName = form.getAttribute("data-page-name") || document.title || "Website";

                if (emailJsReady) {
                    try {
                        await window.emailjs.send(emailJsConfig.serviceId, emailJsConfig.templateId, {
                            from_name: name,
                            from_email: email,
                            message,
                            page_name: pageName,
                            website_name: "We Match Flows",
                            reply_to: email,
                        });

                        form.reset();
                        fields.forEach((field) => setFieldState(field, true));
                        setStatus("success", "Thanks. Your message has been sent successfully.");
                        return;
                    } catch {
                        setStatus("error", "We could not send your message right now. Please try again.");
                        return;
                    }
                }

                const subject = encodeURIComponent("Website enquiry from We Match Flows");
                const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
                setStatus("success", "Your message is ready. Your email app will open now.");
                window.setTimeout(() => {
                    window.location.href = `mailto:info@wematchflow.com?subject=${subject}&body=${body}`;
                }, 350);
            });
        });
    };

    onReady(() => {
        initStickyHeader();
        initMobileMenu();
        initReveals();
        initHomeHeroMedia();
        initTypedText();
        initMarquee();
        initBackToTop();
        initForms();
    });
})();
