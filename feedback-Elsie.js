(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const LS_FLOWERS = "fb_flowers_v1";
        const LS_NOTES = "fb_notes_v1";

        ensureToastNode();
        wireFlowerButtons();

        const isList = !!document.querySelector("#handler-grid");
        const isSubmit = !!document.querySelector("#note-form");

        if (isList) {
            initCountsFromStorage();
            wireFilters();
            applyFiltersAndSort();
            refreshTopSection(); // 
            // renderRecentNotes(); // 
        }

        if (isSubmit) {
            prefillTargetFromQuery();
            wireSubmitForm();
            wireInlineFlowerOnSubmitPage();
        }

        // ---------- Flower ----------
        function wireFlowerButtons() {
            const buttons = Array.from(document.querySelectorAll('button.submit-btn[aria-label*="Send one flower"]'));
            buttons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    if (btn.dataset.locked === "1") return;
                    btn.dataset.locked = "1";
                    btn.disabled = true;

                    // UI：浮动花 + Toast + 临时文案
                    floatFlowerAt(btn);
                    showToast("Sent a flower 🌸!");

                    const oldText = btn.textContent;
                    btn.textContent = "🌸 Sent!";
                    setTimeout(() => (btn.textContent = oldText), 1200);

                    const id = btn.getAttribute("data-id");
                    if (id) {
                        const m = getFlowerMap();
                        m[id] = (m[id] || 0) + 1;
                        setFlowerMap(m);
                        updateCardCount(id, m[id]);
                        refreshTopSection(); 
                    }

                    setTimeout(() => {
                        btn.disabled = false;
                        btn.dataset.locked = "0";
                    }, 900);
                });
            });
        }

        function initCountsFromStorage() {
            const map = getFlowerMap();
            document.querySelectorAll(".handler").forEach((card) => {
                const id = card.getAttribute("data-id");
                const base = Number(card.getAttribute("data-flowers") || "0");
                const inc = map[id] || 0;
                const span = card.querySelector(".flower-count");
                if (span) span.textContent = String(base + inc);
            });
        }

        function updateCardCount(id, newIncVal) {
            const card = document.querySelector(`.handler[data-id="${id}"]`);
            if (!card) return;
            const base = Number(card.getAttribute("data-flowers") || "0");
            const span = card.querySelector(".flower-count");
            if (span) span.textContent = String(base + newIncVal);
        }

        function refreshTopSection() {
            const incMap = getFlowerMap(); // { alice: 2, ben: 1, ... }
            const gridCards = Array.from(document.querySelectorAll('#handler-grid .handler'));
            const totals = {}; // { id: total }
            gridCards.forEach(card => {
                const id = card.getAttribute('data-id');
                if (!id) return;
                const base = Number(card.getAttribute('data-flowers') || '0');
                const inc = incMap[id] || 0;
                totals[id] = base + inc;
            });

            const topCards = Array.from(document.querySelectorAll('[aria-labelledby="topwall-title"] .handler'));
            if (!topCards.length) return;

            topCards.forEach(card => {
                const id = card.getAttribute('data-id');
                if (!id) return;
                const baseTop = Number(card.getAttribute('data-flowers') || '0');
                const total = (totals[id] != null) ? totals[id] : baseTop;
                const span = card.querySelector('.top-flower-count');
                if (span) span.textContent = String(total);
                const name = card.querySelector('.handler-info h3')?.textContent?.trim() || '';
                card.setAttribute('aria-label', `${name} — ${total} flowers`);
            });

            /*
            const topWrap = document.querySelector('[aria-labelledby="topwall-title"] .d-grid, [aria-labelledby="topwall-title"] .fb-toplist');
            if (topWrap) {
                const sortable = topCards
                    .map(c => [c, Number(c.querySelector('.top-flower-count')?.textContent || '0')])
                    .sort((a,b) => b[1] - a[1])
                    .map(x => x[0]);
                sortable.forEach(c => topWrap.appendChild(c));
            }
            */
        }

        // ---------- Filters ----------
        function wireFilters() {
            ["role-filter", "location-filter", "sort-filter"].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.addEventListener("change", applyFiltersAndSort);
            });
        }

        function applyFiltersAndSort() {
            const roleVal = (document.getElementById("role-filter")?.value || "All roles").toLowerCase();
            const locVal = (document.getElementById("location-filter")?.value || "All locations").toLowerCase();
            const sortVal = (document.getElementById("sort-filter")?.value || "Newest").toLowerCase();

            const cards = Array.from(document.querySelectorAll("#handler-grid .handler"));
            const map = getFlowerMap();

            // filter
            cards.forEach((card) => {
                const role = (card.getAttribute("data-role") || "").toLowerCase();
                const loc = (card.getAttribute("data-location") || "").toLowerCase();
                const show = (roleVal === "all roles" || role === roleVal) &&
                            (locVal  === "all locations" || loc  === locVal);
                card.style.display = show ? "" : "none";
            });

            // sort
            const visible = cards.filter(c => c.style.display !== "none");
            const grid = document.getElementById("handler-grid");
            const getCount = (card) => {
                const id = card.getAttribute("data-id");
                const base = Number(card.getAttribute("data-flowers") || "0");
                const inc = map[id] || 0;
                return base + inc;
            };

            if (sortVal === "trending" || sortVal === "this week") {
                visible.sort((a,b) => getCount(b) - getCount(a));
                visible.forEach(v => grid.appendChild(v));
            }
        }

        // ---------- Notes (submit page) ----------
        function prefillTargetFromQuery() {
            const params = new URLSearchParams(location.search);
            const to = params.get("to");
            const map = {
                alice: "Prof. Alice White",
                ben: "Ben Smith",
                askus: "ASK US",
                itsupport: "IT Support",
            };
            if (to && document.getElementById("target") && map[to]) {
                document.getElementById("target").value = map[to];
            }
        }

        function wireSubmitForm() {
            const form = document.getElementById("note-form");
            if (!form) return;
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const target = (document.getElementById("target") || {}).value || "";
                const noteEl = document.getElementById("note");
                const note = (noteEl && noteEl.value || "").trim();
                const anon = !!form.querySelector('input[name="anonymous"]:checked');

                if (!note) {
                    showToast("Please write a short note.");
                    noteEl?.focus();
                    return;
                }
                if (note.length > 180) {
                    showToast("Note is too long (max 180).");
                    return;
                }

                const list = getNotes();
                list.unshift({
                    id: "n" + Date.now(),
                    target: target || null,
                    text: note,
                    anonymous: anon,
                    ts: new Date().toISOString()
                });
                setNotes(list);

                showToast("Note sent! 📝");
                setTimeout(() => (window.location.href = "feedback.html"), 1200);
            });
        }

        function wireInlineFlowerOnSubmitPage() {
            const btn = document.getElementById("btn-flower");
            if (!btn) return;
            const to = new URLSearchParams(location.search).get("to");
            if (to) btn.setAttribute("data-id", to);
        }

        // ---------- Recent notes (optional) ----------
        function renderRecentNotes(limit = 5) {
            const wrap = document.getElementById("recent-notes");
            if (!wrap) return;
            const list = getNotes().slice(0, limit);
            if (!list.length) {
                wrap.innerHTML = '<p class="text-muted">No notes yet.</p>';
                return;
            }
            wrap.innerHTML = list.map(n => {
                const who = n.target ? `to <strong>${escapeHTML(n.target)}</strong>` : "";
                const ts = new Date(n.ts).toLocaleString();
                return `<div class="note-item" style="background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:0 3px 10px rgba(0,0,0,.05);">
                    <div class="text-small" style="opacity:.7;">${ts} ${who} ${n.anonymous ? '(anonymous)' : ''}</div>
                    <div style="margin-top:6px;">${escapeHTML(n.text)}</div>
                </div>`;
            }).join("");
        }

        // ---------- storage helpers ----------
        function getFlowerMap() {
            try { return JSON.parse(localStorage.getItem(LS_FLOWERS) || "{}"); } catch { return {}; }
        }
        function setFlowerMap(map) {
            localStorage.setItem(LS_FLOWERS, JSON.stringify(map));
        }
        function getNotes() {
            try { return JSON.parse(localStorage.getItem(LS_NOTES) || "[]"); } catch { return []; }
        }
        function setNotes(arr) {
            localStorage.setItem(LS_NOTES, JSON.stringify(arr));
        }

        // ---------- UI helpers ----------
        function ensureToastNode() {
            if (!document.querySelector(".fb-toast")) {
                const div = document.createElement("div");
                div.className = "fb-toast";
                div.setAttribute("role", "status");
                div.setAttribute("aria-live", "polite");
                document.body.appendChild(div);
            }
        }
        function showToast(message) {
            const node = document.querySelector(".fb-toast");
            if (!node) return;
            node.textContent = message || "";
            node.classList.add("is-visible");
            setTimeout(() => node.classList.remove("is-visible"), 1600);
        }
        function floatFlowerAt(el) {
            const r = el.getBoundingClientRect();
            const span = document.createElement("span");
            span.className = "fb-float";
            span.textContent = "🌸";
            span.style.position = "fixed";
            span.style.left = (r.left + r.width/2) + "px";
            span.style.top  = (r.top + r.height/2) + "px";
            document.body.appendChild(span);
            setTimeout(() => span.remove(), 1000);
        }
        function escapeHTML(s) {
            return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
        }
    });
})();