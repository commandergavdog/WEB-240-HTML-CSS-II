(function() {

    //get the collection of draggable targets and add their draggable attribute
    for(var targets = document.querySelectorAll('[data-draggable="target"]'), len = targets.length, i = 0; i < len; i ++) {
        targets[i].setAttribute('aria-dropeffect', 'none');
    }

    //get the collection of draggable items and add their draggable attributes
    for(var items = document.querySelectorAll('[data-draggable="item"]'), len = items.length, i = 0; i < len; i ++) {
        items[i].setAttribute('draggable', 'true');
        items[i].setAttribute('aria-grabbed', 'false');
        items[i].setAttribute('tabindex', '0');
    }



    //dictionary for storing the selections data comprising an array of the currently selected items 
    //a reference to the selected items' owning container
    //and a reference to the current drop target container
    var selections = {
                        items      : [],
        				owner      : null,
        				droptarget : null
    				};
    
    //function for selecting an item
    function addSelection(item) {
        //if the owner reference is still null, set it to this item's parent
        //so that further selection is only allowed within the same container
        if(!selections.owner) {
            selections.owner = item.parentNode;
        }
        
        //or if that's already happened then compare it with this item's parent
        //and if they're not the same container, return to prevent selection
        else if(selections.owner != item.parentNode) {
            return;
        }
                
        //set this item's grabbed state
        item.setAttribute('aria-grabbed', 'true');
        
        //add it to the items array
        selections.items.push(item);
    }
    
     //function for unselecting an item
    function removeSelection(item)
    {
        //reset this item's grabbed state
        item.setAttribute('aria-grabbed', 'false');
        
        //then find and remove this item from the existing items array
        for(var len = selections.items.length, i = 0; i < len; i ++)
        {
            if(selections.items[i] == item)
            {
                selections.items.splice(i, 1);
                break;
            }
        }
    }
    
    //function for resetting all selections
    function clearSelections() {
        //if we have any selected items
        if(selections.items.length)
        {
            //reset the owner reference
            selections.owner = null;

            //reset the grabbed state on every selected item
            for(var len = selections.items.length, i = 0; i < len; i ++)
            {
                selections.items[i].setAttribute('aria-grabbed', 'false');
            }

            //then reset the items array        
            selections.items = [];
        }
    }

    //shorctut function for testing whether a selection modifier is pressed
    function hasModifier(e) {
        return (e.ctrlKey || e.metaKey || e.shiftKey);
    }
      
     
    //function for applying dropeffect to the target containers
    function addDropeffects() {
        //apply aria-dropeffect and tabindex to all targets apart from the owner
        for(var len = targets.length, i = 0; i < len; i ++) {
            if (targets[i] != selections.owner && targets[i].getAttribute('aria-dropeffect') == 'none') {
                targets[i].setAttribute('aria-dropeffect', 'move');
                targets[i].setAttribute('tabindex', '0');
            }
        }

        //remove aria-grabbed and tabindex from all items inside those containers
        for(var len = items.length, i = 0; i < len; i ++) {
            if (items[i].parentNode != selections.owner && items[i].getAttribute('aria-grabbed')) {
                items[i].removeAttribute('aria-grabbed');
                items[i].removeAttribute('tabindex');
            }
        }        
    }
    
    //function for removing dropeffect from the target containers
    function clearDropeffects() {
        //if we have any selected items
        if(selections.items.length) {
            //reset aria-dropeffect and remove tabindex from all targets
            for(var len = targets.length, i = 0; i < len; i ++) {
                if(targets[i].getAttribute('aria-dropeffect') != 'none') {
                    targets[i].setAttribute('aria-dropeffect', 'none');
                    targets[i].removeAttribute('tabindex');
                }
            }

            //restore aria-grabbed and tabindex to all selectable items 
            //without changing the grabbed value of any existing selected items
            for(var len = items.length, i = 0; i < len; i ++) {
                if(!items[i].getAttribute('aria-grabbed')) {
                    items[i].setAttribute('aria-grabbed', 'false');
                    items[i].setAttribute('tabindex', '0');
                } else if(items[i].getAttribute('aria-grabbed') == 'true') {
                    items[i].setAttribute('tabindex', '0');
                }
            }        
        }
    }

    //shortcut function for identifying an event element's target container
    function getContainer(element) {
        do {
             if(element.nodeType == 1 && element.getAttribute('aria-dropeffect')) {
                return element;
            	}
        	}
        while(element = element.parentNode);
        
        return null;
    }

	 //mousedown event to implement single selection
    document.addEventListener('mousedown', function(e) {
        //if the element is a draggable item
        if(e.target.getAttribute('draggable')) {
            //clear dropeffect from the target containers
            clearDropeffects();

            //if the multiple selection modifier is not pressed 
            //and the item's grabbed state is currently false
            if(!hasModifier(e) && e.target.getAttribute('aria-grabbed') == 'false') {
                //clear all existing selections
                clearSelections();
            
                //then add this new selection
                addSelection(e.target);
            }
        }
        
        //else [if the element is anything else]
        //and the selection modifier is not pressed 
        else if(!hasModifier(e)) {
            //clear dropeffect from the target containers
            clearDropeffects();

            //clear all existing selections
            clearSelections();
        }
        
        //else [if the element is anything else and the modifier is pressed]
        else {
            //clear dropeffect from the target containers
            clearDropeffects();
        }

    }, false);
    
    //mouseup event to implement multiple selection
    document.addEventListener('mouseup', function(e) {
        //if the element is a draggable item 
        //and the multipler selection modifier is pressed
        if(e.target.getAttribute('draggable') && hasModifier(e)) {
            //if the item's grabbed state is currently true
            if(e.target.getAttribute('aria-grabbed') == 'true') {
                //unselect this item
                removeSelection(e.target);
                
                //if that was the only selected item
                //then reset the owner container reference
                if(!selections.items.length) {
                    selections.owner = null;
                }
            }
            
            //else [if the item's grabbed state is false]
            else {
                //add this additional selection
                addSelection(e.target);
            }
        }
        
    }, false);
            
            
       
    //dragstart event to initiate mouse dragging
    document.addEventListener('dragstart', function(e) {
        //if the element's parent is not the owner, then block this event
        if(selections.owner != e.target.parentNode) {
            e.preventDefault();
            return;
        }
                
        //[else] if the multiple selection modifier is pressed 
        //and the item's grabbed state is currently false
        if(hasModifier(e) && e.target.getAttribute('aria-grabbed') == 'false') {
            //add this additional selection
            addSelection(e.target);
        }
        
        e.dataTransfer.setData('text', '');
        
        //apply dropeffect to the target containers
        addDropeffects();
    
    }, false);
   
    //related variable is needed to maintain a reference to the 
    //dragleave's relatedTarget, since it doesn't have e.relatedTarget
    var related = null;

    //dragenter event to set that variable
    document.addEventListener('dragenter', function(e) {
        related = e.target;

    }, false);
    
    //dragleave event to maintain target highlighting using that variable
    document.addEventListener('dragleave', function(e) {
        //get a drop target reference from the relatedTarget
        var droptarget = getContainer(related);
        
        //if the target is the owner then it's not a valid drop target
        if(droptarget == selections.owner) {
            droptarget = null;
        }

        //if the drop target is different from the last stored reference
        //(or we have one of those references but not the other one)
        if(droptarget != selections.droptarget) {
            //if we have a saved reference, clear its existing dragover class
            if(selections.droptarget) {
                selections.droptarget.className = 
                    selections.droptarget.className.replace(/ dragover/g, '');
            }
            
            //apply the dragover class to the new drop target reference
            if(droptarget) {
                droptarget.className += ' dragover';
            }
                    
            //then save that reference for next time
            selections.droptarget = droptarget;
        }

    }, false);    

    //dragover event to allow the drag by preventing its default
    document.addEventListener('dragover', function(e) {
        //if we have any selected items, allow them to be dragged
        if(selections.items.length) {
            e.preventDefault();
        }
    
    }, false);    



    //dragend event to implement items being validly dropped into targets,
    //or invalidly dropped elsewhere, and to clean-up the interface either way
    document.addEventListener('dragend', function(e) {
        //if we have a valid drop target reference
        //(which implies that we have some selected items)
        if(selections.droptarget) {
            //append the selected items to the end of the target container
            for(var len = selections.items.length, i = 0; i < len; i ++) {
                selections.droptarget.appendChild(selections.items[i]);
            }

            //prevent default to allow the action            
            e.preventDefault();
        }

        //if we have any selected items
        if(selections.items.length) {
            //clear dropeffect from the target containers
            clearDropeffects();
        
            //if we have a valid drop target reference
            if(selections.droptarget) {
                //reset the selections array
                clearSelections();

                //reset the target's dragover class
                selections.droptarget.className = 
                    selections.droptarget.className.replace(/ dragover/g, '');

                //reset the target reference
                selections.droptarget = null;
            }
        }
        
    }, false);          

})();




	

