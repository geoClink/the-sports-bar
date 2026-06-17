/**
 * THE SPORTS BAR CO. - MASTER INTERACTION ENGINE
 * Location: frontend/js/main.js
 */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================================
       1. Dynamic Day Highlighting for The Lineup
       ========================================================================== */
    const highlightCurrentDay = () => {
        // Get current day index (0 = Sunday, 1 = Monday, etc.)
        const dayIndex = new Date().getDay();

        // Normalize index to match HTML list structure (Mon = 1, Tue = 2 ... Sun = 7)
        const normalizedIndex = dayIndex === 0 ? 7 : dayIndex;

        // Find today's row and inject the active class
        const todayRow = document.querySelector(`.lineup-item:nth-child(${normalizedIndex}) .lineup-link`);
        if (todayRow) {
            todayRow.classList.add('is-today');
        }
    };

    /* ==========================================================================
       2. Menu Grid Category Filtering System
       ========================================================================== */
    const initializeMenuFilters = () => {
        const filterButtons = document.querySelectorAll(".filter-btn");
        const menuItems = document.querySelectorAll(".menu-item-row");
        const categories = document.querySelectorAll(".menu-category-block");

        if (filterButtons.length === 0) return; // Guard clause if not on the menu page

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                // Manage active states on buttons
                document.querySelector(".filter-btn.active")?.classList.remove("active");
                button.classList.add("active");

                const activeFilter = button.getAttribute("data-filter");

                // Filter row items
                menuItems.forEach(item => {
                    const rawTags = item.getAttribute("data-tags") || "";
                    const itemTagsArray = rawTags.toLowerCase().split(" ").filter(t => t);

                    if (activeFilter === "all" || itemTagsArray.includes(activeFilter.toLowerCase())) {
                        item.classList.remove("is-hidden");
                    } else {
                        item.classList.add("is-hidden");
                    }
                });

                // Toggle empty category headers
                categories.forEach(category => {
                    const visibleItems = category.querySelectorAll(".menu-item-row:not(.is-hidden)");

                    if (activeFilter !== "all" && visibleItems.length === 0) {
                        category.classList.add("is-hidden");
                    } else {
                        category.classList.remove("is-hidden");
                    }
                });
            });
        });
    };

    // Initialize all UI modules
    highlightCurrentDay();
    initializeMenuFilters();
});
