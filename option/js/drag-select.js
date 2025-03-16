let isDragging = false;
let startX = 0;
let startY = 0;
let selectionBox = null;
let initiallySelected = null;
let hasMetDragThreshold = false;
const MIN_DRAG_DISTANCE = 5;

function createSelectionBox() {
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.border = '2px solid rgba(0, 156, 31, 0.5)';
    box.style.backgroundColor = 'rgba(0, 156, 31, 0.1)';
    box.style.pointerEvents = 'none';
    box.style.zIndex = '1000';
    return box;
}

function getCardsInSelection(box, container) {
    const cards = container.querySelectorAll('.card');
    const boxRect = box.getBoundingClientRect();
    
    return Array.from(cards).filter(card => {
        const cardRect = card.getBoundingClientRect();
        return !(cardRect.right < boxRect.left || 
                cardRect.left > boxRect.right || 
                cardRect.bottom < boxRect.top || 
                cardRect.top > boxRect.bottom);
    });
}

function initDragSelect() {
    const cardsContainer = document.querySelector('.cards');
    if (!cardsContainer) return;

    function handleDragStart(e) {
        const isTouch = e.type.includes('touch');
        const evt = isTouch ? e.touches[0] : e;
        
        // Only start drag if clicking directly on the cards container
        if (e.target !== cardsContainer && !e.target.closest('.card')) return;
        
        isDragging = true;
        startX = evt.clientX;
        startY = evt.clientY;
        
        // Selection box will be created when drag threshold is met
        
        // Store initial selection state
        initiallySelected = new Set(
            Array.from(cardsContainer.querySelectorAll('.card')).map(card => 
                ({ card, wasSelected: card.querySelector('.select-product').checked })
            )
        );
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        
        const isTouch = e.type.includes('touch');
        const evt = isTouch ? e.touches[0] : e;
        e.preventDefault();
        
        // Update selection box position and size
        const currentX = evt.clientX;
        const currentY = evt.clientY;
        
        // Calculate drag distance
        const dragDistance = Math.sqrt(
            Math.pow(currentX - startX, 2) + 
            Math.pow(currentY - startY, 2)
        );
        
        // Only create selection box and start selection after minimum drag distance
        if (!hasMetDragThreshold) {
            if (dragDistance >= MIN_DRAG_DISTANCE) {
                hasMetDragThreshold = true;
                selectionBox = createSelectionBox();
                document.body.appendChild(selectionBox);
            } else {
                return;
            }
        }
        
        if (!selectionBox) return;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        
        // Update card selection based on intersection
        const selectedCards = getCardsInSelection(selectionBox, cardsContainer);
        initiallySelected.forEach(({ card, wasSelected }) => {
            const checkbox = card.querySelector('.select-product');
            const isInSelection = selectedCards.includes(card);
            checkbox.checked = isInSelection ? !wasSelected : wasSelected;
        });
        
        // Trigger change event for selection count update
        const event = new Event('change');
        cardsContainer.dispatchEvent(event);
    }

    function handleDragEnd() {
        isDragging = false;
        hasMetDragThreshold = false;
        if (selectionBox) {
            selectionBox.remove();
            selectionBox = null;
        }
        initiallySelected = null;
    }

    // Mouse events
    cardsContainer.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Touch events
    cardsContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
}

// Initialize drag select functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', initDragSelect);