/**
 * Dynamic Day Highlighting for The Lineup
 * Automatically detects the day of the week and adds the 'is-today' active state.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Get current day index (0 = Sunday, 1 = Monday, 2 = Tuesday, etc.)
    const dayIndex = new Date().getDay();
    
    // Normalize index to match your HTML list structure (Mon = 1, Tue = 2 ... Sun = 7)
    const normalizedIndex = dayIndex === 0 ? 7 : dayIndex;
    
    // Find today's row and inject the active class
    const todayRow = document.querySelector(`.lineup-item:nth-child(${normalizedIndex}) .lineup-link`);
    if (todayRow) {
        todayRow.classList.add('is-today');
    }
});