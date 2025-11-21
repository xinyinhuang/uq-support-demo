const mapArea = document.getElementById("mapArea");
const popoversWrap = document.getElementById("popovers");
const menuItems = document.querySelectorAll(".menu__item");
const allCards = popoversWrap.querySelectorAll(".popover");
const pinsWrap = document.getElementById("pins");
const allPins = pinsWrap.querySelectorAll(".pin");
const pinWrappers = document.querySelectorAll(".pin-wrapper");

/** 打开某个分组：只显示该 group 的卡片，栈容器固定位置出现 */
function openGroup(group) {
    // 先清空
    allCards.forEach((card) => (card.style.display = "none"));

    // 找到属于该 group 的卡片
    const groupCards = Array.from(allCards).filter(
        (c) => c.dataset.group === group
    );

    if (groupCards.length === 0) {
        // 没有任何卡片则隐藏整栈
        popoversWrap.classList.remove("is-visible");
        return;
    }

    // 显示卡片
    groupCards.forEach((card) => {
        card.style.display = "flex";
    });

    // 显示栈容器
    popoversWrap.classList.add("is-visible");
}

/** 关闭弹窗栈 */
function closeAll() {
    popoversWrap.classList.remove("is-visible");
}
function positionPinWrapper(wrapper) {
    const xPct = parseFloat(wrapper.dataset.x || "50");
    const yPct = parseFloat(wrapper.dataset.y || "50");
    wrapper.style.left = xPct + "%";
    wrapper.style.top = yPct + "%";
}

/* 显示某个分组的 pin */
function showPins(group) {
    pinWrappers.forEach((w) => {
        if (w.dataset.group === group) {
            positionPinWrapper(w);
            w.style.display = "block";
        } else {
            w.style.display = "none";
            const pin = w.querySelector(".pin");
            pin.classList.remove("is-active");
        }
    });
}

/* 点击 pin */
pinWrappers.forEach((w) => {
    const pin = w.querySelector(".pin");
    pin.addEventListener("click", (e) => {
        e.stopPropagation();
        // 高亮 pin
        document
            .querySelectorAll(".pin")
            .forEach((p) => p.classList.remove("is-active"));
        pin.classList.add("is-active");

        // 你也可以在这里添加：滚动或高亮右侧对应弹窗
    });
});

/* 修改：打开某个分组时，同时显示该组卡片 + 该组坐标点 */
function openGroup(group) {
    // 先隐藏所有卡片
    allCards.forEach((card) => (card.style.display = "none"));

    const groupCards = Array.from(allCards).filter(
        (c) => c.dataset.group === group
    );
    if (groupCards.length === 0) {
        popoversWrap.classList.remove("is-visible");
    } else {
        groupCards.forEach((card) => {
            card.style.display = "flex";
        });
        popoversWrap.classList.add("is-visible");
    }

    // ✅ 同步显示该组的坐标点
    showPins(group);
}

/* 关闭时也把 pin 清掉选中态（可选） */
function closeAll() {
    popoversWrap.classList.remove("is-visible");
    allPins.forEach((p) => {
        p.classList.remove("is-active");
    });
    // 不强制隐藏 pin：如果你想关闭时也隐藏点，可改为：
    // allPins.forEach(p => p.style.display = 'none');
}

/* 点击地图点：高亮该点 + 高亮弹窗中对应卡片（按标题匹配） */
allPins.forEach((pin) => {
    pin.addEventListener("click", (e) => {
        e.stopPropagation();
        // 点选中态
        allPins.forEach((p) => p.classList.remove("is-active"));
        pin.classList.add("is-active");

        // 在右侧弹窗栈中，高亮对应卡片（通过 data-target 匹配标题）
        const targetTitle = pin.dataset.target?.trim().toLowerCase();
        if (!targetTitle) return;
        const cards = popoversWrap.querySelectorAll(".popover");
        cards.forEach((card) => {
            const titleEl = card.querySelector(".popover__title");
            const hit =
                titleEl &&
                titleEl.textContent.trim().toLowerCase() === targetTitle;
            card.style.outline = hit
                ? "2px solid rgba(124,58,237,.35)"
                : "none";
        });
    });
});

/** 左侧菜单点击 */
menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
        const group = item.getAttribute("data-group");
        if (!group) return;
        openGroup(group);
        e.stopPropagation();
    });
});

/** 点击地图空白关闭 */
mapArea.addEventListener("click", (e) => {
    if (
        e.target.classList.contains("map__image") ||
        e.target.id === "mapArea"
    ) {
        closeAll();
    }
});

/** ESC 关闭 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
});

/** 搜索过滤（如需） */
const searchInput = document.querySelector(".search__input");
if (searchInput) {
    const menuList = document.getElementById("menuList");
    searchInput.addEventListener("input", () => {
        const kw = searchInput.value.trim().toLowerCase();
        menuList.querySelectorAll(".menu__item").forEach((li) => {
            const hit = li.textContent.toLowerCase().includes(kw);
            li.style.display = hit ? "" : "none";
        });
    });
}
